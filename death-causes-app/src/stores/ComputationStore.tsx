import { action, makeObservable, observable, toJS } from "mobx";
import { SurvivalCurveData } from "../components/Calculations/SurvivalCurveData";
import { DataRow } from "../components/PlottingData";
import { FactorAnswers } from "../models/Factors";
import { SummaryViewData } from "../models/updateFormNodes/FinalSummary/SummaryView";
import UpdateFormController from "../models/updateFormNodes/UpdateFormController";
import Worker from "../models/worker";
import AdvancedOptionsStore, { Threading } from "./AdvancedOptionsStore";
import ComputationStateStore, {
  ComputationState
} from "./ComputationStateStore";
import LoadedDataStore from "./LoadedDataStore";

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
    makeObservable(this, {
      submittedFactorAnswers: observable,
      attachLoadedData: action.bound,
    });
    this.loadedDataStore = loadedDataStore;
    this.advancedOptionsStore = advancedOptionsStore;
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
    
    console.log("ageFrom");
    console.log(this.advancedOptionsStore.submittedAgeFrom);
    console.log("ageTo");
    console.log(this.advancedOptionsStore.submittedAgeTo);
    console.log(this.submittedFactorAnswers);
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
      this.computationStateStore.setComputationState(ComputationState.ARTIFICIALLY_SIGNALLING_FINISHED_COMPUTATIONS);
    } else {
      worker.processData(
        toJS(this.submittedFactorAnswers)
      ).then( action("INserting results", ({ survivalData, innerCauses, summaryView}) => {
        this.survivalCurveData = survivalData;
        this.riskFactorContributions = innerCauses;
        this.summaryView = summaryView
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

  attachLoadedData() {
    this.reset();
  }
}
