import { FactorAnswers } from "../../models/Factors";
import DeathCause from "../database/Deathcause";
import { RiskRatioCalculationService } from "./CalculationService";

export class CalculationFacade {
    private readonly probabilityOfDeathCauseCalculation: RiskRatioCalculationService
    private readonly deathCauses: DeathCause[];

    constructor(deathcauses: DeathCause[]) {
        this.deathCauses=deathcauses
        this.probabilityOfDeathCauseCalculation = new RiskRatioCalculationService()
    }
    
    calculateProbabilitiesForDeathcauses = (submittedFactorAnswers: FactorAnswers) => {
        return this.probabilityOfDeathCauseCalculation.calculateProbabilitiesOfDeathCauses(submittedFactorAnswers, this.deathCauses)
    }

    calculateInnerProbabilities = (submittedFactorAnswers: FactorAnswers) => {
        return this.probabilityOfDeathCauseCalculation.calculateInnerProbabilitiesForAllCausesAndAges(submittedFactorAnswers, this.deathCauses);
    }

    calculateSurvivalCurve = (submittedFactorAnswers: FactorAnswers) => {
        return this.probabilityOfDeathCauseCalculation.calculateSurvivalCurve(submittedFactorAnswers, this.deathCauses)
    }

    calculateLifeExpentancy = (submittedFactorAnswers: FactorAnswers) => {
        return this.probabilityOfDeathCauseCalculation.calculateLifeExpentancy(submittedFactorAnswers, this.deathCauses)
    }
}