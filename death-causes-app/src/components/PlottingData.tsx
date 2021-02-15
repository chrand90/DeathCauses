export interface InnerCause  {
    [key: string]: number;
}

export interface DataRow  {
    name: string,
    total_prob: number,
    inner_causes: InnerCause
}

export type DataSet =DataRow[];

export const TEST_DATA: DataSet= [{name: 'Corona',total_prob:0.09, inner_causes:{partying:0.45, smoking:0.1}},
{name:'BOld age', total_prob:0.8, inner_causes:{'smoking':0, partying:0}}, {name: 'Accidents', total_prob:0.11, inner_causes:{partying:0.1}}];

export const TEST_DATA2: DataSet= [{name: 'Corona',total_prob:0.15, inner_causes:{partying:0.05, smoking:0.20}},
{name:'BOld age', total_prob:0.7, inner_causes:{'smoking':0.02, partying: 0}}, {name: 'Accidents', total_prob:0.10, inner_causes:{partying:0}}];


//To make the text-on-rect visualization in d3, I felt it was necessary to introduce AugmentedDataRow, but now I think there are other ways around it, so this will probably deleted in the future:
interface Id {
    id: number
}

export interface AugmentedDataRow extends DataRow, Id {}

export type AugmentedDataSet= AugmentedDataRow[];