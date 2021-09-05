import { action, computed, makeObservable, observable } from "mobx";
import { InputValidity } from "../models/FactorAbstract";
import { FactorAnswers } from "../models/Factors";
import ComputationStateStore from "./ComputationStateStore";

export enum Threading {
  MULTI = "multi",
  SINGLE = "single",
}
const INPUT_NOT_WHOLE = "Input should be a whole number";


export interface ValidityDic {
  [key: string]: InputValidity;
}

export enum EVALUATION_UNIT {
  PROBABILITY = "Probability",
  YEARS_LOST = "Years lost"
}

const DEFAULT_VALUES = {
  AGE_TO: "120",
  THREADING: Threading.MULTI,
  EVALUATION_UNIT: EVALUATION_UNIT.PROBABILITY
}

//todo: Why do we have ageFrom, ageTo etc that is used for rendering the advanced options menu in a store? 
export default class AdvancedOptionsStore {
  ageFromSet: boolean;
  ageFrom: string;
  ageTo: string;
  threading: Threading;
  evaluationUnit: EVALUATION_UNIT;
  submittedAgeFrom: number;
  submittedAgeTo: number;
  submittedThreading: Threading;
  submittedAgeFromSet: boolean;
  submittedEvaluationUnit: EVALUATION_UNIT;
  computationStateStore: ComputationStateStore;
  baseAgeFrom: null | string;

  constructor(computationStateStore: ComputationStateStore) {
    this.ageFrom = "0";
    this.ageFromSet = false;
    this.ageTo = DEFAULT_VALUES.AGE_TO;
    this.threading = DEFAULT_VALUES.THREADING;
    this.baseAgeFrom = null;
    this.evaluationUnit = EVALUATION_UNIT.PROBABILITY
    this.submittedEvaluationUnit = EVALUATION_UNIT.PROBABILITY
    this.submittedAgeFrom = 0;
    this.submittedAgeTo = parseInt(DEFAULT_VALUES.AGE_TO);
    this.submittedThreading = this.threading;
    this.submittedAgeFromSet = false;
    this.computationStateStore = computationStateStore;
    makeObservable(this, {
      ageFrom: observable,
      ageFromSet: observable,
      ageTo: observable,
      baseAgeFrom: observable,
      threading: observable,
      evaluationUnit: observable,
      submittedAgeFrom: observable,
      submittedAgeTo: observable,
      submittedAgeFromSet: observable,
      submittedThreading: observable,
      submittedEvaluationUnit: observable,
      changedSetting: computed,
      validities: computed,
      submittable: computed,
      setAgeFrom: action,
      setAgeTo: action,
      setThreading: action,
      setDefault: action.bound,
      setEvaluationUnit: action,
      submitOptions: action,
      updateFactorAnswers: action.bound,
    });
  }

  get validities(): ValidityDic {
    let ageFromValidity = this.makeInputValidity(this.ageFrom);
    let ageToValidity = this.makeInputValidity(this.ageTo);
    if (
      ageFromValidity.status === "Success" &&
      ageToValidity.status === "Success" &&
      parseInt(this.ageFrom) > parseInt(this.ageTo)
    ) {
      return {
        ageFrom: {
          status: "Error",
          message: "Start age must not be higher than End age",
        },
        ageTo: {
          status: "Error",
          message: "Start age must not be higher than End age",
        },
      };
    } else {
      return { ageFrom: ageFromValidity, ageTo: ageToValidity };
    }
  }

  get submittable() {
    return Object.values(this.validities).every((d) => d.status === "Success");
  }

  get changedSetting() {
    return (
      this.ageFrom !== this.submittedAgeFrom.toString() ||
      this.ageTo !== this.submittedAgeTo.toString() ||
      this.threading !== this.submittedThreading ||
      this.ageFromSet !== this.submittedAgeFromSet || 
      this.evaluationUnit !== this.submittedEvaluationUnit
    );
  }

  makeInputValidity(value: string): InputValidity {
    if (wholeNumberValidity(value)) {
      return { status: "Success", message: "" };
    } else {
      return { status: "Error", message: INPUT_NOT_WHOLE };
    }
  }

  updateFactorAnswers(factorAnswers: FactorAnswers) {
    this.baseAgeFrom = this.deriveAgeFrom(factorAnswers);
    if (!this.ageFromSet) {
      this.ageFrom = this.baseAgeFrom;
    }
  }

  deriveAgeFrom(factorAnswers: FactorAnswers) {
    if ("Age" in factorAnswers) {
      if (factorAnswers["Age"] !== "") {
        let val= factorAnswers["Age"];
        if(typeof val==="number"){
          return Math.floor(val).toString();
        }
        else{
          return Math.floor(parseFloat(val)).toString();
        }
      }
    }
    return "0";
  }

  setAgeFromSet(oppositeChecked: boolean) {
    if (!oppositeChecked) {
      this.ageFrom = this.baseAgeFrom ? this.baseAgeFrom : "0";
      this.ageFromSet = false;
    } else {
      //this.ageFrom = this.baseAgeFrom ? this.baseAgeFrom : "0";
      this.ageFromSet = true;
    }
  }

  setEvaluationUnit(unit: EVALUATION_UNIT) {
    this.evaluationUnit = unit;
  }

  setAgeFrom(ageFrom: string) {
    this.ageFrom = ageFrom;
  }

  setAgeTo(ageTo: string) {
    this.ageTo = ageTo;
  }

  setThreading(threading: Threading) {
    this.threading = threading;
  }

  setDefault() {
    this.ageFrom = this.baseAgeFrom ? this.baseAgeFrom : "0";
    this.ageFromSet = false;
    this.ageTo = "120";
    this.threading = Threading.MULTI;
    this.evaluationUnit = DEFAULT_VALUES.EVALUATION_UNIT
  }

  submitOptions() {
    this.submittedAgeFrom = parseInt(this.ageFrom);
    this.submittedAgeTo = parseInt(this.ageTo);
    this.submittedThreading = this.threading;
    this.submittedAgeFromSet = this.ageFromSet;
    this.submittedEvaluationUnit = this.evaluationUnit;
  }

  optionsEqualToDefault() {
    return (
      this.ageTo === DEFAULT_VALUES.AGE_TO &&
      this.threading === DEFAULT_VALUES.THREADING &&
      this.ageFromSet === false &&
      this.evaluationUnit === DEFAULT_VALUES.EVALUATION_UNIT 
    );
  }
}

function wholeNumberValidity(input: string) {
  const numberRegex = new RegExp("^[0-9]+$");
  return numberRegex.test(input);
}
