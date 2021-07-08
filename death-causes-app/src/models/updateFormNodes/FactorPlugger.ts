import { BestValues } from "../../components/Calculations/ConsensusBestValue";
import {
  computeUsAndSs,
  SetToNumber,
} from "../../components/Calculations/DebtInheritance";
import { RiskFactorGroup } from "../../components/database/RickFactorGroup";
import { OptimizabilityToNodes } from "../Descriptions";
import { OptimsToSDics, RiskRatioResult } from "./RiskFactorGroupResult";
import { ChangeStatus, DimensionStatus, MissingStatus, StochasticStatus, TypeStatus, UpdateDic, UpdateForm, UpdateFormSimple } from "./UpdateForm";
import FormUpdater from "./FormUpdater";
import { stringifyKey } from "mobx/dist/internal";
import { RiskRatioTable } from "../../components/database/RiskRatioTable";

export default class FactorPlugger extends FormUpdater {
  riskFactorGroup: RiskFactorGroup;
  factorNames: string[];
  ageAsFactor: boolean;

  constructor(
    ancestors: string[],
    ageFrom: number | null,
    ageTo: number,
    riskFactorGroup: RiskFactorGroup,
  ) {
    super(ancestors, ageFrom, ageTo);
    this.riskFactorGroup = riskFactorGroup;
    const factorNamesAsSet = riskFactorGroup.getAllFactorsInGroup();
    this.factorNames = Array.from(factorNamesAsSet);
    this.ageAsFactor = factorNamesAsSet.has("Age");
  }

  isAllMissing(allPreviousUpdateForms: UpdateDic): boolean {
      return this.ancestors.every(ancestor => {
          return allPreviousUpdateForms[ancestor].missing===MissingStatus.MISSING
      })
  }

  //overwriting
  handleMissing(allPreviousUpdateForms: UpdateDic){
    if(this.isAllMissing(allPreviousUpdateForms)){
        return {
            change: ChangeStatus.CHANGED,
            missing: MissingStatus.MISSING,
            type: TypeStatus.STRING,
            dimension: DimensionStatus.SINGLE,
            random: StochasticStatus.DETERMINISTIC,
            value: ""
        }
    }
    else {
        return this.compute(allPreviousUpdateForms)
    }
  }

  compute(allPreviousUpdateForms: UpdateDic){
    const anyYearly= !this.ancestors.every(d=>{
        return allPreviousUpdateForms[d].dimension===DimensionStatus.SINGLE
    })
    const anyStochastic= !this.ancestors.every(d=> {
        return allPreviousUpdateForms[d].random===StochasticStatus.DETERMINISTIC
    })
    const anyMissing= !this.ancestors.every(d=> {
        return allPreviousUpdateForms[d].missing===MissingStatus.NONMISSING
    })
    return {
        dimension: anyYearly ? DimensionStatus.YEARLY : DimensionStatus.SINGLE,
        missing: MissingStatus.NONMISSING,
        random: anyStochastic || anyMissing ? StochasticStatus.RANDOM : StochasticStatus.DETERMINISTIC,
        type: TypeStatus.SIMPLE_UPDATE_FORM,
        change: ChangeStatus.CHANGED,
        value: this.makeFactorAnswerDic(allPreviousUpdateForms, anyMissing, anyStochastic, anyYearly)
    }
  }

  getAnyRelevantRiskRatioTable(ancestor:string): RiskRatioTable{
      let riskRatioTable= this.riskFactorGroup.riskRatioTables.find(rrt => {
          return rrt.getFactorNames().includes(ancestor)
      })
      if(!riskRatioTable){
        throw Error("There were no risk ratio table with the requested factor")
      }
      return riskRatioTable
  }

