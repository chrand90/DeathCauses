import { CauseGrouping } from "../models/RelationLinks";
import { DataRow, DataSet } from "./PlottingData";

export interface SquareSection {
    name: string,
    cause: string,
    x0: number,
    x: number
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
    mergeAcross: boolean
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
    if(mergeAcross){
        squares.push({
            name: parent,
            cause: 'Unexplained',
            x0:zeroTruncater(explainedSoFar)*rescaler,
            x: zeroTruncater(unexplained*totalProb)*rescaler
        });
        explainedSoFar=unexplained*totalProb;
        let widthOfEachInnerCause=getOccurences(datRows);
        Object.entries(widthOfEachInnerCause).forEach(([innerCause, width])=>{
            squares.push({
                name: parent,
                cause: innerCause,
                x0: zeroTruncater(explainedSoFar)*rescaler,
                x: zeroTruncater(explainedSoFar+width)*rescaler
            });
            explainedSoFar+=width;
        })
    }
    else{
        datRows.forEach( datRow => {
            const unexplainedByThisRow= (1.0-Object.values(datRow.innerCauses).reduce( (a,b) => a+b,0))*datRow.totalProb
            squares.push({
                name: datRow.name,
                cause: "Unexplained",
                x0: zeroTruncater(explainedSoFar)*rescaler,
                x: zeroTruncater((explainedSoFar+unexplainedByThisRow))*rescaler
            })
            explainedSoFar+=unexplainedByThisRow
        })
        let widthOfEachInnerCause=getOccurences(datRows);
        Object.keys(widthOfEachInnerCause).forEach(innerCause=>{
            datRows.forEach( (datRow) => {
                if(innerCause in datRow.innerCauses){
                    const width= datRow.innerCauses[innerCause]*datRow.totalProb
                    squares.push({
                        name: datRow.name,
                        cause: innerCause,
                        x0: zeroTruncater(explainedSoFar)*rescaler,
                        x: zeroTruncater(explainedSoFar+width)*rescaler
                    });
                    explainedSoFar+=width;
                }
            }) 
        })   
    }
    
    return {squares, totalProb};
}


function make_squares(
    res_dat: DataSet, 
    setToWidth: string | null, 
    grouping: CauseGrouping,
    mergeAcross: boolean=true
):{allSquares: SquareSection[], totalProbs: DataRow[]}

{
    let parentToRows: ParentToDataRows={}
    res_dat.forEach((datRow) => {
        const parent=grouping.causeToParent[datRow.name]
        if(parent in parentToRows){
            parentToRows[parent].push(datRow)
        }
        else{
            parentToRows[parent]=[datRow]
        }
    })
    let max: number | null=null; 
    if(setToWidth && setToWidth in parentToRows){
        max=Object.entries(parentToRows).filter(([parent, datRows])=> {
            return parent===setToWidth
        })[0][1].map((d:DataRow) => d.totalProb).reduce((a,b)=>a+b,0)
    }
    let squareSections: SquareSection[][]=[];
    let totalProbs:DataRow[]=[]
    Object.entries(parentToRows).forEach(([parent, datRows])=> {
        const {squares,totalProb}= makeRowSquare(datRows, parent, max, mergeAcross)
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