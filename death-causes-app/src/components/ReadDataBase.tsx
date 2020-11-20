
export default function compute_causes(json_database: any, factor_answers:any, aggregate_ages: any){
    const res: any=[];
    const placeholder: any={};
    const y_probs : any = {}
    for (const [key, value] of Object.entries(json_database)) {
        const {inner_causes, yearly_probs}= compute_one_cause(value, factor_answers, aggregate_ages);
        y_probs[key]=yearly_probs;
        placeholder[key]=inner_causes;
        //const disease_object = {name:key, inner_causes: inner_causes, total_prob: 0.1};
        //res.push(disease_object);
    }
    console.log(placeholder);
    const totals=compute_totals(y_probs);
    for(const [key, value] of Object.entries(placeholder)){
        const disease_object= {name: key, inner_causes:value, total_prob: totals[key]}
        res.push(disease_object)
    }
    console.log('res');
    console.log(res);
    return res;
    //console.log(res);
};

function compute_totals(y_probs: any): any{
    let probability_of_being_alive=1.0;
    let probability_of_dying_of_causes: any= {};
    let okey: any;
    console.log(Object.keys(y_probs));
    for( okey of Object.keys(y_probs)){
        probability_of_dying_of_causes[okey]=0.0
    }
    const l1=y_probs[Object.keys(y_probs)[0]]
    for(let i=0; i<l1.length; i++){
        let prob_of_dying_this_year=0;
        for( const key of Object.keys(y_probs)){
            let p= y_probs[key][i];
            probability_of_dying_of_causes[key]+=probability_of_being_alive*p
            prob_of_dying_this_year+=p
        }
        probability_of_being_alive*=(1-prob_of_dying_this_year);
    }
    return probability_of_dying_of_causes
}

const lims: number[]= [1,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100,200];
function get_single_age_prob(Age_object: any, age:any): number{
    for (let step = 0; step < lims.length; step++) {
        if(age<lims[step]){
            return Age_object[step]
        }
    }
    return 0;
}

function get_age_probs(Age_object: any, ages: any): number[]{
    const a: any= ages.map( (age: any) => {
        const g=get_single_age_prob(Age_object, age);
        return g;
    });
    return a;
}

function get_normalizing_factors(Age_object:any, ages:any, earlier_objects:any){
    const res:any=[]
    for(let i=0; i<ages.length; i++){
        res.push(1.0/get_single_age_prob(Age_object, ages[i])*earlier_objects[i]);
    }
    return res
}

function extract_risk_tables(Riskfactorgroupitems: any, prevs:any,ages:any ){
    const riskratio_tables: any=[];
    const factor_names: any=[];
    let normalizers=prevs;
    for( let i=0; i< Riskfactorgroupitems.length; i++){
        let all_one_dimensional=true;
        const to_add:any =[];
        const temp_factornames: any=[];
        for(let j=0; j<Riskfactorgroupitems[i].riskRatioTables.length; j++){
            const factornames: any=Riskfactorgroupitems[i].riskRatioTables[j].riskFactorNames;
            if(factornames.includes('HCVHistory')){
                console.log('hej');
            }
            temp_factornames.push(...factornames);
            if(factornames.length!==1){
                all_one_dimensional=false;
            }
            to_add.push(Riskfactorgroupitems[i].riskRatioTables[j].riskRatioTable);
        }
        if(all_one_dimensional){
            riskratio_tables.push(...to_add);
            factor_names.push(...temp_factornames);
            normalizers=get_normalizing_factors(Riskfactorgroupitems[i].normalisingFactors.age_prevalences, ages, normalizers);
        }
    }
    return {normalizing_factors:normalizers, riskratio_tables:riskratio_tables, factor_names: factor_names};
}

