import { FactorAnswers } from "../Factors";
import RelationLinks, {NodeType} from "../RelationLinks";
import {ComputedFactorClasses} from "./ComputedFactors";
import { FormUpdater, InputFactorToUpdateForm, UpdateDic } from "./UpdateFormInitialize";


export default class ComputeController {
    formUpdaters: FormUpdater[];
    inputFactorTreater: InputFactorToUpdateForm;
    formUpdaterNames: string[];
    ageFrom: null | number;
    ageTo:number;

    constructor(rdat: RelationLinks, ageFrom: null | number, ageTo: number=120){
        this.formUpdaters=[];
        this.formUpdaterNames=[];
        this.inputFactorTreater=new InputFactorToUpdateForm();
        this.ageFrom=ageFrom
        this.ageTo=ageTo
        this.initialize(rdat)        
    }

    initialize(rdat: RelationLinks){
        rdat.sortedNodes[NodeType.COMPUTED_FACTOR].forEach((computedFactorName) => {
            let ancestors= rdat.getAncestors(computedFactorName)
            if(!(computedFactorName in ComputedFactorClasses)){
                throw computedFactorName.toString()+" was not defined as a computed factor";
            }
            this.formUpdaters.push(ComputedFactorClasses[computedFactorName](ancestors, this.ageFrom, this.ageTo))
            this.formUpdaterNames.push(computedFactorName);
        })
    }

    compute(factorAnswers: FactorAnswers): Promise<UpdateDic>{
        let res:UpdateDic= this.inputFactorTreater.update(factorAnswers);
        this.formUpdaters.forEach((formUpdater,i) => {
            res[this.formUpdaterNames[i]]=formUpdater.update(res);
        })
        return new Promise((resolve) => { resolve(res)});
    }


} 