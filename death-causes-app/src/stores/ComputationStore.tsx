import { action, makeObservable, computed, observable, toJS } from "mobx";
import { SurvivalCurveData } from "../components/Calculations/SurvivalCurveData";
import { DataRow } from "../components/PlottingData";
import { FactorAnswers } from "../models/Factors";
import { FactorAnswerChanges, UNKNOWNLABEL } from "../models/updateFormNodes/FactorAnswersToUpdateForm";
import { SummaryViewData } from "../models/updateFormNodes/FinalSummary/SummaryView";
import UpdateFormController from "../models/updateFormNodes/UpdateFormController";
import Worker from "../models/worker";
import AdvancedOptionsStore, { Threading } from "./AdvancedOptionsStore";
import ComputationStateStore, {
  ComputationState
} from "./ComputationStateStore";
import LoadedDataStore from "./LoadedDataStore";

export interface Shadowing {
  shadowsTheChange: string[];
  unshadowedByTheChange: string[];
}

const worker = new Worker();

export default class ComputationStore {
  submittedFactorAnswers: FactorAnswers;
  loadedDataStore: LoadedDataStore;
  advancedOptionsStore: AdvancedOptionsStore;
  riskFactorContributions: DataRow[];
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
    this.riskFactorContributions = [];
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
    Object.entries(this.allChanges[0]).forEach(([factorName, {fromVal, toVal}]) => {
      const siblingGroups= this.loadedDataStore.rdat.getDependentFactors(factorName)
      siblingGroups.forEach(siblingGroup => {
        let missings=siblingGroup.filter(siblingName => {
          return this.submittedFactorAnswers[siblingName]==="";
        })
        if(missings.length===0){
          let previouslyShadowed=siblingGroup.filter(siblingName => {
            return !(siblingName in this.allChanges[0])
          })
          if(fromVal===UNKNOWNLABEL){
            previouslyShadowed.forEach(sibling => unshadowedByTheChange.add(sibling));
          }
        }
        if(toVal!==UNKNOWNLABEL){
          missings.forEach(missing => shadowsTheChange.add(missing))
        }
      })
    })
    return {
      shadowsTheChange:Array.from(shadowsTheChange).sort(), 
      unshadowedByTheChange: Array.from(unshadowedByTheChange).sort()};
  }

  compute(submittedFactorAnswers?: FactorAnswers) {
    if(submittedFactorAnswers!==undefined){
      this.submittedFactorAnswers = submittedFactorAnswers;
      this.advancedOptionsStore.updateFactorAnswers(this.submittedFactorAnswers);
      if(this.advancedOptionsStore.changedSetting && this.advancedOptionsStore.submittable){
        this.advancedOptionsStore.submitOptions();
        this.reset();
      }
    }
    this.computationStateStore.setComputationState(ComputationState.RUNNING);
    
    if (this.advancedOptionsStore.threading === Threading.SINGLE) {
      this.singeThreadComputeController?.compute(this.submittedFactorAnswers);
      const innerprobabilities = this.singeThreadComputeController?.computeInnerProbabilities();
      console.log(innerprobabilities);
      if (innerprobabilities !== undefined) {
        //will be undefined if data hasnt loaded yet.
        this.riskFactorContributions = innerprobabilities;
      }
      const survivalCurveData = this.singeThreadComputeController?.computeSurvivalData();
      if (survivalCurveData !== undefined) {
        this.survivalCurveData = survivalCurveData;
      }
      const summaryViewData = this.singeThreadComputeController?.computeSummaryViewData();
      if (summaryViewData !== undefined) {
        this.summaryView = summaryViewData;
      }
      this.computationStateStore.setComputationState(ComputationState.ARTIFICIALLY_SIGNALLING_FINISHED_COMPUTATIONS);
    } else {
      worker.processData(
        toJS(this.submittedFactorAnswers)
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
        this.loadedDataStore.deathCauseCategories
      );
    } else {
      worker.initializeObject(
        this.loadedDataStore.rawRelationLinks,
        this.loadedDataStore.rawDeathCauses,
        this.loadedDataStore.rawDeathCauseCategories,
        this.advancedOptionsStore.submittedAgeFrom,
        this.advancedOptionsStore.submittedAgeTo
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
