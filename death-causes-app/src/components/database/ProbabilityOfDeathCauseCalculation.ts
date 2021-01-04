import { FactorAnswers } from "../../models/Factors";
import Deathcause from "./Deathcause";
import { RiskFactorGroup } from "./RickFactorGroup";

export class ProbabilityOfDeathCauseCalculation {

    calculate(submittedFactorAnswers: FactorAnswers, currentAge: number, endAge: number, deathcause: Deathcause): number[] {
        let ageRange: number[] = Array.from({ length: endAge - currentAge + 1 }, (x, i) => i + currentAge);
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
        riskFactorGroup.riskRatioTables.forEach(riskRatioTable => {
            res = res * riskRatioTable.getInterpolatedRiskRatio(factorAnswers)
        });
        return res / riskFactorGroup.normalisationFactors.getPrevalence(age)
    }
}
