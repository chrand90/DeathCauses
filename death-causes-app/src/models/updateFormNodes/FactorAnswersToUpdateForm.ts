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

export class FactorAnswersToUpdateForm {
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

  update(newFactorAnswers: FactorAnswers) {
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
