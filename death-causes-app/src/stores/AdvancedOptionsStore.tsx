import { action, computed, makeObservable, observable } from "mobx";
import { InputValidity } from "../models/FactorAbstract";
import { FactorAnswers } from "../models/Factors";
import ComputationStateStore from "./ComputationStateStore";

export enum Threading {
  MULTI = "multi",
  SINGLE = "single",
}
const INPUT_NOT_WHOLE = "Input should be a whole number";

const DEFAULT_AGE_TO = "120";
const DEFAULT_THREADING = Threading.MULTI;

export interface ValidityDic {
  [key: string]: InputValidity;
}

export enum EVALUATION_UNIT {
  PROBAIBILITY = "Probability",
  YEARS_LOST = "Years lost"
}

export default class AdvancedOptionsStore {
  ageFromSet: boolean;
  ageFrom: string;
  ageTo: string;
  threading: Threading;
  submittedAgeFrom: number;
  submittedAgeTo: number;
  submittedThreading: Threading;
  submittedAgeFromSet: boolean;
  computationStateStore: ComputationStateStore;
  baseAgeFrom: null | string;
  evaluationUnit: EVALUATION_UNIT;

  constructor(computationStateStore: ComputationStateStore) {
    this.ageFrom = "0";
    this.ageFromSet = false;
    this.ageTo = DEFAULT_AGE_TO;
    this.threading = DEFAULT_THREADING;
    this.baseAgeFrom = null;
    this.submittedAgeFrom = 0;
    this.submittedAgeTo = parseInt(DEFAULT_AGE_TO);
    this.submittedThreading = this.threading;
    this.submittedAgeFromSet = true;
    this.computationStateStore = computationStateStore;
    this.evaluationUnit =  EVALUATION_UNIT.PROBAIBILITY
    makeObservable(this, {
      ageFrom: observable,
      ageFromSet: observable,
      ageTo: observable,
      baseAgeFrom: observable,
      threading: observable,
      submittedAgeFrom: observable,
      submittedAgeTo: observable,
      submittedAgeFromSet: observable,
      submittedThreading: observable,
      evaluationUnit: observable,
      changedSetting: computed,
      validities: computed,
      submittable: computed,
      setAgeFrom: action,
      setAgeTo: action,
      setThreading: action,
      setDefault: action.bound,
      submitOptions: action,
      updateFactorAnswers: action.bound,
    });
  }

  get validities(): ValidityDic {
    let ageFromValidity = this.makeInputValidity(this.ageFrom);
    let ageToValidity = this.makeInputValidity(this.ageTo);
    console.log("computing validities");
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
      this.ageFromSet !== this.submittedAgeFromSet
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
  }

  submitOptions() {
    this.submittedAgeFrom = parseInt(this.ageFrom);
    this.submittedAgeTo = parseInt(this.ageTo);
    this.submittedThreading = this.threading;
    this.submittedAgeFromSet = this.ageFromSet;
  }

  optionsEqualToDefault() {
    return (
      this.ageFrom === this.baseAgeFrom &&
      this.ageTo === DEFAULT_AGE_TO &&
      this.threading === DEFAULT_THREADING &&
      this.ageFromSet === false
    );
  }
}

function wholeNumberValidity(input: string) {
  const numberRegex = new RegExp("^[0-9]+$");
  return numberRegex.test(input);
}
