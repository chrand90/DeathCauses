import { thresholdFreedmanDiaconis } from "d3-array";
import { SurvivalCurveData } from "../../components/Calculations/SurvivalCurveData";
import Deathcause, { RiskFactorGroupsContainer } from "../../components/database/Deathcause";
import { DataRow } from "../../components/PlottingData";
import { RawDeathCauseJson } from "../../components/database/Deathcause";
import { FactorAnswers } from "../Factors";
import RelationLinks, { RelationLinkJson } from "../RelationLinks";
import UpdateFormController from "../updateFormNodes/UpdateFormController";
import { SummaryViewData } from "../updateFormNodes/FinalSummary/SummaryView";

class computations {
  computer: UpdateFormController | null;

  constructor() {
    this.computer = null;
  }

  initialize(json: RelationLinkJson, rawData: RawDeathCauseJson, rawCategoryData: RawDeathCauseJson, ageFrom: number | null, ageTo: number) {
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
    this.computer = new UpdateFormController(
      rlinks,
      ageFrom,
      ageTo,
      deathcauses,
      deathCauseCategories
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

export function processData(data: FactorAnswers):{survivalData: SurvivalCurveData[], innerCauses: DataRow[], summaryView: SummaryViewData | null} {
  return c.processData(data);
}

export function initializeObject(json: RelationLinkJson, rawData: RawDeathCauseJson, rawCategoryData: RawDeathCauseJson, ageFrom: number | null, ageTo: number) {
  c.initialize(json, rawData, rawCategoryData, ageFrom, ageTo);
}
