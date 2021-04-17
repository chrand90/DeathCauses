import { SurvivalCurveData } from "../../../components/Calculations/SurvivalCurveData"
import CauseNodeResult from "../CauseNodeResult"
import { probOfStillBeingAlive } from "./CommonSummarizerFunctions";

export default function survivalCurve(causeNodeResults: CauseNodeResult[], ageFrom:number, ageTo:number):SurvivalCurveData[]{

    const survivalProb=probOfStillBeingAlive(causeNodeResults); //contains a 1 in the first entry. 
    let res: SurvivalCurveData[]=[]
    for (let i = 1; i < survivalProb.length; i++) {
        res.push({age: i+ageFrom, prob: survivalProb[i]});
    }
    console.log(res);
    return res;
}