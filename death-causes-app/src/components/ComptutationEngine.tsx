import { DataRow, DataSet } from "./PlottingData";

export interface SquareSection {
    name: string,
    cause: string,
    x0: number,
    x: number
}

const zeroTruncater = (num: number) => Math.max(0,num)

function makeTruncater(maxval: number| null){
    if(maxval){
        return (num: number) => Math.min(maxval, Math.max(num,0))
    }
    else{
        return (num: number) => Math.max(0,num)
    }
}

function makeRowSquare(datRow: DataRow, max: number | null):SquareSection[]{
    let new_res=[];
    let rescaler=1
    if(max && max>1e-8 && datRow.totalProb>1e-8 && max<datRow.totalProb){
        rescaler=max/datRow.totalProb
    }
    const total_explained= Object.values(datRow.innerCauses).reduce((a, b) => a + b,0);
    // console.log(total_explained);
    let explained=1-total_explained;
    new_res.push({
        name: datRow.name,
        cause: 'Unexplained',
        x0:0,
        x: zeroTruncater(explained*datRow.totalProb)*rescaler
    });
    for (let [key, value] of Object.entries(datRow.innerCauses)) {
        new_res.push({
            name: datRow.name,
            cause: key,
            x0: zeroTruncater(explained*datRow.totalProb)*rescaler,
            x: zeroTruncater((explained+value)*datRow.totalProb)*rescaler
        });
        explained+=value;
    };
    return new_res;
}


function make_squares(res_dat: DataSet, setToWidth: string | null){
    let max: number | null=null; 
    if(setToWidth){
        max=res_dat.filter((datRow: DataRow) => datRow.name===setToWidth)[0].totalProb
    }
    const r: SquareSection[][]= res_dat.map( (p_object: DataRow): SquareSection[] => {
        return makeRowSquare(p_object, max)
    });
    const flattened_array = ([] as SquareSection[]).concat(...r);
    return flattened_array;
};

export default make_squares;