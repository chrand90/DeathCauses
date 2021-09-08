import { BestValues, mergeBestValues } from "../../../components/Calculations/ConsensusBestValue";
import { DataRow } from "../../../components/PlottingData";
import { EVALUATION_UNIT } from "../../../stores/AdvancedOptionsStore";
import { ProbabilityKeyValue } from "../../ProbabilityKeyValue";
import RelationLinks, { NodeType } from "../../RelationLinks";
import CauseNodeResult from "../CauseNodeResult"
import { FactorAnswerChanges } from "../FactorAnswersToUpdateForm";
import { calculateLifeExpectancy, getAgeArray, probOfStillBeingAlive } from "./CommonSummarizerFunctions";

export interface DeathCauseContributions {
    evaluationUnit: EVALUATION_UNIT,
    baseLifeExpectancy: number,
    survivalProbs: number[],
    ages: number[],
    costPerCause: InnerCause
}

export interface DeathCauseContributionsAndChanges extends DeathCauseContributions {
    changes: FactorAnswerChanges
}

export interface InnerCause {
    [key: string]: DataRow
}

const UNEXPLAINED_YEARS_LOST="UnexplainedLifeExpectancy"
const EXPLAINED_YEARS_LOST="ExplainedLifeExpectancy"
export enum MultifactorGainType {
    KNOWN="multigain known",
    UNKNOWN="multigain unknown"
}
export default function riskFactorContributionsLifeExpectancy(
    causeNodeResults: CauseNodeResult[], 
    ageFrom:number,
    rdat: RelationLinks): DeathCauseContributions {

    const survivalProb=probOfStillBeingAlive(causeNodeResults);
    const baseLifeExpectancy= calculateLifeExpectancy(survivalProb, ageFrom);
    const nameToIndex=makeCauseNodeResultDictionary(causeNodeResults);
    const ages = getAgeArray(ageFrom, ageFrom + survivalProb.length - 2)

    let costPerCause= Object.fromEntries(
        rdat.sortedNodes[NodeType.CAUSE]
            .concat(rdat.sortedNodes[NodeType.CAUSE_CATEGORY])
            .map(causeName => {
                const causesInvolved= rdat.getSuperDescendants(causeName);
                const indices= causesInvolved.map(causeNameInvolved => nameToIndex[causeNameInvolved]);
                return [
                    causeName, 
                    makeDataRow(
                        causeNodeResults,
                        ageFrom,
                        indices,
                        causeName,
                        baseLifeExpectancy)
                    ]

            })
        )
    const indices= Object.values(nameToIndex)
    costPerCause["any cause"]=makeDataRow(
        causeNodeResults,
        ageFrom,
        indices,
        "any cause",
        baseLifeExpectancy
    ) 

    return {costPerCause: costPerCause, baseLifeExpectancy: baseLifeExpectancy, ages: ages, survivalProbs: survivalProb.slice(1), evaluationUnit: EVALUATION_UNIT.YEARS_LOST};
}

function listOflistsToSet(ll: string[][]):Set<string>{
    const res= new Set<string>();
    ll.forEach(l => {
        l.forEach(s => {
            res.add(s)
        })
    })
    return res;
}

function extractInnerCauses(causeNodeResult: CauseNodeResult){
    if(Array.isArray(causeNodeResult.perYearInnerCauses)){
        return Object.keys(causeNodeResult.perYearInnerCauses[0])
    }
    else{
        return Object.keys(causeNodeResult.perYearInnerCauses)
    }
}

