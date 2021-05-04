import { BestValues } from "../../components/Calculations/ConsensusBestValue";
import { SetToNumber } from "../../components/Calculations/DebtInheritance";

export interface RiskRatioResult {
    RRmax: number,
    SDics: SetToNumber;
}

export interface OptimsToSDics {
    [optimizability: string]: RiskRatioResult[]
}

export default interface RiskFactorGroupResult {
    normalizationFactors: number[];
    SDics: OptimsToSDics | OptimsToSDics[];
    bestValues: BestValues;
}