function belongs_in_category(cat:any, val:any):boolean{
    if(cat.includes('+')){
        const lower_limit_string=cat.substring(0, cat.length-1)
        if(val>=parseFloat(lower_limit_string)){
            return true;
        }
        else{
            return false;
        }
    }
    if(cat.includes('-')){
        if(cat.substring(0,1)==='-'){
            const upper_lower_limit_string=cat.substring(1, cat.length)
            if(val<=parseFloat(upper_lower_limit_string)){
                return true;
            }
            else{
                return false;
            }
        }
        else{
            const limss= cat.split('-')
            const lower_lim=parseFloat(limss[0]);
            const upper_lim= parseFloat(limss[1]);
            if(lower_lim<= val && val <= upper_lim){
                return true;
            }
            else{
                return false;
            }
        }

    }
    if(!isNaN(cat)){
       let ncat=parseFloat(cat) 
       if(ncat-0.00001< val && ncat+0.00001>val){
           return true;
       }
       else{
           return false;
       }
    }
    if(cat==='Yes'){
        return val===true;
    }
    if(cat==='No'){
        return val===false;
    }
    return cat===val;
}

function get_high_and_low_risks(RR:any , f:any){
    let RRvals:any =[]
    let found_fitting_cat: boolean=false;
    let RRhigh:any=null;
    let RRval:any=null;
    let fcat:any=null;
    let RRrow:any=null;
    for(let i=0; i<RR.length-1; i++){
        RRrow=RR[i]
        RRval=RRrow[1];
        RRvals.push(RRval);
        fcat=RRrow[0][0];
        const bel= belongs_in_category(fcat, f)
        console.log(f + ' in ' + fcat + ': '+bel)
        if(bel){
            RRhigh=RRval;
            found_fitting_cat=true;
            break;
        }
    }
    RRrow= RR[RR.length-1]
    RRval= RRrow[1];
    RRvals.push(RRval);
    if(!found_fitting_cat){
        RRhigh=RRval
    }
    let RRlow=Math.min(...RRvals);
    return {risk_high: RRhigh, risk_low: RRlow}


}

function get_inner_causes_and_all_probs(risktables: any, factornames: any, factor_answers: any,  normalizing_factors: any){
    let risk_highs: any=[];
    let f_answer: any=null;
    let randomness_fault: any=[];
    if(factornames.includes('Depression')){
        console.log("Depression")
    }
    for( let i=0; i<factornames.length; i++){
        let factor_name=factornames[i];
        let riskratio_table=risktables[i];
        f_answer=factor_answers[factor_name.toLowerCase()];
        let {risk_high, risk_low}= get_high_and_low_risks(riskratio_table, f_answer);
        risk_highs.push(risk_high);
        randomness_fault.push(risk_high===0 ? 1 : risk_low/risk_high);
    }
    let total_randomness=randomness_fault.reduce((a: number, b: number)=> a*b, 1)
    let expls: any=[];
    for(let i=0; i<randomness_fault.length; i++){
        if(randomness_fault[i]===0){
            expls.push(1);
        }
        else{
            expls.push(1/randomness_fault[i]-1);
        }
    }
    let expl_sum = expls.reduce((a: number, b: number)=> a+b, 0)
    let inner_causes:any={}
    if(risk_highs){
        for(let i=0; i< factornames.length; i++){
            inner_causes[factornames[i]]=expl_sum===0 ? 0 : expls[i]/expl_sum*(1-total_randomness)
        }
    }
    let yearly_probs=[]
    let total_RR=risk_highs.reduce((a: number, b: number)=> a*b, 1);
    for(let i=0; i<normalizing_factors.length; i++){
        yearly_probs.push(total_RR*normalizing_factors[i]);
    }
    return {inner_causes: inner_causes, yearly_probs: yearly_probs};
}

function compute_one_cause(cause_object: any, factor_answers: any, aggregate_ages: any){
    const age_probs: any= get_age_probs(cause_object.Age.age_prevalences, aggregate_ages);
    const {normalizing_factors, riskratio_tables, factor_names} = extract_risk_tables(cause_object.RiskFactorGroups, age_probs, aggregate_ages);
    return  get_inner_causes_and_all_probs(riskratio_tables, factor_names, factor_answers, normalizing_factors);
}