function makeDataRow(
    causeNodeResults: CauseNodeResult[],
    ageFrom: number,
    indices: number[],
    causeName: string,
    baseLifeExpectancy:number
    ){
    //These survival probs are higher because the cause are not in it.
    let survivalProbForWithoutDisease: number[];
    let totalDifference: number;
    const onlyRemoveRiskFactors= causeNodeResults.length === indices.length
    if(!onlyRemoveRiskFactors){
        survivalProbForWithoutDisease=probOfStillBeingAlive(causeNodeResults, indices);
        const withoutCauseExpectancy=calculateLifeExpectancy(survivalProbForWithoutDisease, ageFrom)
        totalDifference=withoutCauseExpectancy-baseLifeExpectancy;
    }
    else{
        survivalProbForWithoutDisease=causeNodeResults[0].probs.map(i=>1).concat([1])
        totalDifference=1
    }
    const innerCauses= indices.map(index => causeNodeResults[index]).map(extractInnerCauses)
    const allInnerCauses=listOflistsToSet(innerCauses)

    let totalInnerCauses: ProbabilityKeyValue={};
    const probs=indices.map(index => {
        return causeNodeResults[index].probs;
    })
    let causeToProportions:{[key: string]: (number[] | number)[]}= getCauseToProportions(
        allInnerCauses,
        causeNodeResults,
        indices
    )
    allInnerCauses.forEach((innerCause: string) => {
        insertGainInDictionary(
            totalInnerCauses,
            survivalProbForWithoutDisease,
            probs,
            ageFrom,
            totalDifference,
            baseLifeExpectancy,
            causeToProportions[innerCause],
            innerCause)
    });
    insertGainInDictionary(
        totalInnerCauses,
        survivalProbForWithoutDisease,
        probs,
        ageFrom,
        totalDifference,
        baseLifeExpectancy,
        causeToProportions[EXPLAINED_YEARS_LOST],
        MultifactorGainType.KNOWN
    )
    if(onlyRemoveRiskFactors){
        totalDifference=sumKnownFactors(totalInnerCauses, [UNEXPLAINED_YEARS_LOST])
        if(totalDifference>1e-10){
            Object.keys(totalInnerCauses).forEach(
                key => {
                    totalInnerCauses[key]=totalInnerCauses[key]/totalDifference
                }
            )
        }
        else{
            Object.keys(totalInnerCauses).forEach(
                key => {
                    totalInnerCauses[key]=0
                }
            )
        }
    }
    else{
        insertGainInDictionary(
            totalInnerCauses,
            survivalProbForWithoutDisease,
            probs,
            ageFrom,
            totalDifference,
            baseLifeExpectancy,
            causeToProportions[UNEXPLAINED_YEARS_LOST],
            MultifactorGainType.UNKNOWN
        )
    }
    let bestValues: BestValues | undefined=undefined;
    if(indices.length>1){
        const unfilteredlistOfBestValues=indices.map(index => causeNodeResults[index].bestValues)
        const listOfBestValues=unfilteredlistOfBestValues.filter(d => {
            return d!==undefined
        })
        if(listOfBestValues.length===1){
            bestValues=listOfBestValues[0]
        }
        if(listOfBestValues.length>1){
            bestValues= mergeBestValues(listOfBestValues as BestValues[])
        }
    }
    else{
        bestValues = causeNodeResults[indices[0]].bestValues
    }
    return {
        name: causeName,
        comparisonWithBestValues: bestValues,
        innerCauses: totalInnerCauses,
        totalProb: totalDifference,
    }
}

function triviallyZero(toCheck: (number | number[])[]){
    return toCheck.every(listOrNum => {
        if(Array.isArray(listOrNum)){
            return listOrNum.every( num => {
                return num<1e-10
            })
        }
        else {
            return listOrNum<1e-10
        }
    })
}


function insertGainInDictionary(
    dicToInsertInto: {[key:string]: number},
    survivalProbForWithoutDisease: number[],
    probs: number[][],
    ageFrom: number,
    totalDifference: number,
    baseLifeExpectancy: number,
    multiplier: (number | number[])[],
    insertIntoKey: string
){
    if(triviallyZero(multiplier)){
        dicToInsertInto[insertIntoKey]=0
        return 
    }
    const lifeExpectancyWithPerfectInnerCause=calculateLifeExpectancyMultiplied(
        survivalProbForWithoutDisease,
        ageFrom,
        probs,
        multiplier
    )
    if(totalDifference>1e-10){
        let contrib: number=Math.max(lifeExpectancyWithPerfectInnerCause-baseLifeExpectancy,0)/totalDifference
        if(insertIntoKey===MultifactorGainType.KNOWN){       
            const explained=sumKnownFactors(dicToInsertInto, [UNEXPLAINED_YEARS_LOST, EXPLAINED_YEARS_LOST])
            contrib = contrib-explained;
        }
        if(insertIntoKey===MultifactorGainType.UNKNOWN){
            const explainedAlready= sumKnownFactors(dicToInsertInto, [UNEXPLAINED_YEARS_LOST])
            contrib=1.0-contrib-explainedAlready
        }
        if(contrib>1e-9){
            dicToInsertInto[insertIntoKey] = contrib
        }
        else{
            dicToInsertInto[insertIntoKey] = 0;
        }
        
    }
    else{
        dicToInsertInto[insertIntoKey] = 0
    }    
}

