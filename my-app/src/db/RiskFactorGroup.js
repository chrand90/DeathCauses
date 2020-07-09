import Frequency from "./Frequency"
import {InteractionFunctions} from "./IntertactionFunctionEnum"

class RiskFactorGroup {
    constructor({normalizingFactors, interactionFunction, riskRatioTables}){
        this.normalizingFactors = new Frequency(normalizingFactors)

        const INTERACTIONS = Object.freeze({
            MULTIPLICATIVE: Symbol("multiplicative")
        })

        this.interactionFunction = INTERACTIONS[interactionFunction]
        this.riskRatioTables = riskRatioTables
    }
}

export default RiskFactorGroup