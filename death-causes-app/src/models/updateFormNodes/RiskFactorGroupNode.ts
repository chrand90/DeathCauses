import { BestValues } from "../../components/Calculations/ConsensusBestValue";
import {
  computeUsAndSs,
  SetToNumber,
} from "../../components/Calculations/DebtInheritance";
import { RiskFactorGroup } from "../../components/database/RickFactorGroup";
import { OptimizabilityToNodes } from "../Descriptions";
import { OptimsToSDics, RiskRatioResult } from "./RiskFactorGroupResult";
import { ChangeStatus, DimensionStatus, MissingStatus, ProbabilityObject, StochasticStatus, TypeStatus, UpdateDic, UpdateForm } from "./UpdateForm";
import FormUpdater from "./FormUpdater";
import { RiskRatioTable } from "../../components/database/RiskRatioTable";
import { RiskRatioTableEntry } from "../../components/database/RiskRatioTableEntry";

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
    optimizabilityClasses: OptimizabilityToNodes,
  ) {
    super(ancestors, ageFrom, ageTo);
    this.riskFactorGroup = riskFactorGroup;
    const factorNamesAsSet = riskFactorGroup.getAllFactorsInGroup();
    this.factorNames = Array.from(factorNamesAsSet);
    this.ageAsFactor = factorNamesAsSet.has("Age");
    this.optimizabilityClasses = optimizabilityClasses;
  }

  missingAncestors(allPreviousUpdateForms: UpdateDic): string[] {
    return this.ancestors.filter(ancestor => {
        return allPreviousUpdateForms[ancestor].missing===MissingStatus.MISSING
    })
  }

  //overwriting
  handleMissing(allPreviousUpdateForms: UpdateDic){
    const missed=this.missingAncestors(allPreviousUpdateForms)
    if(missed.length===this.ancestors.length || (this.ancestors.length-1===missed.length && !missed.includes("Age") && this.ancestors.includes("Age"))){
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
        return this.computeWithMissing(allPreviousUpdateForms, missed)
    }
  }

  computeReplacementDistributionStochasticInput(
    rrt: RiskRatioTableEntry[], 
    updateForms: UpdateDic, 
    factorNameToIndex:{[factorName:string]:number}, 
    factorName: string,
    ageIndex:number){
      const weightedRowsRaw=rrt.map( riskRatioTableEntry => {
        const weights= Object.keys(updateForms).map((fName: string) => {
          if(fName in factorNameToIndex){
            const answer= this.getFactorAnswerValue(updateForms, fName, ageIndex) as string | number | ProbabilityObject
            if(typeof answer==="number" || typeof answer==="string"){
              if(riskRatioTableEntry.isSingleFactorInDomain(factorNameToIndex[fName], answer)){
                return 1
              }
              return 0
            }
            let totalWeight=0;
            Object.entries(answer).forEach(([value, weight]) => {
              if(riskRatioTableEntry.isSingleFactorInDomain(factorNameToIndex[fName], value)){
                totalWeight+=weight
              }
            })
            return totalWeight;
          }
          return 1
        })
        return {weight:weights.reduce((a,b)=>a*b,1), row:riskRatioTableEntry}
      })
      let keyToWeight: ProbabilityObject={}
      weightedRowsRaw.forEach(({weight,row}) => {
        const factorval=row.factorValues[factorNameToIndex[factorName]].getValueInCell().toString()
        if(factorval in keyToWeight){
          keyToWeight[factorval]+=row.frequency*weight
        }
        else{
          keyToWeight[factorval]=row.frequency*weight
        }
      })
      return keyToWeight  
    }

  computeReplacementDistributionDeterministicInput(
    rrt: RiskRatioTableEntry[], 
    updateForms: UpdateDic, 
    factorNameToIndex:{[factorName:string]:number}, 
    factorName: string,
    ageIndex:number){
    const relevantRows=rrt.filter( riskRatioTableEntry => {
      return Object.keys(updateForms).every((fName: string) => {
        if(fName in factorNameToIndex){
          const answer= this.getFactorAnswerValue(updateForms, fName, ageIndex) as string | number
          return riskRatioTableEntry.isSingleFactorInDomain(factorNameToIndex[fName], answer)  
        }
        return true;
      })
    })
    if(relevantRows.length===0){
      throw Error("No rows satisfied the criteria.")
    }
    let keyToWeight: ProbabilityObject={}
    relevantRows.forEach(row => {
      const factorval=row.factorValues[factorNameToIndex[factorName]].getValueInCell().toString()
      if(factorval in keyToWeight){
        keyToWeight[factorval]+=row.frequency
      }
      else{
        keyToWeight[factorval]=row.frequency
      }
    })
    return keyToWeight
  }

  computeReplacementDistribution(
    rrt: RiskRatioTableEntry[], 
    updateForms: UpdateDic, 
    factorNameToIndex:{[factorName:string]:number}, 
    factorName: string,
    ageIndex:number){
      const anyStochastic=Object.values(updateForms).some((updateFormNode: UpdateForm) => {
        return updateFormNode.random===StochasticStatus.RANDOM
      })
      return this.computeReplacementDistributionStochasticInput(
        rrt,
        updateForms,
        factorNameToIndex,
        factorName,
        ageIndex
      )
      //it is possible to call computeReplacementDistributionStochasticInput every time, but to save time, we make the distinction.
      if(anyStochastic){
        return this.computeReplacementDistributionStochasticInput(
          rrt,
          updateForms,
          factorNameToIndex,
          factorName,
          ageIndex
        )
      }
      else{
        return this.computeReplacementDistributionDeterministicInput(
          rrt,
          updateForms,
          factorNameToIndex,
          factorName,
          ageIndex
        )
      }
    }

  addDistributionsForMissing(missed: string[], updateForms: UpdateDic,ageFrom:number, ageTo:number, dependsOnAge: boolean){
    missed.forEach( missingFactor => {
      const chosenRRT= this.riskFactorGroup.riskRatioTables.filter(rrt => {
        return rrt.getFactorNames().includes(missingFactor)
      }).sort(function(a: RiskRatioTable, b: RiskRatioTable){
        return a.getFactorNames().filter(fname => {
          return !missed.includes(fname)
        }).length-
        b.getFactorNames().filter(fname => {
          return !missed.includes(fname)
        }).length
      })[0]
      if(dependsOnAge){
        const probObjects:ProbabilityObject[]=[]
        for(let i=0; i<ageTo-ageFrom+1; i++){
          probObjects.push(
            this.computeReplacementDistribution(
            chosenRRT.riskRatioTable,
            updateForms,
            chosenRRT.getFactorNameToIndex(), 
            missingFactor, 
            i)
          )
        }
        updateForms[missingFactor]={
          random: StochasticStatus.RANDOM,
          dimension: DimensionStatus.YEARLY,
          missing: MissingStatus.NONMISSING,
          type: chosenRRT.getType(missingFactor),
          change: ChangeStatus.CHANGED,
          value: probObjects
        }
      }
      else{
        const probObject=this.computeReplacementDistribution(
          chosenRRT.riskRatioTable,
          updateForms,
          chosenRRT.getFactorNameToIndex(), 
          missingFactor, 
          0)
        updateForms[missingFactor]={
          random: StochasticStatus.RANDOM,
          dimension: DimensionStatus.SINGLE,
          missing: MissingStatus.NONMISSING,
          type: chosenRRT.getType(missingFactor),
          change: ChangeStatus.CHANGED,
          value: probObject
        }
      }
    });
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
    this.addDistributionsForMissing(missed, relevantPreviousUpdateForms, startAge, endAge, dependsOnAge)
    console.log(relevantPreviousUpdateForms);
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

  thinOptimizabilityClasses(fixed: string[]): OptimizabilityToNodes{
    fixed=[...fixed, "Age"];
    const optimNodesPairs= Object.entries(this.optimizabilityClasses).map(
      ([optimClass, nodes]) => {
        return [optimClass, nodes.filter(nodeName => !fixed.includes(nodeName))]
      }
    ).filter(([optimClass, nodes]) => {
      return nodes.length>0
    })
    return Object.fromEntries(optimNodesPairs);
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

  getSDics(allPreviousUpdateForms: UpdateDic, updateFormsToUseInComputations: UpdateDic, alwaysFixed: string[]=[]) {
    const valueStore = new BestValues(
      this.optimizabilityClasses,
      allPreviousUpdateForms,
    );
    let SDicsValue: OptimsToSDics | OptimsToSDics[]
    const dependsOnAge=this.inputDependsOnAge(allPreviousUpdateForms) || this.ageAsFactor;
    const thinnedOptimClasses=this.thinOptimizabilityClasses(alwaysFixed);
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
