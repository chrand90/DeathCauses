import { action, computed, makeObservable, observable, toJS } from "mobx";
import { FactorAnswers } from "../models/Factors";
import { FactorAnswerChanges, UNKNOWNLABEL } from "../models/updateFormNodes/FactorAnswersToUpdateForm";
import { ConditionsRes } from "../models/updateFormNodes/FinalSummary/ConditionSummary";
import { DeathCauseContributionsAndChanges } from "../models/updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy";
import UpdateFormController from "../models/updateFormNodes/UpdateFormController";
import Worker from "../models/worker";
import AdvancedOptionsStore, { EVALUATION_UNIT, Threading } from "./AdvancedOptionsStore";
import ComputationStateStore, {
  ComputationState
} from "./ComputationStateStore";
import LoadedDataStore from "./LoadedDataStore";

export interface Shadowing {
  shadowsTheChange: string[];
  unshadowedByTheChange: string[];
  shadowedByTheChange: string[];
}

const worker = new Worker();

export default class ComputationStore {
  submittedFactorAnswers: FactorAnswers;
  loadedDataStore: LoadedDataStore;
  advancedOptionsStore: AdvancedOptionsStore;
  riskFactorContributions: DeathCauseContributionsAndChanges;
  singeThreadComputeController: UpdateFormController | null;
  computationStateStore: ComputationStateStore;
  allChanges: FactorAnswerChanges[];
  lifeExpectancies: number[];
  conditionRes: ConditionsRes;

  constructor(
    loadedDataStore: LoadedDataStore,
    advancedOptionsStore: AdvancedOptionsStore,
    computationStateStore: ComputationStateStore
  ) {
    this.computationStateStore = computationStateStore;
    this.submittedFactorAnswers = {};
    this.riskFactorContributions = {ages: [], survivalProbs: [], baseLifeExpectancy: 0, evaluationUnit: EVALUATION_UNIT.PROBABILITY, costPerCause: {}, changes: {}};
    this.singeThreadComputeController = null;
    this.allChanges=[]
    this.lifeExpectancies=[]
    this.conditionRes= {averageProportion: {}, probOfHavingWhileDying: {}};
    makeObservable(this, {
      submittedFactorAnswers: observable,
      lifeExpectancies: observable,
      allChanges: observable,
      factorShadowing: computed,
      pushChanges:action.bound,
      attachLoadedData: action.bound,
    });
    this.loadedDataStore = loadedDataStore;
    this.advancedOptionsStore = advancedOptionsStore;
  }

  get factorShadowing(): Shadowing{
    let unshadowedByTheChange= new Set<string>();
    let shadowsTheChange= new Set<string>();
    let shadowedByTheChange= new Set<string>();
    Object.entries(this.allChanges[0]).forEach(([factorName, {fromVal, toVal}]) => {
      const siblingGroups= this.loadedDataStore.rdat.getDependentFactors(factorName)
      siblingGroups.forEach(siblingGroup => {
        let missings=siblingGroup.filter(siblingName => {
          return this.submittedFactorAnswers[siblingName]==="";
        })
        let notChangedThisRound=siblingGroup.filter(siblingName => {
          return !(siblingName in this.allChanges[0])
        })
        if(missings.length===0){
          //Now that there are no missing we know then toVal can't be missing 
          if(fromVal===UNKNOWNLABEL){
            notChangedThisRound.forEach(sibling => unshadowedByTheChange.add(sibling));
          }
        }
        else {
          const previousNonMissing=missings.every(missing => {
            return missing in this.allChanges[0] && this.allChanges[0][missing].fromVal!==UNKNOWNLABEL
          })
          if(previousNonMissing && missings.length<siblingGroup.length){
            notChangedThisRound.forEach(newlyShadowed => shadowedByTheChange.add(newlyShadowed))
          }
        }
        missings.forEach(missing => {
          if(notChangedThisRound.includes(missing)){
            shadowsTheChange.add(missing)
          }
        })
      })
    })
    return {
      shadowsTheChange:Array.from(shadowsTheChange).sort(), 
      unshadowedByTheChange: Array.from(unshadowedByTheChange).sort(),
      shadowedByTheChange: Array.from(shadowedByTheChange).sort()
    }
  }

  compute(submittedFactorAnswers?: FactorAnswers) {
    if(submittedFactorAnswers!==undefined){
      this.submittedFactorAnswers = submittedFactorAnswers;
      this.advancedOptionsStore.updateFactorAnswers(this.submittedFactorAnswers);

    }      
    if(this.advancedOptionsStore.changedSetting && this.advancedOptionsStore.submittable){
        this.advancedOptionsStore.submitOptions();
        this.reset();
    }
    this.computationStateStore.setComputationState(ComputationState.RUNNING);
    
    if (this.advancedOptionsStore.submittedThreading === Threading.SINGLE) {
      this.singeThreadComputeController?.compute(this.submittedFactorAnswers);
      const innerprobabilities = this.singeThreadComputeController?.computeInnerProbabilities(this.advancedOptionsStore.submittedEvaluationUnit);
      // const factorAnswerChange = this.singeThreadComputeController?.computeFactorAnswerChanges()
      console.log("computation summaries:")
      console.log(innerprobabilities);
      if (innerprobabilities !== undefined) {
        //will be undefined if data hasnt loaded yet.
        this.riskFactorContributions = innerprobabilities;
        this.pushChanges(innerprobabilities)
        this.computationStateStore.setComputationState(ComputationState.ARTIFICIALLY_SIGNALLING_FINISHED_COMPUTATIONS);
      }
      const conditionsRes = this.singeThreadComputeController?.computeConditions();
      if(conditionsRes !== undefined){
        this.conditionRes = conditionsRes;
      }
    } else {
      worker.processData(
        toJS(this.submittedFactorAnswers), toJS(this.advancedOptionsStore.submittedEvaluationUnit)
      ).then( action("INserting results", ({ innerCauses, conditionsRes}) => { 
        this.riskFactorContributions = innerCauses;
        this.conditionRes = conditionsRes
        this.pushChanges(innerCauses)
        this.computationStateStore.setComputationState(ComputationState.ARTIFICIALLY_SIGNALLING_FINISHED_COMPUTATIONS);
      }));
    }
  }

  reset() {
    if (this.advancedOptionsStore.submittedThreading === Threading.SINGLE) {
      this.singeThreadComputeController = new UpdateFormController(
        this.loadedDataStore.rdat,
        this.advancedOptionsStore.submittedAgeFrom,
        this.advancedOptionsStore.submittedAgeTo,
        this.loadedDataStore.deathCauses,
        this.loadedDataStore.deathCauseCategories,
        this.loadedDataStore.descriptions,
        this.advancedOptionsStore.submittedEvaluationUnit,
        this.loadedDataStore.conditions,
        this.loadedDataStore.optimizabilities
      );
    } else {
      worker.initializeObject(
        this.loadedDataStore.rawRelationLinks,
        this.loadedDataStore.rawDeathCauses,
        this.loadedDataStore.rawDeathCauseCategories,
        this.loadedDataStore.rawDescriptions,
        this.loadedDataStore.rawConditions,
        this.advancedOptionsStore.submittedAgeFrom,
        this.advancedOptionsStore.submittedAgeTo,
        this.advancedOptionsStore.submittedEvaluationUnit
      );
    }
  }

  pushChanges(computationResults: DeathCauseContributionsAndChanges){
    this.allChanges.unshift(computationResults.changes);
    this.lifeExpectancies.unshift(computationResults.baseLifeExpectancy);
  }

  attachLoadedData() {
    this.reset();
  }
}
