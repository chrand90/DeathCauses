import { BestValues, mergeBestValues } from "../../../components/Calculations/ConsensusBestValue";
import { DataRow } from "../../../components/PlottingData";
import { ProbabilityKeyValue } from "../../ProbabilityKeyValue";
import RelationLinks, { NodeType } from "../../RelationLinks";
import CauseNodeResult from "../CauseNodeResult"
import { calculateLifeExpectancy, computeProbOfNotDying, probOfStillBeingAlive } from "./CommonSummarizerFunctions";

export interface LifeExpectancyContributions {
    [key: string]: DataRow
}

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
        const lifeExpectancyWithPerfectInnerCause= calculateLifeExpectancyMultiplied(
            survivalProbForWithoutDisease,
            ageFrom, 
            probs, 
            causeToProportions[innerCause]
        )
        if(totalDifference>1e-12){
            totalInnerCauses[innerCause] = Math.max(lifeExpectancyWithPerfectInnerCause-baseLifeExpectancy,0)/totalDifference
        }
        else{
            totalInnerCauses[innerCause] = 0
        }            
    })
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

function getCauseToProportions(
    allInnerCauses: Set<string>, 
    causeNodeResults: CauseNodeResult[],
    indices: number[]){
    return Object.fromEntries(Array.from(allInnerCauses).map( (innerCauseName) => {
        const innerCauseValues= indices.map( index => {
            const innerCausesOfCause=causeNodeResults[index].perYearInnerCauses
            if(Array.isArray(innerCausesOfCause)){
                if(innerCauseName in innerCausesOfCause[0]){
                    return innerCausesOfCause.map( innerCauseObject => {
                        return innerCauseObject[innerCauseName]
                    })
                }
                return innerCausesOfCause.map( anything => 0)
                
            }
            else{
                if(innerCauseName in innerCausesOfCause){
                    return innerCausesOfCause[innerCauseName]
                }
                return 0
            }
        })
        return [innerCauseName, innerCauseValues]
    }))
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
