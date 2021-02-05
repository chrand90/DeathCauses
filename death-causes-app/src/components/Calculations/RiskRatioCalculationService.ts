import { min, rgb } from "d3";
import { deprecate } from "util";
import { FactorAnswers } from "../../models/Factors";
import { RiskRatioTableCellData } from "../database/DataTypes";
import Deathcause from "../database/Deathcause";
import { ProbabilityResult, ProbabilityResultForAllCauses } from "../database/ProbabilityResult";
import { RiskFactorGroup } from "../database/RickFactorGroup";
import { MinimumRiskRatios, RiskRatioTable } from "../database/RiskRatioTable";
import { DataRow, InnerCause } from "../PlottingData";

export interface TestInterface {
    [id: string]: number
}


export class RiskRatioCalculationService {
    private readonly MAX_AGE = 120;
    private tmp_data = { BMI: "30", Age: "80", Waist: "80", Caffeine: "10", Fish: "0", Vegetables: "3" }

    calculateRRForAllCausesAndAges(submittedFactorAnswers: FactorAnswers, currentAge: number, deathcauses: Deathcause[]): ProbabilityResultForAllCauses {
        let ageRange: number[] = Array.from({ length: this.MAX_AGE - currentAge + 1 }, (x, i) => i + currentAge);
        // let result = Array.from({ length: ageRange.length }, (x, i) => 0)
        let result: ProbabilityResult[] = []
        for (var deathcause of deathcauses) {
            result.push(new ProbabilityResult(deathcause.deathCauseName, this.calculateRRForSingleDeathcauseAndAllAges(submittedFactorAnswers, ageRange, deathcause)))
        }
        let probabilityResultForAllCauses = new ProbabilityResultForAllCauses(result)
        return probabilityResultForAllCauses;
    }

    private sumArrays(array1: number[], array2: number[]): number[] {
        return array1.map((val, idx) => { return val + array2[idx] })
    }

    private calculateRRForSingleDeathcauseAndAllAges(submittedFactorAnswers: FactorAnswers, ageRange: number[], deathcause: Deathcause): number[] {
        let RRs: number[] = []
        ageRange.forEach(age => {
            let RR = this.calculateRRForSingleDeathcauseAndAge(submittedFactorAnswers, age, deathcause)
            RRs.push(RR);
            // let minRR = this.calculateInnerProbabilities(submittedFactorAnswers, deathcause, age)
            // let tmp = this.normaliseInnerProbabilities(minRR, RR)
            // console.log(tmp)
        })
        return RRs
    }

    // normaliseInnerProbabilities(innerProbabilites: MinimumRiskRatios, RR: number) {
    //     let sum = Object.values(innerProbabilites).reduce((a, b) => a + b, 0)
    //     let res: MinimumRiskRatios = {}
    //     for (var key in innerProbabilites) {
    //         res[key] = innerProbabilites[key] * RR / sum
    //     }
    //     return res;
    // }

    private calculateRRForSingleDeathcauseAndAge(factorAnswers: FactorAnswers, selectedAge: number, deathcause: Deathcause): number {
        let agePrevalence = deathcause.age.getPrevalence(selectedAge);
        let res = 1;
        deathcause.riskFactorGroups.forEach(riskFactorGroup =>
            res = res * this.calculateRRForSingleRiskFactorGroup(factorAnswers, riskFactorGroup, selectedAge)
        )
        return agePrevalence * res;
    }

    // calculateInnerProbabilities(factorAnswers: FactorAnswers, deathcause: Deathcause, age: number) {
    //     let res: MinimumRiskRatios = {}
    //     deathcause.riskFactorGroups.forEach(rfg =>
    //         res = { ...res, ...this.getMinimumRRsForEachFactorInRiskRatioTable(factorAnswers, rfg, age) }
    //     )
    //     let tmp: MinimumRiskRatios = {}
    //     let minimizedFactorAnswers2 = Object.create(factorAnswers)
    //     for (var key in res) {
    //         minimizedFactorAnswers2[key] = res[key]
    //     }
    //     tmp['abs_min'] = this.calculateRRForSingleDeathcauseAndAge(minimizedFactorAnswers2, age, deathcause)

    //     for (var key2 in res) {
    //         let minimizedFactorAnswers = Object.create(factorAnswers)
    //         minimizedFactorAnswers[key2] = res[key2]
    //         tmp[key2] = this.calculateRRForSingleDeathcauseAndAge(minimizedFactorAnswers, age, deathcause)
    //     }
    //     return tmp
    // }

