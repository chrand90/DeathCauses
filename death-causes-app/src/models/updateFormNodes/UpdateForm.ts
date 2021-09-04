import { BestValues } from "../../components/Calculations/ConsensusBestValue";
import { KnowledgeableOptimizabilities } from "../Optimizabilities";
import CauseNodeResult from "./CauseNodeResult";
import RiskFactorGroupResult from "./RiskFactorGroupResult";

export enum ChangeStatus {
  CHANGED = "Changed",
  UNCHANGED = "Unchanged",
}

export enum TypeStatus {
  NUMERIC = "Numeric",
  STRING = "string",
  RISKFACTORGROUPRESULT="Riskfactorgroupresult",
  CAUSERESULT="Causenode result",
  CONDITIONRESULT="Condition node result",
  OPTIMIZABILITIES="Knowledgeable optimizabilities"
}

export enum MissingStatus {
  MISSING = "Missing",
  NONMISSING = "Non-missing",
}

export enum DimensionStatus {
  YEARLY = "Yearly",
  SINGLE = "Single",
}

export enum StochasticStatus {
  DETERMINISTIC = "Deterministic",
  RANDOM = "Random",
}

export interface ProbabilityObject {
  [factorlevel: string]: number;
}

export interface ConditionNodeResult {
  probs: ProbabilityObject | ProbabilityObject[],
  perYearInnerCauses: {[cause:string]:number}[] | {[cause:string]:number},
  name: string,
  bestValues: BestValues | undefined
}


export interface UpdateForm {
  change: ChangeStatus;
  type: TypeStatus;
  missing: MissingStatus;
  dimension: DimensionStatus;
  random: StochasticStatus;
  value:
    | ""
    | string
    | number
    | string[]
    | number[]
    | ProbabilityObject
    | ProbabilityObject[]
    | ConditionNodeResult
    | RiskFactorGroupResult
    | CauseNodeResult
    | KnowledgeableOptimizabilities

}

export interface UpdateDic {
  [factorname: string]: UpdateForm;
}
