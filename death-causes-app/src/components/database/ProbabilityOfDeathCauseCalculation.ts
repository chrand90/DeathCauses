import { FactorAnswers } from "../../models/Factors";
import Deathcause from "./Deathcause";
import { RiskFactorGroup } from "./RickFactorGroup";

export class ProbabilityOfDeathCauseCalculation {
    database: Deathcause[];

    constructor(database: Deathcause[]) {
        this.database = database;
    }

    calculate(submittedFactorAnswers: FactorAnswers, currentAge: number, endAge: number, deathcause: Deathcause) {
        let ageRange: number[] = Array.from({ length: endAge - currentAge + 1 }, (x, i) => i + currentAge);
        let RRs = []
        ageRange.forEach(age =>
            RRs.push(this.calculateRRForSingleDeathcauseAndAge(submittedFactorAnswers, age, deathcause))
        )
    }

    calculateRRForSingleDeathcauseAndAge(factorAnswers: FactorAnswers, age: number, deathcause: Deathcause) {
        let agePrevalence = deathcause.age.getPrevalence(age);
        let res = 1;
        deathcause.riskFactorGroups.forEach(riskFactorGroup =>
            res = res * this.calculateRRForSingleRiskFactorGroup(factorAnswers, riskFactorGroup, age)
        )
        return agePrevalence * res;
    }

    calculateRRForSingleRiskFactorGroup(factorAnswers: FactorAnswers, riskFactorGroup: RiskFactorGroup, age: number): number {
        let res = 1;
        riskFactorGroup.riskRatioTables.forEach(riskRatioTable => {
            res = res * riskRatioTable.getRiskRatio(factorAnswers)
        });
        return res / riskFactorGroup.normalisationFactors.getPrevalence(age)
    }
}
