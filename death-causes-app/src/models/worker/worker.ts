import { SurvivalCurveData } from "../../components/Calculations/SurvivalCurveData";
import Deathcause, { Condition, ConditionJson, RawDeathCauseJson, RiskFactorGroupsContainer } from "../../components/database/Deathcause";
import { DataRow } from "../../components/PlottingData";
import Descriptions, { DescriptionsJson } from "../Descriptions";
import { FactorAnswers } from "../Factors";
import RelationLinks, { RelationLinkJson } from "../RelationLinks";
import { LifeExpectancyContributions } from "../updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy";
import { SummaryViewData } from "../updateFormNodes/FinalSummary/SummaryView";
import UpdateFormController from "../updateFormNodes/UpdateFormController";

class computations {
  computer: UpdateFormController | null;

  constructor() {
    this.computer = null;
  }

  initialize(json: RelationLinkJson, rawData: RawDeathCauseJson, rawCategoryData: RawDeathCauseJson, ageFrom: number | null, ageTo: number, rawDescriptions: DescriptionsJson, rawConditions: ConditionJson) {
    const rlinks = new RelationLinks(json);
    const deathcauses: Deathcause[]=[];
    Object.entries(rawData).forEach(([key, deathcause]) => {
      deathcauses.push(new Deathcause(deathcause, key));
    });
    const deathCauseCategories: RiskFactorGroupsContainer[]=[];
    Object.entries(rawCategoryData).forEach(([key, deathcause]) => {
      deathCauseCategories.push(
        new RiskFactorGroupsContainer(deathcause, key)
      );
    });
    const descriptions= new Descriptions(rawDescriptions);
    const conditions:{[k:string]:Condition}={};
    Object.entries(rawConditions).forEach(([conditionName, conditionObject]) => {
        conditions[conditionName]=new Condition(conditionObject, conditionName);
    })
    this.computer = new UpdateFormController(
      rlinks,
      ageFrom,
      ageTo,
      deathcauses,
      deathCauseCategories,
      descriptions,
      conditions
    );
  }

  processData(data: FactorAnswers) {
    if(this.computer===null){
      return {survivalData: [], innerCauses: [], summaryView: null};
    }
    else{
      return this.computer.computeAll(data);
    }
  }
}

let c = new computations();

export function processData(data: FactorAnswers):{survivalData: SurvivalCurveData[], innerCauses: DataRow[] | LifeExpectancyContributions, summaryView: SummaryViewData | null} {
  return c.processData(data);
}

export function initializeObject(json: RelationLinkJson, rawData: RawDeathCauseJson, rawCategoryData: RawDeathCauseJson, rawDescriptions: DescriptionsJson, rawConditions: ConditionJson, ageFrom: number | null, ageTo: number) {
  c.initialize(json, rawData, rawCategoryData, ageFrom, ageTo, rawDescriptions, rawConditions);
}