  makeFactorAnswerDic(allPreviousUpdateForms: UpdateDic, anyMissing:boolean, anyStochastic: boolean, anyYearly: boolean): {[factor: string]: UpdateFormSimple}{
    let res: {[key: string]:UpdateFormSimple}={}
    this.ancestors.forEach(ancestor=> {
        if(allPreviousUpdateForms[ancestor].missing===MissingStatus.MISSING){
            let rrt=this.getAnyRelevantRiskRatioTable()
            res[ancestor]={
                missing: MissingStatus.NONMISSING,
                random: StochasticStatus.RANDOM,
                
            }
        }
        else{
            res[ancestor]=allPreviousUpdateForms[ancestor] as UpdateFormSimple;
        }
    })
    return res
  }

  acompute(allPreviousUpdateForms: UpdateDic): UpdateForm {
    const startAge = this.getAgeFrom(allPreviousUpdateForms);
    const endAge = this.getAgeTo();
    const normalizationFactors = this.getNormalizationConstants(
      startAge,
      endAge
    );
    const { SDicsValue, valueStore, dependsOnAge } = this.getSDics(allPreviousUpdateForms);
    if(dependsOnAge){
      return {
        dimension: DimensionStatus.YEARLY,
        missing: MissingStatus.NONMISSING,
        change: ChangeStatus.CHANGED,
        type: TypeStatus.RISKFACTORGROUPRESULT,
        random: StochasticStatus.DETERMINISTIC,
        value: {
          bestValues: valueStore,
          SDics: SDicsValue,
          normalizationFactors: normalizationFactors
        }
      }
    }
    return {
      dimension: DimensionStatus.SINGLE,
      missing: MissingStatus.NONMISSING,
      change: ChangeStatus.CHANGED,
      type: TypeStatus.RISKFACTORGROUPRESULT,
      random: StochasticStatus.DETERMINISTIC,
      value: {
        bestValues: valueStore,
        SDics: SDicsValue,
        normalizationFactors: normalizationFactors
      }
    }
  }

  getSDicForAgeIndex(
    allPreviousUpdateForms: UpdateDic,
    ageIndex: number,
    valueStore: BestValues,
  ) {
    let optimToSdics: OptimsToSDics={};
    let previouslyCountouredFactors: string[] = [];
    if(this.ageAsFactor){
      previouslyCountouredFactors.push("Age")
    }
    Object.entries(this.optimizabilityClasses).forEach(
      ([optimValue, nodes]) => {
        let RRresults: RiskRatioResult[]=[];
        this.riskFactorGroup.riskRatioTables.forEach((rrt, index) => {
          let freeFactors = rrt
            .getFactorNamesWithoutAge()
            .filter((factorName: string) => {
              return nodes.includes(factorName);
            });
            const { SDic, RRmax } = computeUsAndSs(
              rrt,
              allPreviousUpdateForms,
              freeFactors,
              previouslyCountouredFactors,
              valueStore,
              ageIndex
            );
            RRresults.push({
              RRmax: RRmax,
              SDics: SDic
            })
          }
        );
        previouslyCountouredFactors=previouslyCountouredFactors.concat(nodes.filter(d=>d!=="Age"))
        optimToSdics[optimValue]=RRresults;
      }
    );
    return optimToSdics;
  }

  getSDics(allPreviousUpdateForms: UpdateDic) {
    const valueStore = new BestValues(
      this.optimizabilityClasses,
      allPreviousUpdateForms,
    );
    let SDicsValue: OptimsToSDics | OptimsToSDics[]
    const dependsOnAge=this.inputDependsOnAge(allPreviousUpdateForms) || this.ageAsFactor;
    if(dependsOnAge){
      const startAge= this.getAgeFrom(allPreviousUpdateForms);
      const endAge=this.getAgeTo();
      SDicsValue=[];
      for(let age=0; age<=(endAge-startAge); age++){
        SDicsValue.push(this.getSDicForAgeIndex(allPreviousUpdateForms, age, valueStore))
      }
    }
    else{
      SDicsValue= this.getSDicForAgeIndex(allPreviousUpdateForms, 0, valueStore);
    }
    return {SDicsValue, valueStore, dependsOnAge};
  }
}
