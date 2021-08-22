import { action, makeObservable, observable } from "mobx";
import DeathCause, { Condition, ConditionJson, RawDeathCauseJson, RiskFactorGroupsContainer } from "../components/database/Deathcause";
import Descriptions, { DescriptionsJson } from "../models/Descriptions";
import InputJson from "../models/FactorJsonInput";
import Factors from "../models/Factors";
import RelationLinks, { RelationLinkJson } from "../models/RelationLinks";
import ComputationStore from "./ComputationStore";
import { loadCauseData, loadDescriptions, LoadedCauseData, LoadedDescriptions, LoadedFactors, LoadedRelationLinks, loadFactors, loadRelationLinks, loadConditions, LoadedConditions, loadLifeExpectancies } from "./DataLoading";
import FactorInputStore from "./FactorInputStore";
import QuestionProgressStore from "./QuestionProgressStore";

export default class LoadedDataStore {
  factors: Factors;
  rawFactorInput: InputJson;
  factorOrder: string[];
  rawRelationLinks: RelationLinkJson;
  rdat: RelationLinks;
  rawDeathCauses: RawDeathCauseJson;
  deathCauses: DeathCause[];
  rawDeathCauseCategories: RawDeathCauseJson;
  deathCauseCategories: RiskFactorGroupsContainer[];
  rawDescriptions:DescriptionsJson;
  descriptions:Descriptions;
  loadedQuestionMenuData: boolean;
  loadedVizWindowData: boolean;
  loadedLifeExpectancies: boolean;
  lifeExpectancies: number[];
  conditions: {[conditionName:string]: Condition};
  rawConditions: ConditionJson;

  constructor() {
    this.factors= new Factors([] as InputJson);
    this.rawFactorInput=[];
    this.factorOrder=[];
    this.rawRelationLinks={};
    this.rdat=new RelationLinks({} as RelationLinkJson);
    this.rawDeathCauses= {} as RawDeathCauseJson;
    this.rawDeathCauseCategories = {} as RawDeathCauseJson;
    this.deathCauses= [];
    this.deathCauseCategories=[];
    this.descriptions=new Descriptions({} as DescriptionsJson);
    this.rawDescriptions={} as DescriptionsJson
    this.conditions={} as {[conditionName:string]: Condition};
    this.rawConditions={} as ConditionJson
    this.lifeExpectancies=[];
    this.loadedQuestionMenuData=false;
    this.loadedVizWindowData=false;
    this.loadedLifeExpectancies=false;
    makeObservable(this, {
      loadedVizWindowData: observable,
      loadedQuestionMenuData: observable,
      loadedLifeExpectancies: observable,
      loadAllData: action.bound,
    });
  }

  loadAllData(factorInputStore: FactorInputStore, computationStore: ComputationStore, questionProgressStore: QuestionProgressStore) {
    const promiseOfFactors=this.makePromiseOfFactors();
    const promiseOfDescriptions= this.makePromiseOfDescriptions();
    const promiseOfRelationLinks= this.makePromiseOfRelationsLinks();
    const promiseOfDatabase = this.makePromiseOfDataBase();
    const promiseOfConditions=this.makePromiseOfConditions();
    const artificialWaiting= new Promise<number>( (res) => {
      setTimeout(()=>{ res(9)},5000)
    })
    Promise.all([promiseOfFactors, promiseOfDescriptions]).then(() => {
      factorInputStore.attachLoadedData();
      questionProgressStore.attachLoadedData();
      this.loadedQuestionMenuData = true;
      return
    })
    Promise.all([promiseOfRelationLinks, promiseOfDatabase, promiseOfDescriptions, promiseOfConditions]).then(() => {
      computationStore.attachLoadedData();
      this.loadedVizWindowData=true;
      return
    })
    this.makePromiseOfLifeExpectancies().then(() => {
      this.loadedLifeExpectancies=true;
      return
    })
  }

  makePromiseOfLifeExpectancies(){
    return new Promise(resolve => {
      loadLifeExpectancies().then((lifeExpectancies: number[]) => {
          this.lifeExpectancies=lifeExpectancies;
          resolve(true);
        })
      })
  }

  makePromiseOfFactors(){
    return new Promise(resolve => {
      loadFactors().then((loadedFactors: LoadedFactors) => {
          this.factors=loadedFactors.factors
          this.rawFactorInput=loadedFactors.rawFactorInput;
          this.factorOrder=loadedFactors.factors.getSortedOrder();
          resolve(true);
        })
      })
  }

  makePromiseOfRelationsLinks(){
    return new Promise(resolve => {
      loadRelationLinks().then((loadedRelationLinks: LoadedRelationLinks) => {
        this.rdat=loadedRelationLinks.rdat;
        this.rawRelationLinks=loadedRelationLinks.rawRelationLinks;
        resolve(true);
      })
    })
  }
  
  makePromiseOfDescriptions(){
    return new Promise(resolve => {
      loadDescriptions().then((loadedDescriptions: LoadedDescriptions ) => {
        this.descriptions=loadedDescriptions.descriptions;
        this.rawDescriptions=loadedDescriptions.rawDescriptions;
        resolve(true);
      })
    })
  }

  makePromiseOfConditions(){
    return new Promise(resolve => {
      loadConditions().then((loadedConditions: LoadedConditions ) => {
        this.conditions=loadedConditions.conditions;
        this.rawConditions=loadedConditions.rawConditions;
        resolve(true);
      })
    })
  }

  makePromiseOfDataBase(){
    return new Promise(resolve => {
      loadCauseData().then((loadedData: LoadedCauseData) => {
          this.rawDeathCauseCategories=loadedData.rawCategoryData
          this.rawDeathCauses=loadedData.rawCauseData
          this.deathCauses=loadedData.deathcauses
          this.deathCauseCategories=loadedData.deathcauseCategories
          resolve(true);
        })
    })
  }

}
