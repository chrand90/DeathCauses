import { DataRow } from "../../../components/PlottingData";
import { EVALUATION_UNIT } from "../../../stores/AdvancedOptionsStore";
import { ProbabilityKeyValue } from "../../ProbabilityKeyValue";
import CauseNodeResult from "../CauseNodeResult"
import { calculateLifeExpectancy, getAgeArray, probOfStillBeingAlive } from "./CommonSummarizerFunctions";
import { DeathCauseContributions } from "./RiskFactorContributionsLifeExpectancy";

export default function riskFactorContributions(causeNodeResults: CauseNodeResult[], ageFrom: number): DeathCauseContributions {

    const survivalProb = probOfStillBeingAlive(causeNodeResults);
    const ages = getAgeArray(ageFrom, ageFrom + survivalProb.length - 2)
    const lifeExpectancy = calculateLifeExpectancy(survivalProb, ageFrom)

    let res = causeNodeResults.map((causeNodeRes: CauseNodeResult) => {
        const weightOfYears = causeNodeRes.probs.map((prob, i) => {
            return prob * survivalProb[i];
        })
        const totalProb = weightOfYears.reduce((a, b) => a + b, 0);
        let totalInnerCauses: ProbabilityKeyValue = {};
        if (Array.isArray(causeNodeRes.perYearInnerCauses)) {
            causeNodeRes.perYearInnerCauses.forEach((causeToNumber, i) => {
                Object.entries(causeToNumber).forEach(([cause, proportion]) => {
                    if (cause in totalInnerCauses) {
                        totalInnerCauses[cause] += proportion * weightOfYears[i] / totalProb;
                    }
                    else {
                        totalInnerCauses[cause] = proportion * weightOfYears[i] / totalProb;
                    }
                })
            })
        }
        else {
            totalInnerCauses = causeNodeRes.perYearInnerCauses;
        }
        return {
            name: causeNodeRes.name,
            comparisonWithBestValues: causeNodeRes.bestValues,
            innerCauses: totalInnerCauses,
            totalProb: totalProb,
        }
    })
    let costPerCause = Object.fromEntries(res.map(element => [element.name, element]))

    return { evaluationUnit: EVALUATION_UNIT.PROBABILITY, baseLifeExpectancy: lifeExpectancy, survivalProbs: survivalProb.slice(1), ages: ages, costPerCause: costPerCause};
}

