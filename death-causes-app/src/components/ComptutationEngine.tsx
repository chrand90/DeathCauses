import { DataRow, DataSet } from "./PlottingData";

export interface SquareSection {
    name: string,
    cause: string,
    x0: number,
    x: number
}


function make_squares(res_dat: DataSet){
    const r: SquareSection[][]= res_dat.map( (p_object: DataRow): SquareSection[] => {
        let new_res=[];
        const total_explained= Object.values(p_object.innerCauses).reduce((a, b) => a + b,0);
        // console.log(total_explained);
        let explained=1-total_explained;
        new_res.push({
            name: p_object.name,
            cause: 'Unexplained',
            x0:0,
            x: Math.max(0,explained*p_object.totalProb)
        });
        for (let [key, value] of Object.entries(p_object.innerCauses)) {
            new_res.push({
                name: p_object.name,
                cause: key,
                x0: Math.max(explained*p_object.totalProb),
                x: Math.max((explained+value)*p_object.totalProb,0)
            });
            explained+=value;
        };
        return new_res;
    });
    const flattened_array = ([] as SquareSection[]).concat(...r);
    return flattened_array;
};

export default make_squares;