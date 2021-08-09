import { DataRow } from "../../../components/PlottingData";
import { ProbabilityKeyValue } from "../../ProbabilityKeyValue";
import CauseNodeResult from "../CauseNodeResult"
import { calculateLifeExpectancy, computeProbOfNotDying, probOfStillBeingAlive } from "./CommonSummarizerFunctions";

export default function riskFactorContributionsLifeExpectancy(causeNodeResults: CauseNodeResult[], ageFrom:number, ageTo:number): DataRow[]{

    const survivalProb=probOfStillBeingAlive(causeNodeResults);
    const baseLifeExpectancy= calculateLifeExpectancy(survivalProb, ageFrom);

    let res= causeNodeResults.map((causeNodeRes: CauseNodeResult, index: number) =>{

        //These survival probs are higher because the cause are not in it.
        const survivalProbForWithoutDisease=probOfStillBeingAlive(causeNodeResults, [index]);
        const withoutCauseExpectancy=calculateLifeExpectancy(survivalProbForWithoutDisease, ageFrom)
        const totalDifference=withoutCauseExpectancy-baseLifeExpectancy;
        let totalInnerCauses: ProbabilityKeyValue={};
        if(Array.isArray(causeNodeRes.perYearInnerCauses)){
            const innerCauseNames=Object.keys(causeNodeRes.perYearInnerCauses[0])
            let causeToYearlyProportions:{[key: string]: number[]}=
                Object.fromEntries(innerCauseNames.map( causeName => {
                    const s=(causeNodeRes.perYearInnerCauses as any[]).map( causeToNumber  => {
                        return causeToNumber[causeName]
                    })
                    return [causeName, s]
                }))
            innerCauseNames.forEach(innerCause => {
                const lifeExpectancyWithPerfectInnerCause= calculateLifeExpectancyMultiplied(
                    survivalProbForWithoutDisease,
                    ageFrom, 
                    causeNodeRes.probs, 
                    causeToYearlyProportions[innerCause]
                )
                if(totalDifference>1e-12){
                    totalInnerCauses[innerCause]= (lifeExpectancyWithPerfectInnerCause-baseLifeExpectancy)/totalDifference
                }
                else{
                    totalInnerCauses[innerCause]= 0
                }            })
        }
        else{
            const innerCauseNames=Object.keys(causeNodeRes.perYearInnerCauses)
            innerCauseNames.forEach(innerCause => {
                const lifeExpectancyWithPerfectInnerCause= calculateLifeExpectancyMultiplied(
                    survivalProbForWithoutDisease,
                    ageFrom, 
                    causeNodeRes.probs, 
                    (causeNodeRes.perYearInnerCauses as any)[innerCause]
                )
                if(totalDifference>1e-12){
                    totalInnerCauses[innerCause]= (lifeExpectancyWithPerfectInnerCause-baseLifeExpectancy)/totalDifference

                }
                else{
                    totalInnerCauses[innerCause]= 0
                }
                
            })
        }
        return {
            name: causeNodeRes.name,
            comparisonWithBestValues: causeNodeRes.bestValues,
            innerCauses: totalInnerCauses,
            totalProb: totalDifference,
        }
        
    })
    return res;
 
}

export function calculateLifeExpectancyMultiplied(
    survivalCurveWithout: number[], 
    ageFrom: number, 
    probs: number[], 
    multiplied: number | number[]
    ): number {
    let adjustedSurvivalCurve=[1];
    if(Array.isArray(multiplied)){
        for(let i=0; i<probs.length; i++){
            let probabilityOfDyingThisYear=(1-survivalCurveWithout[i+1]/survivalCurveWithout[i])+probs[i]*(1-multiplied[i])
            adjustedSurvivalCurve.push(adjustedSurvivalCurve[i]*(1-probabilityOfDyingThisYear))
        }
    }
    else{
        for(let i=0; i<probs.length; i++){
            let probabilityOfDyingThisYear=(1-survivalCurveWithout[i+1]/survivalCurveWithout[i])+probs[i]*(1-multiplied)
            adjustedSurvivalCurve.push(adjustedSurvivalCurve[i]*(1-probabilityOfDyingThisYear))
        }
    }
    return calculateLifeExpectancy(adjustedSurvivalCurve, ageFrom);
}
