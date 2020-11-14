
export type InnerCause = {
    [key: string]: number;
}

export type DataRow = {
    name: string,
    total_prob: number,
    inner_causes: InnerCause
}

export type DataSet = DataRow[];

export const TEST_DATA: DataSet= [{name: 'Corona',total_prob:0.15, inner_causes:{partying:0.45, smoking:0.1}},
{name:'Old age', total_prob:0.75, inner_causes:{}}, {name: 'Accidents', total_prob:0.10, inner_causes:{partying:0.1}}];

