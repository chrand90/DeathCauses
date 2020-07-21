import Frequency from "./Frequency"
import {Interactions} from "./IntertactionFunctionEnum"
import RiskRatioTable from './RiskRatioTable'

class RiskFactorGroup {
    constructor({normalizingFactors, interactionFunction, riskRatioTables}){
        this.normalizingFactors = new Frequency(normalizingFactors)
        this.interactionFunction = Interactions.valueOf(interactionFunction)
        this.riskRatioTables = riskRatioTables.map(
            rrt =>new RiskRatioTable(rrt)
        )
    }
}

export default RiskFactorGroup