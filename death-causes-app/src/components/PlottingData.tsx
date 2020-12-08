import { idText } from "typescript";

export interface InnerCause {
    [key: string]: number;
}

export interface DataRow {
    name: string,
    total_prob: number,
    inner_causes: InnerCause
}

export type DataSet = DataRow[];

export const TEST_DATA: DataSet = [{ name: 'Corona', total_prob: 0.15, inner_causes: { partying: 0.45, smoking: 0.1 } },
{ name: 'Old age', total_prob: 0.75, inner_causes: {} }, { name: 'Accidents', total_prob: 0.10, inner_causes: { partying: 0.1 } }];

export const TEST_DATA2: DataSet = [{ name: 'Corona', total_prob: 0.15, inner_causes: { partying: 0.05, smoking: 0.20 } },
{ name: 'Old age', total_prob: 0.75, inner_causes: { 'smoking': 0.02 } }, { name: 'Accidents', total_prob: 0.10, inner_causes: {} }];

