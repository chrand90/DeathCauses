import { FactorAnswers } from "../../models/Factors";
import Deathcause from "./Deathcause";
import { ProbabilityResult, ProbabilityResultForAllCauses } from "./ProbabilityResult";
import { RiskFactorGroup } from "./RickFactorGroup";
import { MinimumRiskRatios } from "./RiskRatioTable";

export class ProbabilityOfDeathCauseCalculation {
    private readonly MAX_AGE = 120;

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

    calculateRRForSingleDeathcauseAndAllAges(submittedFactorAnswers: FactorAnswers, ageRange: number[], deathcause: Deathcause): number[] {
        let RRs: number[] = []
        ageRange.forEach(age => {
            let RR = this.calculateRRForSingleDeathcauseAndAge(submittedFactorAnswers, age, deathcause)
            RRs.push(RR);
            let minRR = this.calculateInnerProbabilities(submittedFactorAnswers, deathcause, age)
            let tmp = this.normaliseInnerProbabilities(minRR, RR)
            console.log(tmp)
        })
        return RRs
    }

    normaliseInnerProbabilities(innerProbabilites: MinimumRiskRatios, RR: number) {
        let sum = Object.values(innerProbabilites).reduce((a,b) => a+b, 0)
        let res: MinimumRiskRatios = {}
        for (var key in innerProbabilites) {
            res[key] = innerProbabilites[key] * RR / sum
        }
        return res;
    }

    calculateRRForSingleDeathcauseAndAge(factorAnswers: FactorAnswers, selectedAge: number, deathcause: Deathcause): number {
        let agePrevalence = deathcause.age.getPrevalence(selectedAge);
        let res = 1;
        deathcause.riskFactorGroups.forEach(riskFactorGroup =>
            res = res * this.calculateRRForSingleRiskFactorGroup(factorAnswers, riskFactorGroup, selectedAge)
        )
        return agePrevalence * res;
    }

    calculateInnerProbabilities(factorAnswers: FactorAnswers, deathcause: Deathcause, age: number) {
        let res: MinimumRiskRatios = {}
        deathcause.riskFactorGroups.forEach(rfg =>
            res = { ...res, ...this.getMinimumRRsForEachFactorInRiskRatioTable(factorAnswers, rfg, age) }
        )
        let tmp: MinimumRiskRatios = {}
        let minimizedFactorAnswers2 = Object.create(factorAnswers)
        for (var key in res) {
            minimizedFactorAnswers2[key] = res[key]
        }
        tmp['abs_min'] = this.calculateRRForSingleDeathcauseAndAge(minimizedFactorAnswers2, age, deathcause)

        for (var key2 in res) {
            let minimizedFactorAnswers = Object.create(factorAnswers)
            minimizedFactorAnswers[key2] = res[key2]
            tmp[key2] = this.calculateRRForSingleDeathcauseAndAge(minimizedFactorAnswers, age, deathcause)
        }
        return tmp
    }

    calculateRRForSingleRiskFactorGroup(factorAnswers: FactorAnswers, riskFactorGroup: RiskFactorGroup, age: number): number {
        let res = 1;
        const riskFactorGroupFactors = Array.from(riskFactorGroup.getAllFactorsInGroup().values())

        for (let i = 0; i < riskFactorGroupFactors.length; i++) {
            const factor = riskFactorGroupFactors[i]
            if (factorAnswers[factor] === '') {
                return 1;
            }
        }

        riskFactorGroup.riskRatioTables.forEach(riskRatioTable => {
            res = res * riskRatioTable.getInterpolatedRiskRatio(factorAnswers)
        });
        return res / riskFactorGroup.normalisationFactors.getPrevalence(age)
    }

    getMinimumRRsForEachFactorInRiskRatioTable(factorAnswers: FactorAnswers, riskFactorGroup: RiskFactorGroup, age: number) {
        let res: MinimumRiskRatios = {}
        for (let i = 0; i < riskFactorGroup.riskRatioTables.length; i++) {
            const riskRatioTable = riskFactorGroup.riskRatioTables[i];
            let minimumRR = riskRatioTable.getMinimumRRForFactor(factorAnswers)
            res = { ...res, ...minimumRR }
        }
        return res;
    }
}
