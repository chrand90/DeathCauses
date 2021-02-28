import { ProbabilityKeyValue } from "../models/ProbabilityKeyValue";

export interface DataRow {
    name: string,
    totalProb: number,
    innerCauses: ProbabilityKeyValue
}

export type DataSet = DataRow[];

export const TEST_DATA: DataSet = [{ name: 'Corona', totalProb: 0.09, innerCauses: { partying: 0.45, smoking: 0.1 } },
{ name: 'BOld age', totalProb: 0.8, innerCauses: { 'smoking': 0, partying: 0 } }, { name: 'Accidents', totalProb: 0.11, innerCauses: { partying: 0.1 } }];

export const TEST_DATA2: DataSet = [{ name: 'Corona', totalProb: 0.15, innerCauses: { partying: 0.05, smoking: 0.20 } },
{ name: 'BOld age', totalProb: 0.7, innerCauses: { 'smoking': 0.02, partying: 0 } }, { name: 'Accidents', totalProb: 0.10, innerCauses: { partying: 0 } }];


//To make the text-on-rect visualization in d3, I felt it was necessary to introduce AugmentedDataRow, but now I think there are other ways around it, so this will probably deleted in the future:
interface Id {
    id: number
}

export interface AugmentedDataRow extends DataRow, Id { }

export type AugmentedDataSet = AugmentedDataRow[];