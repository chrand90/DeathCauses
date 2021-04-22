import { BestValues } from "../../components/Calculations/ConsensusBestValue";
import {
  computeUsAndSs,
  SetToNumber,
} from "../../components/Calculations/DebtInheritance";
import { RiskFactorGroup } from "../../components/database/RickFactorGroup";
import { OptimizabilityToNodes } from "../RelationLinks";
import { OptimsToSDics, RiskRatioResult } from "./RiskFactorGroupResult";
import { ChangeStatus, DimensionStatus, MissingStatus, StochasticStatus, TypeStatus, UpdateDic, UpdateForm } from "./UpdateForm";
import FormUpdater from "./FormUpdater";

export default class RiskRatioGroupNode extends FormUpdater {
  riskFactorGroup: RiskFactorGroup;
  factorNames: string[];
  ageAsFactor: boolean;
  optimizabilityClasses: OptimizabilityToNodes;

  constructor(
    ancestors: string[],
    ageFrom: number | null,
    ageTo: number,
    riskFactorGroup: RiskFactorGroup,
    optimizabilityClasses: OptimizabilityToNodes
  ) {
    super(ancestors, ageFrom, ageTo);
    this.riskFactorGroup = riskFactorGroup;
    const factorNamesAsSet = riskFactorGroup.getAllFactorsInGroup();
    this.factorNames = Array.from(factorNamesAsSet);
    this.ageAsFactor = factorNamesAsSet.has("Age");
    this.optimizabilityClasses = optimizabilityClasses;
  }



  getNormalizationConstants(startAge: number, endAge: number) {
    let normalizationFactors: number[] = [];
    for (let age = startAge; age <= endAge; age++) {
      normalizationFactors.push(
        this.riskFactorGroup.normalisationFactors.getPrevalence(age)
      );
    }
    return normalizationFactors;
  }

  compute(allPreviousUpdateForms: UpdateDic): UpdateForm {
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
    if(Object.values(this.optimizabilityClasses).some((nodes) => { return nodes.includes("Age")})){
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
      allPreviousUpdateForms
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
