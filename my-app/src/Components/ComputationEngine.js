import { sum } from "d3";
import Cause from './Cause.js';



export class Database {
    constructor(database){
        this.db=this.initialize_database(database)
    }

    initialize_database(database){
        this.db = database.map( cause => {
            return new Cause(cause);
        })
    }

    compute_bar_chart_probs(age_from, age_to, factor_answers){
        return '';
    }

    compute_per_year_probs(age_from, age_to, factor_answers){
        return '';
    }

    
}


export function make_squares(res_dat){
    let r= res_dat.map( p_object => {
        let new_res=[];
        const total_explained= Object.values(p_object.inner_causes).reduce((a, b) => a + b,0);
        console.log(total_explained);
        let explained=1-total_explained;
        new_res.push({
            name: p_object.name,
            cause: 'Unexplained',
            x0:0,
            x: explained*p_object.total_prob
        });
        for (let [key, value] of Object.entries(p_object.inner_causes)) {
            new_res.push({
                name: p_object.name,
                cause: key,
                x0: explained*p_object.total_prob,
                x: (explained+value)*p_object.total_prob
            });
            explained+=value;
        };
        return new_res;
    });
    let flattened_array = [].concat.apply([],r);
    return flattened_array;
};
