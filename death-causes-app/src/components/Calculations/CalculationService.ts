import { propTypes } from "react-bootstrap/esm/Image";
import { FactorAnswers } from "../../models/Factors";
import { ProbabilityKeyValue } from "../../models/ProbabilityKeyValue";
import DeathCause from "../database/Deathcause";
import { ProbabilityOfDeathCause, ProbabilitiesOfAllDeathCauses } from "../database/ProbabilityResult";
import { RiskFactorGroup } from "../database/RickFactorGroup";
import { MinimumRiskRatios } from "../database/RiskRatioTable";
import { RiskRatioTableCellInterface } from "../database/RiskRatioTableCell/RiskRatioTableCellInterface";
import { DataRow } from "../PlottingData";
import { SurvivalCurveData } from "./SurvivalCurveData";

interface MinimumFactorInputs {
    [key: string]: RiskRatioTableCellInterface
}

interface UStar {
    propForDeathcause: number,
    minProbForDeathcause: number,
    minFactorIntervals: MinimumFactorInputs,
    minFactorValues: FactorAnswers;
}

export class RiskRatioCalculationService {
    private readonly MAX_AGE = 120;

    calculateSurvivalCurve(submittedFactorAnswers: FactorAnswers, deathcauses: DeathCause[]): SurvivalCurveData[] {
        let probabilitiesPerDeathCause = this.calculateProbabilitiesOfDeathCauses(submittedFactorAnswers, deathcauses)
        let deathCauseProbabilities = probabilitiesPerDeathCause.probabilitiesOfAllDeathCauses.map(x => x.probabiltiesOfDeathCause)

        let totalProbabilityOfNotDying: number[] = Array.from({ length: probabilitiesPerDeathCause.ages.length })
        totalProbabilityOfNotDying = totalProbabilityOfNotDying.map((_, i) => deathCauseProbabilities.map(val => val[i]).reduce((sum, x) => sum + x, 0))
            .map(x => 1 - x)

        let res: SurvivalCurveData[] = []
        let survivalCurve = Array.from({ length: totalProbabilityOfNotDying.length - 1 }, () => 1)
        for (let i = 1; i < totalProbabilityOfNotDying.length; i++) {
            survivalCurve[i] = survivalCurve[i - 1] * totalProbabilityOfNotDying[i]
            res.push({age: probabilitiesPerDeathCause.ages[i], prob: survivalCurve[i]})
        }

        return res
    }

    calculateProbabilitiesOfDeathCauses(submittedFactorAnswers: FactorAnswers, deathcauses: DeathCause[]): ProbabilitiesOfAllDeathCauses {
        let currentAge: number = +submittedFactorAnswers['Age']
        let ageRange: number[] = this.getAgeRange(currentAge);

        let probabilityOfDeathcause: ProbabilityOfDeathCause[] = []
        for (var deathcause of deathcauses) {
            let probabilties = this.calculateProbForSingleCauseAndAllAges(submittedFactorAnswers, ageRange, deathcause)
            probabilityOfDeathcause.push(this.createProbabilityOfDeathCauseObject(deathcause.deathCauseName, probabilties));
        }

        let probabilityResultForAllCauses: ProbabilitiesOfAllDeathCauses = { probabilitiesOfAllDeathCauses: probabilityOfDeathcause, ages: ageRange }
        return probabilityResultForAllCauses;
    }

    private getAgeRange(currentAge: number): number[] {
        return Array.from({ length: this.MAX_AGE - currentAge + 1 }, (_, i) => i + currentAge);
    }

    private createProbabilityOfDeathCauseObject(deathCauseName: string, probabilityOfDeathcause: number[]): ProbabilityOfDeathCause {
        return { deathCause: deathCauseName, probabiltiesOfDeathCause: probabilityOfDeathcause };
    }

    private calculateProbForSingleCauseAndAllAges(submittedFactorAnswers: FactorAnswers, ageRange: number[], deathcause: DeathCause): number[] {
        let probabilities: number[] = []
        ageRange.forEach(age => {
            let probability = this.calculateProbabilityForSingleCauseAndAge(submittedFactorAnswers, age, deathcause)
            probabilities.push(probability);
        })
        return probabilities
    }

    private calculateProbabilityForSingleCauseAndAge(factorAnswers: FactorAnswers, selectedAge: number, deathcause: DeathCause): number {
        let agePrevalence = deathcause.ages.getPrevalence(selectedAge);
        let res = 1;
        deathcause.riskFactorGroups.forEach(riskFactorGroup =>
            res = res * this.calculateProbabilityOfRiskFactorGroup(factorAnswers, riskFactorGroup, selectedAge)
        )
        return agePrevalence * res;
    }

    private calculateProbabilityOfRiskFactorGroup(factorAnswers: FactorAnswers, riskFactorGroup: RiskFactorGroup, age: number): number {
        const riskFactorGroupFactors = Array.from(riskFactorGroup.getAllFactorsInGroup().values())

        for (let i = 0; i < riskFactorGroup.getAllFactorsInGroup().size; i++) {
            const factor = riskFactorGroupFactors[i]
            if (factorAnswers[factor] === '') {
                return 1;
            }
        }

        let res = 1;
        riskFactorGroup.riskRatioTables.forEach(riskRatioTable => {
            res = res * riskRatioTable.getRiskRatio(factorAnswers)
        });
        return res / riskFactorGroup.normalisationFactors.getPrevalence(age)
    }

