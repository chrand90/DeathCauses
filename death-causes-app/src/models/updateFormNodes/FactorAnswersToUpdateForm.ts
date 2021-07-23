import { FactorAnswers } from "../Factors";
import {
  ChangeStatus,
  DimensionStatus,
  MissingStatus,
  StochasticStatus,
  TypeStatus,
  UpdateDic,
  UpdateForm,
} from "./UpdateForm";
import { customPrecision }  from "../../components/Helpers"

export const UNKNOWNLABEL="Unknown"
export interface FactorAnswerChange {
  fromVal: number | string;
  toVal: number | string;
}
export interface FactorAnswerChanges {
  [factorName:string]: FactorAnswerChange
}

export class FactorAnswersToUpdateForm {
  lastInputFactorAnswers: FactorAnswers;
  lastOutputNodeValues: UpdateDic;
  changes: FactorAnswerChanges;

  constructor() {
    this.changes={};
    this.lastInputFactorAnswers = {};
    this.lastOutputNodeValues = {};
  }

  createNewFactorVal(
    factorname: string,
    factorval: string | number
  ): UpdateForm {
    if (
      typeof factorval === "number" &&
      !isNaN(factorval) &&
      isFinite(factorval)
    ) {
      return {
        change: ChangeStatus.CHANGED,
        type: TypeStatus.NUMERIC,
        missing: MissingStatus.NONMISSING,
        dimension: DimensionStatus.SINGLE,
        random: StochasticStatus.DETERMINISTIC,
        value: factorval,
      };
    } else if (factorval === "") {
      if (factorname === "Age") {
        // we cant have Age to be missing. It will default to 0.
        return {
          change: ChangeStatus.CHANGED,
          type: TypeStatus.NUMERIC,
          missing: MissingStatus.NONMISSING,
          dimension: DimensionStatus.SINGLE,
          random: StochasticStatus.DETERMINISTIC,
          value: 0,
        };
      } else {
        return {
          change: ChangeStatus.CHANGED,
          type: TypeStatus.STRING,
          missing: MissingStatus.MISSING,
          dimension: DimensionStatus.SINGLE,
          random: StochasticStatus.DETERMINISTIC,
          value: factorval,
        };
      }
    }
    return {
      change: ChangeStatus.CHANGED,
      type: TypeStatus.STRING,
      missing: MissingStatus.NONMISSING,
      dimension: DimensionStatus.SINGLE,
      random: StochasticStatus.DETERMINISTIC,
      value: factorval,
    };
  }

  getStringValueOfNode(node: UpdateForm | undefined):string[]{
    if(!node){
      return [UNKNOWNLABEL, UNKNOWNLABEL]
    }
    if(node.missing===MissingStatus.MISSING){
      return [UNKNOWNLABEL, UNKNOWNLABEL]
    }
    else if(node.type===TypeStatus.NUMERIC){
      return [
        customPrecision(node.value as string | number,4),
        customPrecision(node.value as string | number,14)
      ];
    }
    else if(node.type===TypeStatus.STRING){
      return [node.value as string , node.value as string]
    }
    throw Error("Unknown output type to input factor")
  }

  getRecentChanges(){
    return this.changes;
  }

  addToChangeObject(factorname: string, newNode: UpdateForm): void{
    const [fromVal, fromValPrecise]= this.getStringValueOfNode(this.lastOutputNodeValues[factorname])
    const [toVal, toValPrecise]= this.getStringValueOfNode(newNode)
    if(fromVal!==toVal){
      this.changes[factorname]={fromVal, toVal}
    }
    else if(fromValPrecise!==toValPrecise){
      this.changes[factorname]={fromVal:fromValPrecise, toVal:toValPrecise}
    }
  }

  update(newFactorAnswers: FactorAnswers) {
    this.changes={};
    let defaultChangeStatus = ChangeStatus.UNCHANGED;
    if (
      !("Age" in this.lastInputFactorAnswers) ||
      newFactorAnswers["Age"] !== this.lastInputFactorAnswers["Age"]
    ) {
      defaultChangeStatus = ChangeStatus.CHANGED;
    }
    Object.entries(newFactorAnswers).forEach(([factorname, factorval]) => {
      if (
        factorname in this.lastInputFactorAnswers &&
        this.lastInputFactorAnswers[factorname] === factorval
      ) {
        this.lastOutputNodeValues[factorname].change = defaultChangeStatus;
      } else {
        const newNode= this.createNewFactorVal(
          factorname,
          factorval
        );
        this.addToChangeObject(factorname, newNode)
        this.lastOutputNodeValues[factorname] = newNode
      }
    });
    this.lastInputFactorAnswers = newFactorAnswers;
    return this.lastOutputNodeValues;
  }
}
