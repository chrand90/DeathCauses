import { BestValues, mergeBestValues } from "../../../components/Calculations/ConsensusBestValue";
import { DataRow } from "../../../components/PlottingData";
import { ProbabilityKeyValue } from "../../ProbabilityKeyValue";
import RelationLinks, { NodeType } from "../../RelationLinks";
import CauseNodeResult from "../CauseNodeResult"
import { calculateLifeExpectancy, computeProbOfNotDying, probOfStillBeingAlive } from "./CommonSummarizerFunctions";

export interface LifeExpectancyContributions {
    [key: string]: DataRow
}

const UNEXPLAINED_YEARS_LOST="UnexplainedLifeExpectancy"
export const MULTIFACTOR_GAIN="MultifactorGain"

export default function riskFactorContributionsLifeExpectancy(
    causeNodeResults: CauseNodeResult[], 
    ageFrom:number,
    rdat: RelationLinks): LifeExpectancyContributions {

    const survivalProb=probOfStillBeingAlive(causeNodeResults);
    const baseLifeExpectancy= calculateLifeExpectancy(survivalProb, ageFrom);
    const nameToIndex=makeCauseNodeResultDictionary(causeNodeResults);

    let res= Object.fromEntries(
        rdat.sortedNodes[NodeType.CAUSE]
            .concat(rdat.sortedNodes[NodeType.CAUSE_CATEGORY])
            .map(causeName => {
                return [
                    causeName, 
                    makeDataRow(
                        causeNodeResults,
                        ageFrom,
                        rdat,
                        nameToIndex,
                        causeName,
                        baseLifeExpectancy)
                    ]

            })
        )
    return res;
 
}

function makeDataRow(
    causeNodeResults: CauseNodeResult[],
    ageFrom: number,
    rdat: RelationLinks,
    nameToIndex: {[k: string]: number;},
    causeName: string,
    baseLifeExpectancy:number    
    ){
    const causesInvolved= rdat.getSuperDescendants(causeName);
    const indices= causesInvolved.map(causeNameInvolved => nameToIndex[causeNameInvolved]);
    //These survival probs are higher because the cause are not in it.
    const survivalProbForWithoutDisease=probOfStillBeingAlive(causeNodeResults, indices);
    const withoutCauseExpectancy=calculateLifeExpectancy(survivalProbForWithoutDisease, ageFrom)
    const totalDifference=withoutCauseExpectancy-baseLifeExpectancy;
    const innerCauses= indices.map(index => causeNodeResults[index]).map(causeNodeRes => {
        if(Array.isArray(causeNodeRes.perYearInnerCauses)){
            return Object.keys(causeNodeRes.perYearInnerCauses[0])
        }
        else{
            return Object.keys(causeNodeRes.perYearInnerCauses)
        }
    })
    const allInnerCauses=new Set<string>();
    innerCauses.forEach(innerCauseList => {
        innerCauseList.forEach(innerCause => {
            allInnerCauses.add(innerCause)
        })
    })
    let totalInnerCauses: ProbabilityKeyValue={};
    const yearly=indices.some( index => {
        return Array.isArray(causeNodeResults[index].perYearInnerCauses)
    })
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
        causeToProportions[UNEXPLAINED_YEARS_LOST],
        MULTIFACTOR_GAIN
    )
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
    const lifeExpectancyWithPerfectInnerCause=calculateLifeExpectancyMultiplied(
        survivalProbForWithoutDisease,
        ageFrom,
        probs,
        multiplier
    )
    if(totalDifference>1e-12){
        if(insertIntoKey===MULTIFACTOR_GAIN){
            const unexplained= Math.max(lifeExpectancyWithPerfectInnerCause-baseLifeExpectancy,0)/totalDifference
            const notExplainedNotUnexplained = 1.0-Object.values(dicToInsertInto).reduce((a,b)=>a+b,0)-unexplained;
            if(notExplainedNotUnexplained<-1e-10){
                console.error("The multifactor part was smaller than 0: ",notExplainedNotUnexplained)
            }
            dicToInsertInto[insertIntoKey] = Math.max(notExplainedNotUnexplained,0)
        }
        else{
            dicToInsertInto[insertIntoKey] = Math.max(lifeExpectancyWithPerfectInnerCause-baseLifeExpectancy,0)/totalDifference
        }
    }
    else{
        dicToInsertInto[insertIntoKey] = 0
    }    
}

function getUnexplained(innerCauseObject: {[key:string]: number}){
    const explained=Object.values(innerCauseObject).reduce((a,b) => a+b ,0)
    return Math.max(0,1.0-explained)
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
            else if(innerCauseName===UNEXPLAINED_YEARS_LOST){
                return innerCausesOfCause.map( innerCauseObject => {
                    return getUnexplained(innerCauseObject)
                })
            }
            return innerCausesOfCause.map( anything => 0)
            
        }
        else{
            if(innerCauseName in innerCausesOfCause){
                return innerCausesOfCause[innerCauseName]
            }
            else if(innerCauseName===UNEXPLAINED_YEARS_LOST){
                return getUnexplained(innerCausesOfCause)
            }
            return 0
        }
    })
}

function getCauseToProportions(
    allInnerCauses: Set<string>, 
    causeNodeResults: CauseNodeResult[],
    indices: number[]){
    const allProportions= Object.fromEntries(Array.from(allInnerCauses).map( (innerCauseName) => {
        return [innerCauseName, getProportions(causeNodeResults, indices, innerCauseName)]
    }))
    if(Object.keys(allProportions).length>0){
        allProportions[UNEXPLAINED_YEARS_LOST]=getProportions(causeNodeResults, indices, UNEXPLAINED_YEARS_LOST);
    }
    else{
        allProportions[UNEXPLAINED_YEARS_LOST]=indices.map(i => 1.0);
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
