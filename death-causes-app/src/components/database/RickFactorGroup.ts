import FrequencyTable, { FrequencyJson } from "./FrequencyTable";
import { RiskRatioTable, RiskRatioTableJson } from "./RiskRatioTable";

export interface RiskFactorGroupJson {
    normalisingFactors: FrequencyJson;
    interactionFunction: string;
    riskRatioTables: RiskRatioTableJson[];
}

export class RiskFactorGroup {
    normalisationFactors: FrequencyTable;
    interactionFunction: string; //todo: consider enum
    riskRatioTables: RiskRatioTable[];

    constructor(json: RiskFactorGroupJson) {
        this.normalisationFactors = new FrequencyTable(json.normalisingFactors);
        this.interactionFunction  = json.interactionFunction;
        this.riskRatioTables = json.riskRatioTables.map(element => {return new RiskRatioTable(element)})
    }

    getAllFactorsInGroup(): Set<string> {
        let allFactors: string[] = [];
        this.riskRatioTables.forEach(rrt => allFactors.push(...rrt.factorNames));
        return new Set(allFactors)
    }
}