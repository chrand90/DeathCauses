
class RiskRatioTable {
    constructor(risk_ratio_init){
        this.factor_names=risk_ratio_init.shift(); //takes and removes first element
        this.intervals={};
        this.factor_names.forEach( (e,i) => {
            this.intervals[e]={};
        });
        this.rr_rows=risk_ratio_init.map(r => {return this.parse_row(r)});
    }

    parse_row(row){
        let res={RR: row.pop()};
        row.forEach((factor_level, index) => {
            res[this.factor_names[index]]= new Interval(factor_level);
        });
        return res;
    }
}

class RiskRatioGroup {

    constructor(db_info){

        //Initialize 
        this.age_normalizers=db_info[0];
        this.g=db_info[2];
        this.risk_ratio_files= db_info[1].map(rrt => {
            return new RiskRatioTable(rrt)
        });
        this.factor_names=null;
        this.factor_values=null;
        this.result_values={
            //output_type1: null,... output_typeN: null
        };
    }

    get_values(new_factor_values, requested_output_type){
        if(this.needsRecomputing(new_factor_values)){

        }
    }

    needsRecomputing(new_factor_values){
        //Test new_factor_values mod this.factor_values
    }

}

class Interval {

}

export default class Cause {

    constructor(database_info){

        //initialize information from database_info

        this.cause_name=database_info[0];
        this.age_rates=database_info[1];
        this.risk_ratio_files = database_info[2].map( risk_ratio_group => {
            return new RiskRatioGroup(risk_ratio_group);
        } );
        //and so on...

        this.factor_values=null;
    }

    


}