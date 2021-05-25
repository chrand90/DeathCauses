import { makeObservable, observable, computed, action } from "mobx";
import { FactorAnswers } from "../models/Factors";
import ComputationStateStore, {
  ComputationState,
} from "./ComputationStateStore";
import { InputValidity } from "../models/FactorAbstract";
import { ERROR_COLOR } from "../components/Question";

export enum Threading {
  MULTI = "multi",
  SINGLE = "single",
}
const INPUT_NOT_WHOLE = "Input should be a whole number";

const DEFAULT_AGE_TO="120"
const DEFAULT_THREADING=Threading.MULTI;

export interface ValidityDic {
  [key: string]: InputValidity;
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
  changedSetting: boolean;
  computationStateStore: ComputationStateStore;
  baseAgeFrom: null | string;

  constructor(computationStateStore: ComputationStateStore) {
    this.ageFrom = "0";
    this.ageFromSet = false;
    this.ageTo = DEFAULT_AGE_TO;
    this.threading = DEFAULT_THREADING;
    this.baseAgeFrom = null
    this.submittedAgeFrom = 0;
    this.submittedAgeTo = 120;
    this.submittedThreading = this.threading;
    this.submittedAgeFromSet= true;
    this.changedSetting = false;
    this.computationStateStore = computationStateStore;
    makeObservable(this, {
      ageFrom: observable,
      ageFromSet: observable,
      ageTo: observable,
      baseAgeFrom: observable,
      threading: observable,
      submittedAgeFrom: observable,
      submittedAgeFromSet: observable,
      submittedAgeTo: observable,
      submittedThreading: observable,
      validities: computed,
      submittable: computed,
      setAgeFrom: action,
      setAgeTo: action,
      setThreading: action,
      setDefault: action,
      updateFactorAnswers: action,
      submitOptions: action,
    });
  }

  get validities(): ValidityDic {
    let ageFromValidity = this.makeInputValidity(this.ageFrom);
    let ageToValidity = this.makeInputValidity(this.ageTo);
    console.log("computing validities")
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

  get submittable(){
      return Object.values(this.validities).every(d=> d.status==="Success")
  }

  makeInputValidity(value: string): InputValidity {
    if (wholeNumberValidity(value)) {
      return { status: "Success", message: "" };
    } else {
      return { status: "Error", message: INPUT_NOT_WHOLE };
    }
  }

  updateFactorAnswers(factorAnswers: FactorAnswers) {
    this.baseAgeFrom=this.deriveAgeFrom(factorAnswers);
    if (!this.ageFromSet) {
      this.ageFrom = this.baseAgeFrom;
      if(parseInt(this.ageFrom)!==this.submittedAgeFrom){
        this.changedSetting=true;
      }
      this.submittedAgeFrom = parseInt(this.ageFrom);
    }
  }

  deriveAgeFrom(factorAnswers: FactorAnswers) {
    if ("Age" in factorAnswers) {
      if (factorAnswers["Age"] !== "") {
        return factorAnswers["Age"] as string;
      }
    }
    return "0";
  }

  setAgeFromSet(checked: boolean){
      if(checked){
        this.ageFrom = this.baseAgeFrom ? this.baseAgeFrom : "0";
        this.ageFromSet = true;
      }
      else{
        this.ageFromSet=false;
      }
      this.changedSetting=true;
  }

  setAgeFrom(ageFrom: string) {
    this.ageFrom = ageFrom;
    this.changedSetting = true;
  }

  setAgeTo(ageTo: string) {
    this.ageTo = ageTo;
    this.changedSetting = true;
  }

  setThreading(threading: Threading) {
    this.threading = threading;
    this.changedSetting = true;
  }

  setDefault() {
    this.ageFrom = this.baseAgeFrom ? this.baseAgeFrom : "0";
    this.ageFromSet = false;
    this.ageTo = "120";
    this.threading = Threading.MULTI;
    this.changedSetting = true;
  }

  submitOptions(){
      this.submittedAgeFrom=parseInt(this.ageFrom);
      this.submittedAgeTo=parseInt(this.ageTo);
      this.submittedThreading=this.threading;
      this.submittedAgeFromSet=this.ageFromSet;
  }

  changesHasBeenReported(){
      this.changedSetting=false;
  }

  optionsEqualToDefault(){
      return this.ageFrom===this.baseAgeFrom && this.ageTo===DEFAULT_AGE_TO && this.threading===DEFAULT_THREADING;
  }
}

function wholeNumberValidity(input: string) {
  const numberRegex = new RegExp("^[0-9]+$");
  return numberRegex.test(input);
}
