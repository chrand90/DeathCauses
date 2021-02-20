import { FactorAnswers } from "../Factors";

export enum ChangeStatus {
  CHANGED = "Changed",
  UNCHANGED = "Unchanged",
}

export enum TypeStatus {
  NUMERIC = "Numeric",
  STRING = "string",
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
    | ProbabilityObject[];
}

export interface UpdateDic {
  [factorname: string]: UpdateForm;
}

export class InputFactorToUpdateForm {
  lastInputFactorAnswers: FactorAnswers;
  lastOutputNodeValues: UpdateDic;
  constructor() {
    this.lastInputFactorAnswers = {};
    this.lastOutputNodeValues = {};
  }

  createNewFactorVal(
    factorname: string,
    factorval: string | number
  ): UpdateForm {
    if (typeof factorval === "number") {
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

  update(newFactorAnswers: FactorAnswers) {
    Object.entries(newFactorAnswers).forEach(([factorname, factorval]) => {
      if (
        factorname in this.lastInputFactorAnswers &&
        this.lastInputFactorAnswers[factorname] === factorval
      ) {
        this.lastOutputNodeValues[factorname].change = ChangeStatus.UNCHANGED;
      } else {
        this.lastOutputNodeValues[factorname] = this.createNewFactorVal(
          factorname,
          factorval
        );
      }
    });
    this.lastInputFactorAnswers = newFactorAnswers;
    return this.lastOutputNodeValues;
  }
}

export abstract class FormUpdater {
    lastOutput: UpdateForm | null;
    ancestors: string[];
    ageFrom: number | null;
    ageTo: number;
    constructor(ancestors: string[], ageFrom: number | null, ageTo: number){
        this.lastOutput=null;
        this.ancestors=ancestors;
        this.ageFrom = ageFrom;
        this.ageTo = ageTo;
    }

    getAgeFrom(allPreviousUpdateForms: UpdateDic):number{
        if(this.ageFrom===null){
            return (allPreviousUpdateForms["Age"].value as number)
        }
        else{
            return this.ageFrom
        }
    }

    getAgeTo(){
        return this.ageTo
    }



    isUnchanged(allPreviousUpdateForms: UpdateDic):boolean{
      return this.ancestors.every( (ancestor:string) => {
        if(!(ancestor in allPreviousUpdateForms)){
          throw ancestor+' not found in the updatedic'           
        }
        return allPreviousUpdateForms[ancestor].change===ChangeStatus.UNCHANGED
      })
    }

    isMissing(allPreviousUpdateForms: UpdateDic): boolean {
      return !this.ancestors.every( (ancestor:string) => {
        if(!(ancestor in allPreviousUpdateForms)){
          throw ancestor+' not found in the updatedic'           
        }
          return allPreviousUpdateForms[ancestor].missing===MissingStatus.NONMISSING
      })
    }

    getNode(allPreviousUpdateForms: UpdateDic, nodename: string):UpdateForm{
      if(this.ancestors.includes(nodename) && nodename in allPreviousUpdateForms){
        return allPreviousUpdateForms[nodename]
      }
      else if(!this.ancestors.includes(nodename)){
        throw "The requested factor "+ nodename+ " was not present in its ancestors,"+this.ancestors.toString()
      }
      else{
        throw "The requested factor "+nodename+ " was not present in the updatedic."
      }
    }

    handleMissing(){
        this.lastOutput={
            change: ChangeStatus.CHANGED,
            missing: MissingStatus.MISSING,
            type: TypeStatus.STRING,
            dimension: DimensionStatus.SINGLE,
            random: StochasticStatus.DETERMINISTIC,
            value: ""
        }
    }

    ChangedAndMissing(){
        return {
            change: ChangeStatus.CHANGED,
            missing: MissingStatus.NONMISSING
        }
    }

    getAges(udic: UpdateDic){
      return {ageFrom: this.getAgeFrom(udic), ageTo:this.getAgeTo(), age:(udic["Age"].value as number)}
    }

    update(allPreviousUpdateForms: UpdateDic): UpdateForm{
        if(this.lastOutput!== null && this.isUnchanged(allPreviousUpdateForms)){
            this.lastOutput.change=ChangeStatus.UNCHANGED
            return this.lastOutput
        }
        if(this.isMissing(allPreviousUpdateForms)){
            this.handleMissing();
            return this.lastOutput!; //it has just been changed to something which is not null.
        }
        this.lastOutput=this.compute(allPreviousUpdateForms);
        return this.lastOutput;
    }

    abstract compute(allPreviousUpdateForms: UpdateDic): UpdateForm;
}

export interface FormUpdaterDic {
    [nodeName: string]: FormUpdater;
}