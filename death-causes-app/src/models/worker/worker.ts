import Deathcause, { Condition, ConditionJson, RawDeathCauseJson, RiskFactorGroupsContainer } from "../../components/database/Deathcause";
import { EVALUATION_UNIT } from "../../stores/AdvancedOptionsStore";
import Descriptions, { DescriptionsJson } from "../Descriptions";
import { FactorAnswers } from "../Factors";
import Optimizabilities from "../Optimizabilities";
import RelationLinks, { RelationLinkJson } from "../RelationLinks";
import { FactorAnswerChanges } from "../updateFormNodes/FactorAnswersToUpdateForm";
import { ConditionsRes } from "../updateFormNodes/FinalSummary/ConditionSummary";
import { DeathCauseContributions } from "../updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy";
import UpdateFormController from "../updateFormNodes/UpdateFormController";

class computations {
  computer: UpdateFormController | null;

  constructor() {
    this.computer = null;
  }

  initialize(json: RelationLinkJson, rawData: RawDeathCauseJson, rawCategoryData: RawDeathCauseJson, ageFrom: number | null, ageTo: number, rawDescriptions: DescriptionsJson, rawConditions: ConditionJson, evaluationUnit: EVALUATION_UNIT) {
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
    const optimizabilities= new Optimizabilities(rawDescriptions)
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
      evaluationUnit,
      conditions, 
      optimizabilities
    );
  }

  processData(data: FactorAnswers, evaluationUnit: EVALUATION_UNIT) {
    if(this.computer===null){
      return {innerCauses: {evaluationUnit: EVALUATION_UNIT.PROBABILITY, survivalProbs: [],ages : [], costPerCause: {}, baseLifeExpectancy: 0 }, changes: {}, conditionsRes:{averageProportion: {}, probOfHavingWhileDying: {}}};
    }
    else{
      return this.computer.computeAll(data, evaluationUnit);
    }
  }
}

let c = new computations();

export function processData(data: FactorAnswers, evaluationUnit: EVALUATION_UNIT): {innerCauses: DeathCauseContributions, changes: FactorAnswerChanges, conditionsRes: ConditionsRes} {
  return c.processData(data, evaluationUnit);
}

export function initializeObject(json: RelationLinkJson, rawData: RawDeathCauseJson, rawCategoryData: RawDeathCauseJson, rawDescriptions: DescriptionsJson, rawConditions: ConditionJson, ageFrom: number | null, ageTo: number, evaluationUnit: EVALUATION_UNIT) {
  c.initialize(json, rawData, rawCategoryData, ageFrom, ageTo, rawDescriptions, rawConditions, evaluationUnit);
}
