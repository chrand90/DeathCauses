import { CalculationFacade } from "../../components/Calculations/CalculationsFacade";
import { SurvivalCurveData } from "../../components/Calculations/SurvivalCurveData";
import { DataRow } from "../../components/PlottingData";
import { FactorAnswers } from "../Factors";
import RelationLinks, {NodeType} from "../RelationLinks";
import {ComputedFactorClasses} from "./ComputedFactors";
import { DimensionStatus, FormUpdater, InputFactorToUpdateForm, MissingStatus, UpdateDic } from "./UpdateFormInitialize";

function updateDicToFactorAnswers(udic:UpdateDic){
    let res: FactorAnswers={}
    Object.entries(udic).forEach(  ([factorname, updateform])  => {
        if(updateform.missing===MissingStatus.MISSING){
            res[factorname]=""
        }
        else if(updateform.dimension===DimensionStatus.YEARLY){
            res[factorname]=(updateform.value as number[] | string[])[0].toString();
        }
        else{
            res[factorname]=(updateform.value as number | string).toString();
        }
    } )
    console.log("back to factoranswers")
    console.log(res);
    return res
}
export default class ComputeController {
    formUpdaters: FormUpdater[];
    inputFactorTreater: InputFactorToUpdateForm;
    formUpdaterNames: string[];
    ageFrom: null | number;
    ageTo:number;
    calculationFacade: CalculationFacade;

    constructor(rdat: RelationLinks, ageFrom: null | number, ageTo: number=120, calculationFacade: CalculationFacade){
        this.formUpdaters=[];
        this.formUpdaterNames=[];
        this.inputFactorTreater=new InputFactorToUpdateForm();
        this.ageFrom=ageFrom
        this.ageTo=ageTo
        this.calculationFacade=calculationFacade
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

    computeInnerProbabilities(factorAnswers: FactorAnswers):DataRow[] { // Promise<DataRow[]> {
        return this.calculationFacade.calculateInnerProbabilities(updateDicToFactorAnswers(this.compute(factorAnswers)));
        // return this.compute(factorAnswers).then((udic:UpdateDic) => {
        //     return updateDicToFactorAnswers(udic);
        // }).then((fAnswers: FactorAnswers) => {
        //     return this.calculationFacade.calculateInnerProbabilities(fAnswers);
        // })
    }

    compute(factorAnswers: FactorAnswers): UpdateDic { //Promise<UpdateDic>{
        let res:UpdateDic= this.inputFactorTreater.update(factorAnswers);
        this.formUpdaters.forEach((formUpdater,i) => {
            res[this.formUpdaterNames[i]]=formUpdater.update(res);
        })
        return res
        //return new Promise((resolve) => { resolve(res)});
    }

    computeSurvivalData(factorAnswers: FactorAnswers): SurvivalCurveData[] { //Promise<SurvivalCurveData[]>{
        return this.calculationFacade.calculateSurvivalCurve(updateDicToFactorAnswers(this.compute(factorAnswers)));
        // return this.compute(factorAnswers).then((udic:UpdateDic) => {
        //     return updateDicToFactorAnswers(udic);
        // }).then((fAnswers: FactorAnswers) => {
        //     return this.calculationFacade.calculateSurvivalCurve(fAnswers);
        // })
    }


} 