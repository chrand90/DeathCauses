import { BestValues } from "../../components/Calculations/ConsensusBestValue";
import {
  computeUsAndSs,
} from "../../components/Calculations/DebtInheritance";
import { RiskFactorGroup } from "../../components/database/RickFactorGroup";
import { OptimizabilityToNodes } from "../Optimizabilities";
import { OptimsToSDics, RiskRatioResult } from "./RiskFactorGroupResult";
import { ChangeStatus, DimensionStatus, MissingStatus, StochasticStatus, TypeStatus, UpdateDic, UpdateForm } from "./UpdateForm";
import FormUpdater from "./FormUpdater";

import addDistributionsForMissing from "./ReplacementDistribution";
import { KnowledgeableOptimizabilities } from "../Optimizabilities";

export default class RiskRatioGroupNode extends FormUpdater {
  riskFactorGroup: RiskFactorGroup;
  factorNames: string[];
  ageAsFactor: boolean;

  constructor(
    ancestors: string[],
    ageFrom: number | null,
    ageTo: number,
    riskFactorGroup: RiskFactorGroup
  ) {
    super(ancestors, ageFrom, ageTo);
    this.riskFactorGroup = riskFactorGroup;
    const factorNamesAsSet = riskFactorGroup.getAllFactorsInGroup();
    this.factorNames = Array.from(factorNamesAsSet);
    this.ageAsFactor = factorNamesAsSet.has("Age");
  }

  //overwriting
  handleMissing(allPreviousUpdateForms: UpdateDic){
    if(this.isAllButAgeMissing(allPreviousUpdateForms)){
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
        return this.computeWithMissing(allPreviousUpdateForms, this.missingAncestors(allPreviousUpdateForms))
    }
  }

 createNodeObject(SDicsValue: OptimsToSDics | OptimsToSDics[], valueStore: BestValues, dependsOnAge: boolean, normalizationFactors: number[]): UpdateForm {
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

  computeWithMissing(allPreviousUpdateForms: UpdateDic, missed: string[]){
    const startAge = this.getAgeFrom(allPreviousUpdateForms);
    const endAge = this.getAgeTo();
    const normalizationFactors = this.getNormalizationConstants(
      startAge,
      endAge
    );
    let relevantPreviousUpdateForms=Object.fromEntries(
      this.ancestors.filter(ancestor => !missed.includes(ancestor)).map(ancestor => {
        return [ancestor, allPreviousUpdateForms[ancestor]]
      })
    )
    const dependsOnAge= this.inputDependsOnAge(allPreviousUpdateForms) || this.ageAsFactor;
    addDistributionsForMissing(
      missed, 
      relevantPreviousUpdateForms, 
      startAge, 
      endAge, 
      dependsOnAge,
      this.riskFactorGroup.riskRatioTables,
      (a,b,c)=> this.getFactorAnswerValue(a,b,c))
    const { SDicsValue, valueStore } = this.getSDics(allPreviousUpdateForms, relevantPreviousUpdateForms, missed);
    return this.createNodeObject(SDicsValue, valueStore, dependsOnAge, normalizationFactors);
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
    const { SDicsValue, valueStore, dependsOnAge } = this.getSDics(allPreviousUpdateForms, allPreviousUpdateForms);
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
    alwaysFixed: string[],
    optimClasses: OptimizabilityToNodes
  ) {
    let optimToSdics: OptimsToSDics={};
    let previouslyCountouredFactors: string[] = [...alwaysFixed];
    if(this.ageAsFactor){
      previouslyCountouredFactors.push("Age")
    }
    Object.entries(optimClasses).forEach(
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

  //the first UpdateDic is used to initialize BestValues, whereas the other is used in computations. 
  getSDics(allPreviousUpdateForms: UpdateDic, updateFormsToUseInComputations: UpdateDic, alwaysFixed: string[]=[]) {
    const valueStore = new BestValues(
      this.ancestors,
      allPreviousUpdateForms,
    );
    let SDicsValue: OptimsToSDics | OptimsToSDics[]
    const dependsOnAge=this.inputDependsOnAge(allPreviousUpdateForms) || this.ageAsFactor;
    const thinnedOptimClasses=(allPreviousUpdateForms["optimizabilities"].value as KnowledgeableOptimizabilities).getOptimizabilityClasses(this.ancestors);
    if(dependsOnAge){
      const startAge= this.getAgeFrom(allPreviousUpdateForms);
      const endAge=this.getAgeTo();
      SDicsValue=[];
      for(let age=0; age<=(endAge-startAge); age++){
        SDicsValue.push(this.getSDicForAgeIndex(updateFormsToUseInComputations, age, valueStore, alwaysFixed, thinnedOptimClasses))
      }
    }
    else{
      SDicsValue= this.getSDicForAgeIndex(updateFormsToUseInComputations, 0, valueStore, alwaysFixed, thinnedOptimClasses);
    }
    return {SDicsValue, valueStore, dependsOnAge};
  }
}
