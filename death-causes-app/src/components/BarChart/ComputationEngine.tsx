import { KnowledgeableOptimizabilities } from "../../models/Optimizabilities";
import { CauseGrouping } from "../../models/RelationLinks";
import { MultifactorGainType } from "../../models/updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy";
import { BestValues, getMultifactorGainStatement, getUnexplainedStatement, LongConsensus, mergeBestValues } from "../Calculations/ConsensusBestValue";
import { DataRow, DataSet } from "../PlottingData";
import BarChartSettings from "./BarChartSettings";

export interface SquareSection {
    name: string,
    cause: string,
    x0: number,
    x: number,
    comparison?: string,
    longComparison?: LongConsensus,
}

interface ProbSums {
    [innerCause: string]: number;
}
interface ParentToDataRows {
    [name:string]: DataRow[]
}

function getOccurences(listOfDatRows: DataRow[]){
    let probSums: ProbSums={}
    listOfDatRows.forEach((datRow: DataRow) => {
        Object.entries(datRow.innerCauses).forEach(([innerCause, prob]) => {
            if(innerCause in probSums){
                probSums[innerCause]+=prob*datRow.totalProb
            }
            else{
                probSums[innerCause]=prob*datRow.totalProb
            }
        })
    })
    return probSums;
}

const zeroTruncater = (num: number) => Math.max(0,num)

function makeTruncater(maxval: number| null){
    if(maxval){
        return (num: number) => Math.min(maxval, Math.max(num,0))
    }
    else{
        return (num: number) => Math.max(0,num)
    }
}

function makeRowSquare(
    datRows: DataRow[], 
    parent:string, 
    max: number | null,
    mergeAcross: boolean,
    structureIfNotMerged: CauseGrouping,
    optimizabilities: KnowledgeableOptimizabilities,
    barChartSettings: BarChartSettings
    ):{squares:SquareSection[], totalProb:number}{
    let squares=[];
    let rescaler=1
    let totalProb=datRows.map(d=>d.totalProb).reduce((a,b)=>a+b,0);
    if(max && max>1e-8 && totalProb>1e-8 && max<totalProb){
        rescaler=max/totalProb
    }
    let normalizer=totalProb;
    if(totalProb<1e-8){
        normalizer=1.0
    }
    const total_explained= datRows.map( datRow=> {
        return Object.values(datRow.innerCauses).reduce((a, b) => a + b,0)*datRow.totalProb
    }).reduce((a,b)=>a+b,0)/normalizer;
    const unexplained=1.0-total_explained
    let explainedSoFar=0;
    const comparators:BestValues[]=datRows.map((datRow)=>{
        return datRow.comparisonWithBestValues
    }).filter((d): d is BestValues => {
        return d!==undefined;
    });
    const combinedBestValues=comparators.length>0 ? mergeBestValues(comparators) : undefined;
    if(mergeAcross){
        
        
        squares.push({
            name: parent,
            cause: 'Unexplained',
            x0:zeroTruncater(explainedSoFar)*rescaler,
            x: zeroTruncater(unexplained*totalProb)*rescaler,
            longComparison: getUnexplainedStatement(unexplained,totalProb, parent, barChartSettings.descriptions, barChartSettings.getUseLifeExpectancy(), barChartSettings.getConditionVizFlavor())
        });
        explainedSoFar=unexplained*totalProb;
        let widthOfEachInnerCause=getOccurences(datRows);
        let innerCauses=Object.keys(widthOfEachInnerCause)
        if(combinedBestValues){
            innerCauses.sort((a,b) => {
                return optimizabilities.getOptimizability(a)-optimizabilities.getOptimizability(b)
            })
        }
        
        
        innerCauses.forEach((innerCause:string)=>{
            let width=widthOfEachInnerCause[innerCause];
            let longStatement: LongConsensus | undefined;
            let statement: string | undefined;
            if(innerCause===MultifactorGainType.KNOWN){
                statement=barChartSettings.descriptions.getDescription(MultifactorGainType.KNOWN, 80)
                longStatement=getMultifactorGainStatement(
                    totalProb>1e-8 ? width/totalProb : 0,
                    totalProb,
                    parent,
                    barChartSettings.descriptions,
                    MultifactorGainType.KNOWN
                )
            }
            else if(innerCause===MultifactorGainType.UNKNOWN){
                statement=barChartSettings.descriptions.getDescription(MultifactorGainType.UNKNOWN,80)
                longStatement=getMultifactorGainStatement(
                    totalProb>1e-8 ? width/totalProb : 0,
                    totalProb,
                    parent,
                    barChartSettings.descriptions,
                    MultifactorGainType.UNKNOWN
                )
            }
            else{
                statement=combinedBestValues?.getConsensusStatement(innerCause, barChartSettings.descriptions, barChartSettings.getUseLifeExpectancy())
                longStatement=combinedBestValues?.getLongConsensusStatement(
                innerCause,
                totalProb>1e-8 ? width/totalProb : 0,
                totalProb,
                parent,
                barChartSettings.descriptions,
                barChartSettings.getUseLifeExpectancy(),
                optimizabilities,
                barChartSettings.getConditionVizFlavor()
                );
            }
            
            squares.push({
                name: parent,
                cause: innerCause,
                x0: zeroTruncater(explainedSoFar)*rescaler,
                x: zeroTruncater(explainedSoFar+width)*rescaler,
                comparison: statement,
                longComparison: longStatement
            });
            explainedSoFar+=width;
        })
    }
    else{
        let subParentsToRows: ParentToDataRows= computeParentToRows(datRows, structureIfNotMerged);
        let explainedSoFar=0;
        Object.entries(subParentsToRows).forEach( ([subParent, subDatRows]) => {
            const unexplainedByGroup=subDatRows.map((subDatRow: DataRow) =>{
                return (1-Object.values(subDatRow.innerCauses).reduce((a,b) => a+b,0))*subDatRow.totalProb
            }).reduce((a,b)=>a+b,0)
            squares.push(
                {
                    name: subParent,
                    cause: "Unexplained",
                    x0: zeroTruncater(explainedSoFar)*rescaler,
                    x: zeroTruncater(explainedSoFar+unexplainedByGroup)*rescaler
                }
            )
            explainedSoFar+=unexplainedByGroup
        })
        let widthOfEachInnerCause=getOccurences(datRows);
        let innerCauses=Object.keys(widthOfEachInnerCause)
        if(combinedBestValues){
            innerCauses.sort((a,b) => {
                return optimizabilities.getOptimizability(a)-optimizabilities.getOptimizability(b)
            })
        }
        innerCauses.forEach(innerCause=>{
            Object.entries(subParentsToRows).forEach( ([subParent, subDatRows]) =>{
                let contrib=0;
                let innerCauseInGroup=false;
                subDatRows.forEach((subDatRow: DataRow) =>{
                    if(innerCause in subDatRow.innerCauses){
                        innerCauseInGroup=true;
                        contrib+=subDatRow.innerCauses[innerCause]*subDatRow.totalProb
                    }
                })
                if(innerCauseInGroup){
                    squares.push(
                        {
                            name: subParent,
                            cause: innerCause,
                            x0: zeroTruncater(explainedSoFar)*rescaler,
                            x: zeroTruncater(explainedSoFar+contrib)*rescaler
                        }
                    )
                    explainedSoFar+=contrib
                }
            })
        })   
    }
    
    return {squares, totalProb};
}

