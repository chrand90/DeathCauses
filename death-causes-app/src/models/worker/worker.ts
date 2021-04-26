import { thresholdFreedmanDiaconis } from "d3-array";
import { SurvivalCurveData } from "../../components/Calculations/SurvivalCurveData";
import Deathcause, { RiskFactorGroupsContainer } from "../../components/database/Deathcause";
import { DataRow } from "../../components/PlottingData";
import { RawDataJson } from "../../components/VizWindow";
import { FactorAnswers } from "../Factors";
import RelationLinks, { RelationLinkJson } from "../RelationLinks";
import ComputeController from "../updateFormNodes/UpdateFormController";

class computations {
  computer: ComputeController | null;

  constructor() {
    this.computer = null;
  }

  initialize(json: RelationLinkJson, rawData: RawDataJson, rawCategoryData: RawDataJson, ageFrom: number | null, ageTo: number) {
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
    this.computer = new ComputeController(
      rlinks,
      ageFrom,
      ageTo,
      deathcauses,
      deathCauseCategories
    );
  }

  processData(data: FactorAnswers) {
    if(this.computer===null){
      return {survivalData: [], innerCauses: []};
    }
    else{
      return this.computer.computeAll(data);
    }
  }
}

let c = new computations();

export function processData(data: FactorAnswers):{survivalData: SurvivalCurveData[], innerCauses: DataRow[]} {
  return c.processData(data);
}

export function initializeObject(json: RelationLinkJson, rawData: RawDataJson, rawCategoryData: RawDataJson, ageFrom: number | null, ageTo: number) {
  c.initialize(json, rawData, rawCategoryData, ageFrom, ageTo);
}
