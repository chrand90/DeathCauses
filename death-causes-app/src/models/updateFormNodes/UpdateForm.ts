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
  SIMPLE_UPDATE_FORM="Simple update form"
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

export interface UpdateFormSimple {
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
    | ProbabilityObject[];
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
    | RiskFactorGroupResult
    | CauseNodeResult
    | {[factor: string]:UpdateFormSimple}
}

export interface UpdateDic {
  [factorname: string]: UpdateForm;
}
