import { FactorAnswers } from "../../models/Factors";
import DeathCause from "../database/Deathcause";
import { RiskRatioCalculationService } from "./CalculationService";

export class CalculationFacade {
    private readonly probabilityOfDeathCauseCalculation: RiskRatioCalculationService

    constructor(deathcauses: DeathCause[]) {
        this.probabilityOfDeathCauseCalculation = new RiskRatioCalculationService()
    }
    
    calculateProbabilitiesForDeathcauses = (submittedFactorAnswers: FactorAnswers, deathCauses: DeathCause[]) => {
        return this.probabilityOfDeathCauseCalculation.calculateProbabilitiesOfDeathCauses(submittedFactorAnswers, deathCauses)
    }

    calculateInnerProbabilities(submittedFactorAnswers: FactorAnswers, deathCauses: DeathCause[]) {
        return this.probabilityOfDeathCauseCalculation.calculateInnerProbabilitiesForAllCausesAndAges(submittedFactorAnswers, deathCauses);
    }

    calculateSurvivalCurve(submittedFactorAnswers: FactorAnswers, deathCauses: DeathCause[]) {
        return this.probabilityOfDeathCauseCalculation.calculateSurvivalCurve(submittedFactorAnswers, deathCauses)
    }
}