function sumKnownFactors(innerCauseObject: {[key:string]: number}, notCounted:string[]=[]){
    return Object.entries(innerCauseObject).map(
        ([factorName, responsibility]) => {
            if(!notCounted.includes(factorName)){
                return responsibility
            }
            return 0
        }
    ).reduce((a,b)=>a+b,0)
}

function getExplained(innerCauseObject: {[key:string]: number}){
    const explained=Object.values(innerCauseObject).reduce((a,b) => a+b ,0)
    return Math.max(0,explained)
}

function getProportions(causeNodeResults: CauseNodeResult[], indices: number[], innerCauseName: string){
    return indices.map( index => {
        const innerCausesOfCause=causeNodeResults[index].perYearInnerCauses
        if(Array.isArray(innerCausesOfCause)){
            if(innerCauseName in innerCausesOfCause[0]){
                return innerCausesOfCause.map( innerCauseObject => {
                    return innerCauseObject[innerCauseName]
                })
            }
            else if(innerCauseName===EXPLAINED_YEARS_LOST){
                return innerCausesOfCause.map( innerCauseObject => {
                    return getExplained(innerCauseObject)
                })
            }
            else if(innerCauseName===UNEXPLAINED_YEARS_LOST){
                return innerCausesOfCause.map( innerCauseObject => {
                    return Math.max(0,1.0-getExplained(innerCauseObject))
                })
            }
            return innerCausesOfCause.map( anything => 0)
            
        }
        else{
            if(innerCauseName in innerCausesOfCause){
                return innerCausesOfCause[innerCauseName]
            }
            else if(innerCauseName===EXPLAINED_YEARS_LOST){
                return getExplained(innerCausesOfCause)
            }
            else if(innerCauseName===UNEXPLAINED_YEARS_LOST){
                return Math.max(0,1.0-getExplained(innerCausesOfCause))
            }
            return 0
        }
    })
}

function getCauseToProportions(
    allInnerCauses: Set<string>, 
    causeNodeResults: CauseNodeResult[],
    indices: number[],
    addUnexplained: boolean =true){
    const allProportions= Object.fromEntries(Array.from(allInnerCauses).map( (innerCauseName) => {
        return [innerCauseName, getProportions(causeNodeResults, indices, innerCauseName)]
    }))
    if(Object.keys(allProportions).length>0){
        if(addUnexplained){
            allProportions[UNEXPLAINED_YEARS_LOST]=getProportions(causeNodeResults, indices, UNEXPLAINED_YEARS_LOST);
        }
        allProportions[EXPLAINED_YEARS_LOST]=getProportions(causeNodeResults, indices, EXPLAINED_YEARS_LOST);
    }
    else{
        if(addUnexplained){
            allProportions[UNEXPLAINED_YEARS_LOST]=indices.map(i => 1.0);
        }
        allProportions[EXPLAINED_YEARS_LOST]=indices.map(i => 0.0);
    }
    return allProportions;
}

function getEntry(index: number, entry: number | number[]): number{
    if(Array.isArray(entry)){
        return entry[index]
    }
    return entry
}

export function calculateLifeExpectancyMultiplied(
    survivalCurveWithout: number[], 
    ageFrom: number, 
    probs: number[][], 
    multiplied: (number | number[])[]
    ): number {
    let adjustedSurvivalCurve=[1];
    for(let i=0; i<probs[0].length; i++){
        let probVal= probs.map((prob, index) => {
            const reduction= multiplied[index]
            return prob[i]*(1-getEntry(i, reduction))
        }).reduce((a,b) => a+b, 0)
        let probabilityOfDyingThisYear=(1-survivalCurveWithout[i+1]/survivalCurveWithout[i])+probVal
        adjustedSurvivalCurve.push(adjustedSurvivalCurve[i]*(1-probabilityOfDyingThisYear))
    }
    return calculateLifeExpectancy(adjustedSurvivalCurve, ageFrom);
}

function makeCauseNodeResultDictionary(causeNodeResults: CauseNodeResult[]){
    const causeNameToIndex= Object.fromEntries(causeNodeResults.map( (causeNodeResult,index) => {
        return [causeNodeResult.name, index]
    } ))
    return causeNameToIndex
}
