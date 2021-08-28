import { ProbabilityKeyValue } from "../models/ProbabilityKeyValue";
import { BestValues } from "./Calculations/ConsensusBestValue";

export interface DataRow {
    name: string,
    totalProb: number,
    innerCauses: ProbabilityKeyValue,
    comparisonWithBestValues?: BestValues,
}

export type DataSet = DataRow[];