import DeathCause, { RawDeathCauseJson, RiskFactorGroupsContainer } from "../components/database/Deathcause";
import InputJson from "../models/FactorJsonInput";
import Factors from "../models/Factors";
import RelationLinks, { RelationLinkJson } from "../models/RelationLinks";
import { loadCauseData, LoadedCauseData, LoadedFactors, LoadedRelationLinks, loadFactors, loadRelationLinks } from "./DataLoading";

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
  }

  loadQuestionMenuContent(){
      return new Promise(resolve => {
        loadFactors().then((loadedFactors: LoadedFactors) => {
            this.factors=loadedFactors.factors
            this.rawFactorInput=loadedFactors.rawFactorInput;
            this.factorOrder=loadedFactors.factors.getSortedOrder();
            return
          }).then(() => {
              return loadRelationLinks()
          })
          .then((loadedRelationLinks: LoadedRelationLinks) => {
            this.rdat=loadedRelationLinks.rdat;
            this.rawRelationLinks=loadedRelationLinks.rawRelationLinks;
            resolve(true);
          })
      })
  }

  loadDeathCauses(){
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