    private calculateRRForSingleRiskFactorGroup(factorAnswers: FactorAnswers, riskFactorGroup: RiskFactorGroup, age: number): number {
        let res = 1;
        const riskFactorGroupFactors = Array.from(riskFactorGroup.getAllFactorsInGroup().values())

        for (let i = 0; i < riskFactorGroupFactors.length; i++) {
            const factor = riskFactorGroupFactors[i]
            if (factorAnswers[factor] === '') {
                return 1;
            }
        }

        riskFactorGroup.riskRatioTables.forEach(riskRatioTable => {
            res = res * riskRatioTable.getRiskRatio(factorAnswers)
        });
        return res / riskFactorGroup.normalisationFactors.getPrevalence(age)
    }

    // getMinimumRRsForEachFactorInRiskRatioTable(factorAnswers: FactorAnswers, riskFactorGroup: RiskFactorGroup, age: number) {
    //     let res: MinimumRiskRatios = {}
    //     for (let i = 0; i < riskFactorGroup.riskRatioTables.length; i++) {
    //         const riskRatioTable = riskFactorGroup.riskRatioTables[i];
    //         let minimumRR = riskRatioTable.getMinimumRRForFactor(factorAnswers)
    //         res = { ...res, ...minimumRR }
    //     }
    //     return res;
    // }

    calculateInnerProbabilities(factorAnswersSubmitted: FactorAnswers, deathcause: Deathcause): DataRow {
        let uStar = this.calculateUStar(factorAnswersSubmitted, deathcause);
        let firstOrderDecomposition = this.calculateFirstOrderDecomposition(factorAnswersSubmitted, deathcause);

        let ratio
        if (uStar.propForDeathcause === 0) {
            ratio = 0
        } else {
            ratio = (uStar.propForDeathcause - uStar.minProbForDeathcause) / uStar.propForDeathcause
        }
        let innerCauses: InnerCause = {}
        for (let key of Object.keys(firstOrderDecomposition)) {
            innerCauses[key] = firstOrderDecomposition[key] * ratio
        }

        let res = {
            name: deathcause.deathCauseName,
            total_prob: uStar.propForDeathcause,
            inner_causes: innerCauses
        }

        return res
    }

    calculateUStar(factorAnswersSubmitted: FactorAnswers, deathcause: Deathcause): UStarInterface {
        let probForDeathcause = this.calculateRRForSingleDeathcauseAndAge(factorAnswersSubmitted, factorAnswersSubmitted['Age'] as number, deathcause)
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

        let minProbForDeathcause = this.calculateRRForSingleDeathcauseAndAge(minimumFactorInputs, factorAnswersSubmitted['Age'] as number, deathcause)

        return { propForDeathcause: probForDeathcause, minProbForDeathcause: minProbForDeathcause, minFactorIntervals: minimumFactorIntervals, minFactorValues: minimumFactorInputs }
    }

    calculateFirstOrderDecomposition(factorAnswersSubmitted: FactorAnswers, deathcause: Deathcause): TestInterface {
        let res: TestInterface = {}
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
        //todo: loop over rrt fremfor factors
        factors.forEach(factor => {
            let ratio = 1 // factor = greens
            for (let rrt of riskFactorGroup.riskRatioTables) {
                if (rrt.factorNames.includes(factor)) {
                    let minRR = rrt.getMinimumRR() //todo: return factor values/factor intervals for minRR and minRRexceptForOne
                    let minRRexceptForOne = rrt.getMinimumRRForSingleFactor(factorAnswersSubmitted, factor)
                    if (minRR === 0) { ratio = 0 } else {
                        ratio = ratio * (minRRexceptForOne - minRR) / minRR
                    }
                }
            }
            return res[factor] = ratio
        })
        return res
    }


    //bestem U*, dvs. forskellen i sandsynligheder for at dø givet submitted faktorer og minimums faktorer
    //hvordan findes minimums faktorer? Skal vi minimerer over alle sygdomme eller inden for den enkelte
}

interface MinimumFactorInputs {
    [key: string]: RiskRatioTableCellData
}

interface UStarInterface {
    propForDeathcause: number,
    minProbForDeathcause: number,
    minFactorIntervals: MinimumFactorInputs,
    minFactorValues: FactorAnswers;
}