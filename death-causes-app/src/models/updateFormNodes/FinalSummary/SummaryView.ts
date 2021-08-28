import { EVALUATION_UNIT } from "../../../stores/AdvancedOptionsStore";
import CauseNodeResult from "../CauseNodeResult";
import { FactorAnswerChanges } from "../FactorAnswersToUpdateForm";
import { calculateLifeExpectancy, probOfStillBeingAlive } from "./CommonSummarizerFunctions";

export default function computeSummaryView(causeNodeResults: CauseNodeResult[], ageFrom: number, ageTo: number, changes: FactorAnswerChanges, evaluationUnit: EVALUATION_UNIT): SummaryViewData {
    let ages: number[] = Array.from({ length: ageTo - ageFrom + 1 }, (_, i) => ageFrom + i)

    const survivalProbs = probOfStillBeingAlive(causeNodeResults)
    const lifeExpentancy = calculateLifeExpectancy(survivalProbs, ageFrom)
    const costOfDeathcauses: DataPoint[] = computeCostOfDeathcauses(causeNodeResults, ageFrom, lifeExpentancy, survivalProbs, evaluationUnit)

    return {
        lifeExpentancyData: { lifeExpentancy: lifeExpentancy, ages: ages, probabilities: survivalProbs },
        costOfAllDeathcauses: costOfDeathcauses,
        changes: changes
    };
}

const computeCostOfDeathcauses = (causeNodeResults: CauseNodeResult[], ageFrom: number, lifeExpentancy: number, survivalProbs: number[], evaluationUnit: EVALUATION_UNIT): DataPoint[] => {
    let costOfDeathcauses: DataPoint[] = []

    if (evaluationUnit === EVALUATION_UNIT.YEARS_LOST) {
        for (let i = 0; i < causeNodeResults.length; i++) {
            let deathCauseNodeResultCopy = causeNodeResults.slice()
            let removedDeathCause = deathCauseNodeResultCopy.splice(i, 1)
            const survivalProbsIgnoringCause = probOfStillBeingAlive(causeNodeResults)
            let lifeExpectancyIgnoringCause = calculateLifeExpectancy(survivalProbsIgnoringCause, ageFrom)
            costOfDeathcauses.push({ name: removedDeathCause[0].name, value: lifeExpectancyIgnoringCause - lifeExpentancy })
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

function calculateProbOfDyingOfDeathcause(probs: number[], survivalProb: number[]) {
    let res = 0;
    for (let i = 0; i < probs.length; i++) {
        res += probs[i] * survivalProb[i]
    }
    return res;
}