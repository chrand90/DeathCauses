import { action, makeObservable, computed, observable, toJS } from "mobx";
import { SurvivalCurveData } from "../components/Calculations/SurvivalCurveData";
import { DataRow } from "../components/PlottingData";
import { FactorAnswers } from "../models/Factors";
import { FactorAnswerChanges, UNKNOWNLABEL } from "../models/updateFormNodes/FactorAnswersToUpdateForm";
import { LifeExpectancyContributions } from "../models/updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy";
import { SummaryViewData } from "../models/updateFormNodes/FinalSummary/SummaryView";
import UpdateFormController, { WrappedLifeExpectancyContributions } from "../models/updateFormNodes/UpdateFormController";
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
  riskFactorContributions: WrappedLifeExpectancyContributions;
  survivalCurveData: SurvivalCurveData[];
  singeThreadComputeController: UpdateFormController | null;
  computationStateStore: ComputationStateStore;
  summaryView: SummaryViewData | null;
  allChanges: FactorAnswerChanges[];
  lifeExpectancies: number[];

  constructor(
    loadedDataStore: LoadedDataStore,
    advancedOptionsStore: AdvancedOptionsStore,
    computationStateStore: ComputationStateStore
  ) {
    this.computationStateStore = computationStateStore;
    this.submittedFactorAnswers = {};
    this.riskFactorContributions = {evaluationUnit: EVALUATION_UNIT.PROBAIBILITY, data: {}};
    this.survivalCurveData = [];
    this.summaryView = null;
    this.singeThreadComputeController = null;
    this.allChanges=[]
    this.lifeExpectancies=[70]
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
      console.log(innerprobabilities);
      if (innerprobabilities !== undefined) {
        //will be undefined if data hasnt loaded yet.
        this.riskFactorContributions = innerprobabilities;
      }
      const survivalCurveData = this.singeThreadComputeController?.computeSurvivalData();
      if (survivalCurveData !== undefined) {
        this.survivalCurveData = survivalCurveData;
      }
      const summaryViewData = this.singeThreadComputeController?.computeSummaryViewData(this.advancedOptionsStore.submittedEvaluationUnit);
      if (summaryViewData !== undefined) {
        this.summaryView = summaryViewData;
      }
      this.computationStateStore.setComputationState(ComputationState.ARTIFICIALLY_SIGNALLING_FINISHED_COMPUTATIONS);
    } else {
      worker.processData(
        toJS(this.submittedFactorAnswers), toJS(this.advancedOptionsStore.submittedEvaluationUnit)
      ).then( action("INserting results", ({ survivalData, innerCauses, summaryView}) => { 
        this.survivalCurveData = survivalData;
        this.riskFactorContributions = innerCauses;
        this.summaryView = summaryView
        this.pushChanges(summaryView.changes, summaryView.lifeExpentancyData.lifeExpentancy)
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
        this.loadedDataStore.conditions,
        this.advancedOptionsStore.submittedEvaluationUnit
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

  pushChanges(newChanges: FactorAnswerChanges, newLifeExpectancy: number){
    this.allChanges.unshift(newChanges);
    this.lifeExpectancies.unshift(newLifeExpectancy);
  }

  attachLoadedData() {
    this.reset();
  }
}
