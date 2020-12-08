import Factors from "../../models/Factors";

export interface RiskRatioTableInput {
    riskFactorNames: string[];
    interpolationTable: any;
    riskRatioTable: (string[] | number)[][];
}

class RiskRatioTable {
    factorNames: string[];
    riskRatioTable: RiskRatioTableEntry[];
    interpolation: any;

    constructor(json: RiskRatioTableInput) {
        this.factorNames = json.riskFactorNames;
        this.interpolation = json.interpolationTable;
        this.riskRatioTable = json.riskRatioTable.map(element => { return new RiskRatioTableEntry(element[0] as string[], element[1] as number) })
    }

    getRiskRatio(factors: Factors, age: number): number {
        let res = [];
        this.factorNames.forEach(element => {
            res.push(Factors[element as keyof typeof Factors]) //.getValue(number)
        });
        return 0;
    }
}

class RiskRatioTableEntry {
    factorValues: string[];
    riskRatioValue: number;

    constructor(factorValues: string[], riskRatioValue: number) {
        this.factorValues = factorValues;
        this.riskRatioValue = riskRatioValue;
    }
}

export {RiskRatioTable, RiskRatioTableEntry}