import { FactorAnswers } from "../../models/Factors";
import Deathcause from "./Deathcause";
import { ProbabilityResult, ProbabilityResultForAllCauses } from "./ProbabilityResult";
import { RiskFactorGroup } from "./RickFactorGroup";

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
        ageRange.forEach(age =>
            RRs.push(this.calculateRRForSingleDeathcauseAndAge(submittedFactorAnswers, age, deathcause))
        )
        return RRs
    }

    calculateRRForSingleDeathcauseAndAge(factorAnswers: FactorAnswers, selectedAge: number, deathcause: Deathcause): number {
        let agePrevalence = deathcause.age.getPrevalence(selectedAge);
        let res = 1;
        deathcause.riskFactorGroups.forEach(riskFactorGroup =>
            res = res * this.calculateRRForSingleRiskFactorGroup(factorAnswers, riskFactorGroup, selectedAge)
        )
        return agePrevalence * res;
    }

    calculateRRForSingleRiskFactorGroup(factorAnswers: FactorAnswers, riskFactorGroup: RiskFactorGroup, age: number): number {
        let res = 1;
        let riskFactorGroupFactors = Array.from(riskFactorGroup.getAllFactorsInGroup().values())

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
}