function computeParentToRows(res_dat: DataSet, grouping: CauseGrouping | undefined){
    let parentToRows: ParentToDataRows={}
    Object.values(res_dat).forEach((datRow) => {
        const parent=grouping ? grouping.causeToParent[datRow.name] : datRow.name;
        if(parent in parentToRows){
            parentToRows[parent].push(datRow)
        }
        else{
            parentToRows[parent]=[datRow]
        }
    })
    return parentToRows
}


function make_squares(
    res_dat: DataSet, 
    setToWidth: string | null, 
    grouping: CauseGrouping | undefined,
    optimizabilities: KnowledgeableOptimizabilities,
    barChartSettings: BarChartSettings,
    noMergeAcross: {[key:string]: CauseGrouping}={}
):{allSquares: SquareSection[], totalProbs: DataRow[]}
{
    let parentToRows= computeParentToRows(res_dat, grouping);
    let max: number | null=null; 
    if(setToWidth && setToWidth in parentToRows){
        max=Object.entries(parentToRows).filter(([parent, datRows])=> {
            return parent===setToWidth
        })[0][1].map((d:DataRow) => d.totalProb).reduce((a,b)=>a+b,0)
    }
    let squareSections: SquareSection[][]=[];
    let totalProbs:DataRow[]=[]
    Object.entries(parentToRows).forEach(([parent, datRows])=> {
        const {squares,totalProb}= makeRowSquare(
            datRows, 
            parent, 
            max, 
            !(parent in noMergeAcross),
            parent in noMergeAcross ? noMergeAcross[parent] : ({} as CauseGrouping),
            optimizabilities,
            barChartSettings
        )
        squareSections.push(squares)
        totalProbs.push({
            name:parent,
            innerCauses:{},
            totalProb:totalProb
        })
    })
    const allSquares = ([] as SquareSection[]).concat(...squareSections);
    return {allSquares, totalProbs};
};



export default make_squares;
