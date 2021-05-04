export const a=0; 
/* import { FactorAnswers } from "../../models/Factors";
import RelationLinks from "../../models/RelationLinks";
import DeathCause from "../database/Deathcause";
import { RiskRatioCalculationService } from "./CalculationService";

export class CalculationFacade {
    private readonly probabilityOfDeathCauseCalculation: RiskRatioCalculationService
    private readonly deathCauses: DeathCause[];

    constructor(deathcauses: DeathCause[], rdat: RelationLinks) {
        this.deathCauses=deathcauses
        this.probabilityOfDeathCauseCalculation = new RiskRatioCalculationService(rdat)
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
} */ 