    calculateInnerProbabilitiesForAllCausesAndAges(factorAnswersSubmitted: FactorAnswers, deathCauses: DeathCause[]): DataRow[] {
        let res: DataRow[] = []
        let currentAge = +factorAnswersSubmitted['Age'] as number
        let ageRange = this.getAgeRange(currentAge)
        deathCauses.forEach(deathCause => {
            let innerCausesForAges: DataRow[] = []
            ageRange.forEach(age => {
                let factorAnswersSubmittedUpdated = { ...factorAnswersSubmitted }
                factorAnswersSubmittedUpdated['Age'] = age
                innerCausesForAges.push(this.calculateInnerProbabilities(factorAnswersSubmittedUpdated, deathCause))
            })
            res.push(this.combineMultipleInnerCauses(innerCausesForAges))
        })
        return res;
    }

    private combineMultipleInnerCauses(innerCauses: DataRow[]): DataRow {
        let sum = innerCauses.map(innerCause => innerCause.totalProb).reduce((first, second) => first + second, 0)
        let deathCauseName = innerCauses[0].name

        if (sum === 0) {
            return { name: deathCauseName, totalProb: 0, innerCauses: {} }
        }

        let combinedInnerCause: ProbabilityKeyValue = {}
        let factors = Object.keys(innerCauses[0].innerCauses)

        for (let factor of factors) {
            let combinedInnerProb = 0
            innerCauses.forEach(
                innerCause => {
                    combinedInnerProb += innerCause.totalProb * innerCause.innerCauses[factor] / sum
                })
            combinedInnerCause[factor] = combinedInnerProb
        }
        return { name: deathCauseName, totalProb: sum, innerCauses: combinedInnerCause }
    }

    calculateInnerProbabilities(factorAnswersSubmitted: FactorAnswers, deathcause: DeathCause): DataRow {
        let uStar = this.calculateUStar(factorAnswersSubmitted, deathcause);
        let firstOrderDecomposition = this.calculateFirstOrderDecomposition(factorAnswersSubmitted, deathcause);

        let ratio
        if (uStar.propForDeathcause === 0) {
            ratio = 0
        } else {
            ratio = (uStar.propForDeathcause - uStar.minProbForDeathcause) / uStar.propForDeathcause
        }
        let innerCauses: ProbabilityKeyValue = {}
        for (let key of Object.keys(firstOrderDecomposition)) {
            innerCauses[key] = firstOrderDecomposition[key] * ratio
        }

        let res = {
            name: deathcause.deathCauseName,
            totalProb: uStar.propForDeathcause,
            innerCauses: innerCauses
        }

        return res
    }

    private calculateUStar(factorAnswersSubmitted: FactorAnswers, deathcause: DeathCause): UStar {
        let probForDeathcause = this.calculateProbabilityForSingleCauseAndAge(factorAnswersSubmitted, factorAnswersSubmitted['Age'] as number, deathcause)
        let minimumFactorIntervals: MinimumFactorInputs = {}
        deathcause.riskFactorGroups.forEach(rfg => {
            rfg.riskRatioTables.forEach(rrt => {
                minimumFactorIntervals = { ...minimumFactorIntervals, ...rrt.getMinimumRRFactors() }
            })
        })

        let minimumFactorInputs: FactorAnswers = {}
        for (var key in minimumFactorIntervals) {
            minimumFactorInputs[key] = minimumFactorIntervals[key].getValueInCell()
        }

        let minProbForDeathcause = this.calculateProbabilityForSingleCauseAndAge(minimumFactorInputs, factorAnswersSubmitted['Age'] as number, deathcause)

        return { propForDeathcause: probForDeathcause, minProbForDeathcause: minProbForDeathcause, minFactorIntervals: minimumFactorIntervals, minFactorValues: minimumFactorInputs }
    }

    private calculateFirstOrderDecomposition(factorAnswersSubmitted: FactorAnswers, deathcause: DeathCause): ProbabilityKeyValue {
        let res: ProbabilityKeyValue = {}
        for (let rfg of deathcause.riskFactorGroups) {
            let rfgRes = this.calculateFirstOrderDecompositionForRiskFactorGroup(factorAnswersSubmitted, rfg);
            res = { ...res, ...rfgRes };
        }

        let sum = 0;
        for (let key of Object.keys(res)) {
            sum += res[key];
        }
        for (let key of Object.keys(res)) {
            if (sum === 0) {
                res[key] = 1 / Object.keys(res).length
            } else {
                res[key] = res[key] / sum;
            }
        }

        return res;
    }

    private calculateFirstOrderDecompositionForRiskFactorGroup(factorAnswersSubmitted: FactorAnswers, riskFactorGroup: RiskFactorGroup) {
        let res: MinimumRiskRatios = {}
        let factors = riskFactorGroup.getAllFactorsInGroup()

        factors.forEach(factor => {
            res[factor] = 1
        })

        riskFactorGroup.riskRatioTables.forEach(rrt => {
            let ratio = 1;
            rrt.factorNames.forEach(factor => {
                let minRR = rrt.getMinimumRR() //todo: return factor values/factor intervals for minRR and minRRexceptForOne
                let minRRexceptForOne = rrt.getMinimumRRForSingleFactor(factorAnswersSubmitted, factor)
                if (minRR === 0) {
                    ratio = 0
                } else {
                    ratio = ratio * (minRRexceptForOne - minRR) / minRR
                }
                res[factor] *= ratio;
            })
        })
        return res;
    }
}
