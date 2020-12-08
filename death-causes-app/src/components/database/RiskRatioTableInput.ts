export interface RiskRatioTableInput {
    riskFactorNames: string[];
    interpolationTable: any;
    riskRatioTable: (string[] | number)[][];
}