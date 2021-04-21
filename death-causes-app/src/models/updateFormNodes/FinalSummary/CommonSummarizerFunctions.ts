import CauseNodeResult from "../CauseNodeResult";
import survivalCurve from "./SurvivalCurve";

export function computeProbOfNotDying(causeNodeResults: CauseNodeResult[]){

    const deathCauseProbabilities= causeNodeResults.map((causeNodeResult: CauseNodeResult) => {
        return causeNodeResult.probs;
    })

    const numberOfYears=deathCauseProbabilities[0].length

    let totalProbabilityOfNotDying: number[] = Array.from({ length: numberOfYears })
    totalProbabilityOfNotDying = totalProbabilityOfNotDying.map((_, i) => deathCauseProbabilities.map(val => val[i]).reduce((sum, x) => sum + x, 0))
        .map(x => Math.max(0,1 - x))

    return totalProbabilityOfNotDying
}

export function probOfStillBeingAlive(causeNodeResults: CauseNodeResult[]){
    const probOfNotDying= computeProbOfNotDying(causeNodeResults);
    const survivalCurve: number[]=[1]
    for (let i = 1; i <= probOfNotDying.length; i++) {
        survivalCurve.push(survivalCurve[i - 1] * probOfNotDying[i-1])
    }
    return survivalCurve
}