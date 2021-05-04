import { DataRow } from "../../../components/PlottingData";
import { ProbabilityKeyValue } from "../../ProbabilityKeyValue";
import CauseNodeResult from "../CauseNodeResult"
import { computeProbOfNotDying, probOfStillBeingAlive } from "./CommonSummarizerFunctions";

export default function riskFactorContributions(causeNodeResults: CauseNodeResult[], ageFrom:number, ageTo:number): DataRow[]{

    const survivalProb=probOfStillBeingAlive(causeNodeResults);
    let res= causeNodeResults.map((causeNodeRes: CauseNodeResult) =>{
        const weightOfYears=causeNodeRes.probs.map((prob,i) => {
            return prob*survivalProb[i];
        })
        const totalProb=weightOfYears.reduce((a,b)=>a+b,0);
        let totalInnerCauses: ProbabilityKeyValue={};
        if(Array.isArray(causeNodeRes.perYearInnerCauses)){
            causeNodeRes.perYearInnerCauses.forEach((causeToNumber,i) => {
                Object.entries(causeToNumber).forEach(([cause, proportion]) => {
                    if(cause in totalInnerCauses){
                        totalInnerCauses[cause]+= proportion*weightOfYears[i]/totalProb;
                    }
                    else{
                        totalInnerCauses[cause]= proportion*weightOfYears[i]/totalProb;
                    }
                })
            })
        }
        else{
            totalInnerCauses=causeNodeRes.perYearInnerCauses;
        }
        return {
            name: causeNodeRes.name,
            comparisonWithBestValues: causeNodeRes.bestValues,
            innerCauses: totalInnerCauses,
            totalProb: totalProb,
        }
        
    })
    return res;

}

