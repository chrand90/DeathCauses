import { FactorAnswers } from "../Factors";
import RelationLinks, {COMPUTED_FACTOR} from "../RelationLinks";
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
        rdat.sortedNodes[COMPUTED_FACTOR].forEach((computedFactorName) => {
            let ancestors= rdat.getAncestors(computedFactorName)
            if(!(computedFactorName in ComputedFactorClasses)){
                throw computedFactorName+" was not defined as a computed factor";
            }
            this.formUpdaters.push(ComputedFactorClasses[computedFactorName](ancestors, this.ageFrom, this.ageTo))
            this.formUpdaterNames.push(computedFactorName);
        })
    }

    compute(factorAnswers: FactorAnswers): UpdateDic{
        let res:UpdateDic= this.inputFactorTreater.update(factorAnswers);
        this.formUpdaters.forEach((formUpdater,i) => {
            res[this.formUpdaterNames[i]]=formUpdater.update(res);
        })
        return res;
    }
} 