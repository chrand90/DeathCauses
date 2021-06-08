import { DataRow, DataSet } from "../../../components/PlottingData";
import CauseNodeResult from "../CauseNodeResult"
import { probOfStillBeingAlive } from "./CommonSummarizerFunctions";
import riskFactorContributions from "./RiskFactorContributions";

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

    let innerCauses = riskFactorContributions(causeNodeResults, ageFrom, ageTo)
    let ninetyPercentProbability = survivalProbs.filter(e => e >= 0.9).length - 1 + ageFrom
    let probabilityOfTurning100 = ageFrom < 100 ? survivalProbs[(100-ageFrom)] : null

    return {
        lifeExpentancyData: { lifeExpentancy: lifeExpentancy, ninetyPercentProbability: ninetyPercentProbability, probabilityOfTurning100: probabilityOfTurning100 },
        yearsLostToDeathCauses: findNLargestValues(yearsLostToDeathCause),
        probabiliiesOfDyingOfEachDeathCause: findNLargestValues(probabiliiesOfDyingOfEachDeathCause),
        dataSet: innerCauses
    };
}

export interface SummaryViewData {
    lifeExpentancyData: LifeExpentancyData,
    yearsLostToDeathCauses: DataPoint[],
    probabiliiesOfDyingOfEachDeathCause: DataPoint[],
    dataSet: DataRow[]
}

export interface DataPoint {
    name: string,
    value: number
}

export interface LifeExpentancyData {
    lifeExpentancy: number
    ninetyPercentProbability: number
    probabilityOfTurning100: number | null
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

function findNLargestValues(data: DataPoint[]) {
    const N = 5
    return data.sort((a, b) => b.value - a.value).slice(0, N)
}
