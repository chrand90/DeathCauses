import { DataRow } from "../../../components/PlottingData";
import CauseNodeResult from "../CauseNodeResult";
import { FactorAnswerChanges } from "../FactorAnswersToUpdateForm";
import { calculateLifeExpectancy, probOfStillBeingAlive } from "./CommonSummarizerFunctions";
import riskFactorContributions from "./RiskFactorContributions";

export default function computeSummaryView(causeNodeResults: CauseNodeResult[], ageFrom: number, ageTo: number, changes: FactorAnswerChanges): SummaryViewData {
    let ages: number[] = Array.from({ length: ageTo - ageFrom + 1 }, (_, i) => ageFrom + i)

    const survivalProbs = probOfStillBeingAlive(causeNodeResults)
    const lifeExpentancy = calculateLifeExpectancy(survivalProbs, ageFrom)

    let yearsLostToDeathCause: { name: string, value: number }[] = []

    for (let i = 0; i < causeNodeResults.length; i++) {
        let deathCauseNodeResultCopy = causeNodeResults.slice()
        let removedDeathCause = deathCauseNodeResultCopy.splice(i, 1)
        let survivalProbsCopy= probOfStillBeingAlive(removedDeathCause)
        let lifeExpentancyIgnoringCause = calculateLifeExpectancy(survivalProbsCopy, ageFrom)
        yearsLostToDeathCause.push({ name: removedDeathCause[0].name, value: lifeExpentancyIgnoringCause - lifeExpentancy })
    }

    let probabiliiesOfDyingOfEachDeathCause: { name: string, value: number }[] = []

    causeNodeResults.forEach(cause => {
        probabiliiesOfDyingOfEachDeathCause.push({ name: cause.name, value: calculateProbOfDyingOfDeathcause(cause.probs, survivalProbs) })
    });

    let innerCauses = riskFactorContributions(causeNodeResults, ageFrom, ageTo)

    return {
        lifeExpentancyData: { lifeExpentancy: lifeExpentancy, ages: ages, probabilities: survivalProbs },
        yearsLostToDeathCauses: yearsLostToDeathCause,
        probabiliiesOfDyingOfEachDeathCause: findNLargestValues(probabiliiesOfDyingOfEachDeathCause),
        dataSet: innerCauses,
        changes: changes
    };
}

export interface SummaryViewData {
    lifeExpentancyData: LifeExpentancyData,
    yearsLostToDeathCauses: DataPoint[],
    probabiliiesOfDyingOfEachDeathCause: DataPoint[],
    dataSet: DataRow[],
    changes: FactorAnswerChanges
}

export interface DataPoint {
    name: string,
    value: number
}

export interface LifeExpentancyData {
    lifeExpentancy: number
    ages: number[]
    probabilities: number[]
}

function calculateLifeExpentancy2(causeNodeResults: CauseNodeResult[], ages: number[]): number {
    const deathCauseProbabilities = causeNodeResults.map((causeNodeResult: CauseNodeResult) => {
        return causeNodeResult.probs;
    })
    const numberOfYears = deathCauseProbabilities[0].length

    let summedProbabilityOfDyingEachYear: number[] = Array.from({ length: numberOfYears })
    summedProbabilityOfDyingEachYear = summedProbabilityOfDyingEachYear.map((_, i) => deathCauseProbabilities.map(val => val[i]).reduce((sum, x) => sum + x, 0))
        .map(x => Math.min(x, 1))

    const survivalProb = probOfStillBeingAlive(causeNodeResults); //contains a 1 in the first entry. 
    let C: number = 0

    for (let i = 0; i < ages.length; i++) {
        C += ages[i] * summedProbabilityOfDyingEachYear[i] * survivalProb[i]
    }

    let C2: number = survivalProb[survivalProb.length-1]
    let z: number = summedProbabilityOfDyingEachYear[summedProbabilityOfDyingEachYear.length-1]

    return C + C2*(120+(1-z)/z);
}

function calculateProbOfDyingOfDeathcause(probs: number[], survivalProb: number[]) {
    let res = 0;
    for (let i = 0; i < probs.length; i++) {
        res += probs[i] * survivalProb[i]
    }
    return res;
}

function findNLargestValues(data: DataPoint[]) {
    const N = 5
    return data.sort((a, b) => b.value - a.value).slice(0, N)
}
