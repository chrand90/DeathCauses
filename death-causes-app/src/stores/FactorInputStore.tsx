import { makeObservable, observable, computed, action } from "mobx";
import {
  FactorAnswers,
  FactorAnswerUnitScalings,
  FactorMaskings,
} from "../models/Factors";
import { InputValidity } from "../models/FactorAbstract";
import LoadedDataStore from "./LoadedDataStore";
import ComputationStateStore, { ComputationState } from "./ComputationStateStore";

interface InputValidities {
  [key: string]: InputValidity;
}

interface IgnoreList {
  [key: string]: boolean;
}

export interface AllNecessaryInputs {
  factorAnswers: FactorAnswers;
  factorMaskings: FactorMaskings;
  factorAnswerUnitScalings: FactorAnswerUnitScalings;
  activelyIgnored: IgnoreList
}

export default class FactorInputStore {
  validities: InputValidities;
  factorAnswers: FactorAnswers;
  factorAnswerScales: FactorAnswerUnitScalings;
  activelyIgnored: IgnoreList;
  loadedDataStore: LoadedDataStore;
  computationStateStore: ComputationStateStore;
  factorMaskings: FactorMaskings;

  constructor(loadedDataStore: LoadedDataStore, computationStateStore: ComputationStateStore) {
    this.validities = {};
    this.factorAnswers = {};
    this.factorAnswerScales = {};
    this.activelyIgnored = {};
    this.factorMaskings = {};
    this.loadedDataStore = loadedDataStore;
    this.computationStateStore= computationStateStore;
    makeObservable(this, {
      validities: observable,
      factorAnswers: observable,
      factorAnswerScales: observable,
      activelyIgnored: observable,
      attachLoadedData: action.bound,
      resetValidities: action.bound,
      submittable: computed,
      inputChange: action.bound,
      inputChangeWrapper: action.bound,
      ignoreFactor: action.bound,
      changeUnit: action.bound,
      updateMissingValidities: action.bound,
      updateSpecificValidity: action.bound,
      setFactorAnswers: action.bound,
      insertData: action.bound,
    });
  }

  getAllNecessaryInputs(): AllNecessaryInputs{
    return {
      factorAnswers: this.factorAnswers,
      factorMaskings: this.factorMaskings,
      factorAnswerUnitScalings: this.factorAnswerScales,
      activelyIgnored: this.activelyIgnored
    }
  }

  insertData(data: AllNecessaryInputs){
    //we may want to make this 
    this.factorAnswers={...this.factorAnswers, ...data.factorAnswers};
    this.factorMaskings=data.factorMaskings;
    this.factorAnswerScales=data.factorAnswerUnitScalings;
    this.activelyIgnored=data.activelyIgnored;
    this.resetValidities();
    this.computationStateStore.setComputationState(ComputationState.CHANGED)
  }

  attachLoadedData() {
    this.factorAnswers = this.loadedDataStore.factors.getFactorsAsStateObject();
    this.resetValidities();
  }

  get submittable() {
    return Object.values(this.validities).every((d: InputValidity) => {
      return d.status !== "Error";
    });
  }

  resetValidities() {
    let res: InputValidities = {};
    for (let factorName in this.factorAnswers) {
      res[factorName] = this.loadedDataStore.factors.getInputValidity(
        factorName,
        this.factorAnswers[factorName] as string,
        factorName in this.factorAnswerScales
               ? this.factorAnswerScales[factorName].unitName
               : undefined
      );
    }
    this.validities = res;
  }

  ignoreFactor(ev: React.ChangeEvent<HTMLInputElement>) {
    const { name } = ev.currentTarget;
    const value = ev.currentTarget.checked;
    const factorname = name;
    this.activelyIgnored = {
      ...this.activelyIgnored,
      [factorname]: value,
    };
    this.inputChange(factorname, "");
    this.computationStateStore.setComputationState(ComputationState.CHANGED)
  }

  inputChangeWrapper(ev: React.ChangeEvent<HTMLInputElement>) {
    const { name } = ev.currentTarget;
    const rawValue = ev.currentTarget.value;
    const factorname = name;
    const value = rawValue ? rawValue : "";
    console.log("called change wrapper with " + factorname + "=" + value);
    this.inputChange(factorname, value);
  }

  inputChange(factorname: string, value: string) {
    console.log("entered input change");
    const newFactorAnswers = { ...this.factorAnswers, [factorname]: value };
    this.factorAnswers = newFactorAnswers;
    const possiblyNewMasks:
      | FactorMaskings
      | "nothing changed" = this.loadedDataStore.factors.updateMasked(
      newFactorAnswers,
      factorname,
      this.factorMaskings
    );
    if (possiblyNewMasks === "nothing changed") {
    } else {
      this.factorMaskings = possiblyNewMasks;
    }
    this.updateSpecificValidity(factorname);
    this.computationStateStore.setComputationState(ComputationState.CHANGED)
  }

  changeUnit(factorname: string, newUnitName: string) {
    this.factorAnswerScales = {
      ...this.factorAnswerScales,
      [factorname]: {
        unitName: newUnitName,
        scale: this.loadedDataStore.factors.getScalingFactor(
          factorname,
          newUnitName
        ),
      },
    };
    this.updateSpecificValidity(factorname);
    this.computationStateStore.setComputationState(ComputationState.CHANGED)
  }

  updateSpecificValidity(factorName: string) {
    this.validities[factorName] = this.loadedDataStore.factors.getInputValidity(
      factorName,
      this.factorAnswers[factorName] as string,
      factorName in this.factorAnswerScales
        ? this.factorAnswerScales[factorName].unitName
        : undefined
    );
  }

  updateMissingValidities(hasBeenAnswered: string[], currentFactor: string) {
    for (let factorName in this.validities) {
      //checking if there can be submitted a form.
      let validity = this.validities[factorName];
      if (
        validity.status === "Missing" &&
        !(
          factorName in this.activelyIgnored && this.activelyIgnored[factorName]
        ) &&
        (hasBeenAnswered.includes(factorName) || currentFactor === factorName)
      ) {
        this.validities[factorName] = {
          message: "Ignored by the model",
          status: "Warning",
        };
      }
    }
  }

  setFactorAnswers(factorAnswers: FactorAnswers, factorMaskings?: FactorMaskings){
      if(factorMaskings!==undefined){
          this.factorMaskings=factorMaskings
      }
      this.factorAnswers=factorAnswers;
      this.resetValidities();
      this.computationStateStore.setComputationState(ComputationState.CHANGED)
  }

  //this is not a computed value because we only want to compute it when we need it.
  computeSubmittedAnswers() {
    let submittedAnswers = { ...this.factorAnswers };
    Object.entries(submittedAnswers).forEach(([factorname, submittedValue]) => {
      if (factorname in this.factorMaskings) {
        submittedValue = this.factorMaskings[factorname].effectiveValue;
      } else if (submittedValue === "") {
        return; // skipping because it already has the correct value
      } else if (factorname in this.factorAnswerScales) {
        submittedValue = (
          parseFloat(submittedAnswers[factorname] as string) *
          this.factorAnswerScales[factorname].scale
        ).toString();
      }
      submittedAnswers[factorname] = this.loadedDataStore.factors.factorList[
        factorname
      ].insertActualValue(submittedValue as string);
    });
    return submittedAnswers;
  }
}
