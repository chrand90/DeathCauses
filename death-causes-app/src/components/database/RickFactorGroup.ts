import FrequencyTable, { FrequencyInput } from "./Age";
import { RiskRatioTable, RiskRatioTableInput } from "./RiskRatioTable";

export interface RiskFactorGroupInput {
    normalisingFactors: FrequencyInput;
    interactionFunction: string;
    riskRatioTables: RiskRatioTableInput[];
}

export class RiskFactorGroup {
    normalisationFactors: FrequencyTable;
    interactionFunction: string; //todo: consider enum
    riskRatioTables: RiskRatioTable[];

    constructor(json: RiskFactorGroupInput) {
        this.normalisationFactors = new FrequencyTable(json.normalisingFactors);
        this.interactionFunction  = json.interactionFunction;
        this.riskRatioTables = json.riskRatioTables.map(element => {return new RiskRatioTable(element)})
    }

    getAllFactorsInGroup(): Set<string> {
        let allFactors: string[] = [];
        this.riskRatioTables.forEach(rrt => allFactors.concat(rrt.factorNames));
        return new Set(allFactors)
    }
}
