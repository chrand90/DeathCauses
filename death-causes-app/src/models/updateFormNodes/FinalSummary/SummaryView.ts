import CauseNodeResult from "../CauseNodeResult"
import { probOfStillBeingAlive } from "./CommonSummarizerFunctions";

export default function computeSummaryView(causeNodeResults: CauseNodeResult[], ageFrom: number, ageTo: number): SummaryViewData {
    let ages: number[] = Array.from({ length: ageTo - ageFrom + 1 }, (_, i) => ageFrom + i)

    const lifeExpentancy = calculateLifeExpentancy(causeNodeResults, ages)

    let yearsLostToDeathCause: { name: string, value: number }[] = []

    for (let i = 0; i < causeNodeResults.length; i++) {
        let deathCauseNodeResultCopy = causeNodeResults.slice()
        let removedDeathCause = deathCauseNodeResultCopy.splice(i, 1)
        let lifeExpentancyIgnoringCause = calculateLifeExpentancy(deathCauseNodeResultCopy, ages)
        yearsLostToDeathCause.push({ name: removedDeathCause[0].name, value: lifeExpentancyIgnoringCause - lifeExpentancy })
    }

    const survivalProbs = probOfStillBeingAlive(causeNodeResults)
    let probabiliiesOfDyingOfEachDeathCause: { name: string, value: number }[] = []

    causeNodeResults.forEach(cause => {
        probabiliiesOfDyingOfEachDeathCause.push({ name: cause.name, value: calculateProbOfDyingOfDeathcause(cause.probs, survivalProbs) })
    });

    return {
        lifeExpentancy: lifeExpentancy,
        yearsLostToDeathCauses: yearsLostToDeathCause,
        probabiliiesOfDyingOfEachDeathCause: probabiliiesOfDyingOfEachDeathCause
    };
}

export interface SummaryViewData {
    lifeExpentancy: number,
    yearsLostToDeathCauses: DataPoint[]
    probabiliiesOfDyingOfEachDeathCause: DataPoint[]
}

export interface DataPoint {
    name: string,
    value: number
}

function calculateLifeExpentancy(causeNodeResults: CauseNodeResult[], ages: number[]): number {
    const deathCauseProbabilities = causeNodeResults.map((causeNodeResult: CauseNodeResult) => {
        return causeNodeResult.probs;
    })
    const numberOfYears = deathCauseProbabilities[0].length

    let summedProbabilityOfDyingEachYear: number[] = Array.from({ length: numberOfYears })
    summedProbabilityOfDyingEachYear = summedProbabilityOfDyingEachYear.map((_, i) => deathCauseProbabilities.map(val => val[i]).reduce((sum, x) => sum + x, 0))
        .map(x => Math.min(x, 1))

    const survivalProb = probOfStillBeingAlive(causeNodeResults); //contains a 1 in the first entry. 
    let res: number = 0

    for (let i = 0; i < ages.length; i++) {
        res += ages[i] * summedProbabilityOfDyingEachYear[i] * survivalProb[i]
    }
    return res;
}

function calculateProbOfDyingOfDeathcause(probs: number[], survivalProb: number[]) {
    let res = 0;
    for (let i = 0; i < probs.length; i++) {
        res += probs[i] * survivalProb[i]
    }
    return res;
}