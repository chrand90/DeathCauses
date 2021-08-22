import { DataRow } from "../../../components/PlottingData";
import CauseNodeResult from "../CauseNodeResult";
import { FactorAnswerChanges } from "../FactorAnswersToUpdateForm";
import { probOfStillBeingAlive } from "./CommonSummarizerFunctions";
import riskFactorContributions from "./RiskFactorContributions";
import { EVALUATION_UNIT } from "../../../stores/AdvancedOptionsStore";

export default function computeSummaryView(causeNodeResults: CauseNodeResult[], ageFrom: number, ageTo: number, changes: FactorAnswerChanges, evaluationUnit: EVALUATION_UNIT): SummaryViewData {
    let ages: number[] = Array.from({ length: ageTo - ageFrom + 1 }, (_, i) => ageFrom + i)

    const lifeExpentancy = calculateLifeExpentancy(causeNodeResults, ages)
    const survivalProbs = probOfStillBeingAlive(causeNodeResults)
    const costOfDeathcauses: DataPoint[] = computeCostOfDeathcauses(causeNodeResults, ages, lifeExpentancy, survivalProbs, evaluationUnit)

    let innerCauses = riskFactorContributions(causeNodeResults, ageFrom, ageTo)

    return {
        lifeExpentancyData: { lifeExpentancy: lifeExpentancy, ages: ages, probabilities: survivalProbs },
        costOfAllDeathcauses: costOfDeathcauses,
        dataSet: innerCauses,
        changes: changes
    };
}

const computeCostOfDeathcauses = (causeNodeResults: CauseNodeResult[], ages: number[], lifeExpentancy: number, survivalProbs: number[], evaluationUnit: EVALUATION_UNIT): DataPoint[] => {
    let costOfDeathcauses: DataPoint[] = []

    if (evaluationUnit === EVALUATION_UNIT.YEARS_LOST) {
        for (let i = 0; i < causeNodeResults.length; i++) {
            let deathCauseNodeResultCopy = causeNodeResults.slice()
            let removedDeathCause = deathCauseNodeResultCopy.splice(i, 1)
            let lifeExpentancyIgnoringCause = calculateLifeExpentancy(deathCauseNodeResultCopy, ages)
            costOfDeathcauses.push({ name: removedDeathCause[0].name, value: lifeExpentancyIgnoringCause - lifeExpentancy })
        }
    } else if (evaluationUnit === EVALUATION_UNIT.PROBAIBILITY) {
        causeNodeResults.forEach(cause => { 
            costOfDeathcauses.push({ name: cause.name, value: calculateProbOfDyingOfDeathcause(cause.probs, survivalProbs) })
        });
    }
    return costOfDeathcauses
}

export interface SummaryViewData {
    lifeExpentancyData: LifeExpentancyData,
    costOfAllDeathcauses: DataPoint[],
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

function calculateLifeExpentancy(causeNodeResults: CauseNodeResult[], ages: number[]): number {
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

    let C2: number = survivalProb[survivalProb.length - 1]
    let z: number = summedProbabilityOfDyingEachYear[summedProbabilityOfDyingEachYear.length - 1]

    return C + C2 * (120 + (1 - z) / z);
}

function calculateProbOfDyingOfDeathcause(probs: number[], survivalProb: number[]) {
    let res = 0;
    for (let i = 0; i < probs.length; i++) {
        res += probs[i] * survivalProb[i]
    }
    return res;
}