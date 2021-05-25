import { makeObservable, observable, computed, action, toJS, flow } from "mobx";
import { FactorAnswers } from "../models/Factors";
import LoadedDataStore from "./LoadedDataStore";
import Worker from "../models/worker";
import { DataRow } from "../components/PlottingData";
import { SurvivalCurveData } from "../components/Calculations/SurvivalCurveData";
import AdvancedOptionsStore from "./AdvancedOptionsStore";
import ComputeController from "../models/updateFormNodes/UpdateFormController";
import { Threading } from "./AdvancedOptionsStore";
import ComputationStateStore, {
  ComputationState,
} from "./ComputationStateStore";
import { UpdateDic } from "../models/updateFormNodes/UpdateForm";

const worker = new Worker();

export default class ComputationStore {
  submittedFactorAnswers: FactorAnswers;
  loadedDataStore: LoadedDataStore;
  advancedOptionsStore: AdvancedOptionsStore;
  riskFactorContributions: DataRow[];
  survivalCurveData: SurvivalCurveData[];
  singeThreadComputeController: ComputeController | null;
  computationStateStore: ComputationStateStore;

  constructor(
    loadedDataStore: LoadedDataStore,
    advancedOptionsStore: AdvancedOptionsStore,
    computationStateStore: ComputationStateStore
  ) {
    this.computationStateStore = computationStateStore;
    this.submittedFactorAnswers = {};
    this.riskFactorContributions = [];
    this.survivalCurveData = [];
    this.singeThreadComputeController = null;
    makeObservable(this, {
      submittedFactorAnswers: observable,
      attachLoadedData: action.bound,
    });
    this.loadedDataStore = loadedDataStore;
    this.advancedOptionsStore = advancedOptionsStore;
  }

  compute(submittedFactorAnswers: FactorAnswers) {
    this.submittedFactorAnswers = submittedFactorAnswers;
    this.advancedOptionsStore.updateFactorAnswers(this.submittedFactorAnswers);
    this.computationStateStore.setComputationState(ComputationState.RUNNING);
    if (this.advancedOptionsStore.changedSetting) {
      this.reset();
      this.advancedOptionsStore.changesHasBeenReported();
    }
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
      ).then( action("INserting results", ({ survivalData, innerCauses}) => {
        this.survivalCurveData = survivalData;
        this.riskFactorContributions = innerCauses;
        this.computationStateStore.setComputationState(ComputationState.ARTIFICIALLY_SIGNALLING_FINISHED_COMPUTATIONS);
      }));
    }
  }

  reset() {
    if (this.advancedOptionsStore.submittedThreading === Threading.SINGLE) {
      this.singeThreadComputeController = new ComputeController(
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
