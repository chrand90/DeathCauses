import { FactorAnswers } from "../../models/Factors";
import Deathcause from "../database/Deathcause";
import { RiskRatioCalculationService } from "./RiskRatioCalculationService";

export class CalculationController {
    private probabilityOfDeathCauseCalculation: RiskRatioCalculationService

    constructor() {
        this.probabilityOfDeathCauseCalculation = new RiskRatioCalculationService()
    }
    
    getRiskRatios = (submittedFactorAnswers: FactorAnswers, currentAge: number, deathcauses: Deathcause[]) => {
        return this.probabilityOfDeathCauseCalculation.calculateRRForAllCausesAndAges(submittedFactorAnswers, currentAge, deathcauses)
    }

    getInnerProbabilities(submittedFactorsubmittedFactorAnswers: FactorAnswers, currentAge: number, deathcauses: Deathcause[]) {
        
        return;
    }
}