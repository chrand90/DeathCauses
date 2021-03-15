import { FactorAnswers } from "../../models/Factors";
import {
  parseStringToInputType,
  parseStringToPolynomial,
} from "./ParsingFunctions";
import { Polynomial } from "./Polynomial";
import { RiskRatioTableCellInterface } from "./RiskRatioTableCell/RiskRatioTableCellInterface";
import InterpolationTableCell, {
  MinObject,
  InterpolationTableCellJson,
} from "./InterpolationTableCell";
import InterpolationVariableMapping from "./InterpolationVariableMapping";
import Location, { LocationAndValue } from "./InterpolationLocation";

interface VariableToIndex {
  [key: string]: number;
}

export interface InterpolationTableJson {
  cells: InterpolationTableCellJson[];
  lower_truncation?: number | null;
  upper_truncation?: number | null;
  global_min: MinObject;
  interpolation_variables?: string[];
  non_interpolation_variables?: string[];
}

export class InterpolationEntry {
  cells: InterpolationTableCell[] = [];
  nonInterpolationVariables: string[];
  interpolationVariables: InterpolationVariableMapping;
  globalMin: LocationAndValue;
  lowerTruncation: number | null;
  upperTruncation: number | null;

  constructor(inputJson: InterpolationTableJson) {
    this.nonInterpolationVariables = inputJson.non_interpolation_variables
      ? inputJson.non_interpolation_variables
      : [];
    this.interpolationVariables = new InterpolationVariableMapping(
      inputJson.interpolation_variables ? inputJson.interpolation_variables : []
    );
    this.globalMin = new LocationAndValue(
        this.interpolationVariables, 
        this.nonInterpolationVariables,
        inputJson.global_min.minValue
    );
    this.globalMin.setWithVarNameButInterpolationX(inputJson.global_min.minLocation)
    this.lowerTruncation = inputJson.lower_truncation
      ? inputJson.lower_truncation
      : null;
    this.upperTruncation = inputJson.upper_truncation
      ? inputJson.upper_truncation
      : null;
    inputJson.cells.forEach((element) =>
      this.cells.push(
        new InterpolationTableCell(
          element,
          this.interpolationVariables,
          this.nonInterpolationVariables
        )
      )
    );
  }

  getMinimumRR(
    submittedFactorAnswers: FactorAnswers,
    fixedFactors: string[]
  ): LocationAndValue {
    if (fixedFactors.length === 0) {
      return this.globalMin;
    }
    let fixedLocation=new Location(this.interpolationVariables, this.nonInterpolationVariables);
    //extracts the fixed factors from submittedFactorAnswers.
    fixedLocation.setWithVarNamesWhenMatch(submittedFactorAnswers, fixedFactors)
    let mins = this.cells
      .filter((cell: InterpolationTableCell) => {
        return cell.inCellAndSufficientlyInternal(
          fixedLocation
        );
      })
      .map((cell: InterpolationTableCell) => {
        return cell.getMin(fixedInterpolationFactors);
      });
    mins.sort(function (a, b) {
      return a.minValue - b.minValue;
    });
    return mins[0];
  }

  getMinimumRRFactors() {
    let riskRatioValues = this.riskRatioTable.map(
      (rrte) => rrte.riskRatioValue
    );
    let minimumIndex = riskRatioValues.indexOf(Math.min(...riskRatioValues));
    let minRrte = this.riskRatioTable[minimumIndex];
    let res: any = {};
    this.factorNames.forEach(
      (value, index) => (res[value] = minRrte.factorValues[index])
    );
    return res;
  }

  getRiskRatio(submittedFactorAnswers: FactorAnswers): number {
    let relevantFactorAnswers = this.getRelevantFactorAnswers(
      submittedFactorAnswers
    );
    for (let i = 0; i < this.riskRatioTable.length; i++) {
      if (
        this.riskRatioTable[i].isFactorAnswersInDomain(relevantFactorAnswers)
      ) {
        return this.riskRatioTable[i].riskRatioValue;
      }
    }
    return this.riskRatioTable[this.riskRatioTable.length - 1].riskRatioValue; // tmp to make it run

    throw new Error(
      "Found no risk ratio entry where " +
        submittedFactorAnswers +
        " is within domain"
    );
  }

  private getRelevantFactorAnswers = (
    sumbittedFactorAnswers: FactorAnswers
  ): (string | number)[] => {
    let res: (string | number)[] = [];
    this.factorNames.forEach((factor) =>
      res.push(sumbittedFactorAnswers[factor])
    );
    return res;
  };

  getRelevantFactorAnswers = (
    sumbittedFactorAnswers: FactorAnswers
  ): (string | number)[] => {
    let res: (string | number)[] = [];
    this.factors.forEach((factor) => res.push(sumbittedFactorAnswers[factor]));
    return res;
  };

  isFactorAnswersInDomain(relevantFactorAnswers: (string | number)[]) {
    for (let i = 0; i < this.factors.length; i++) {
      let isSubmittedFactorAnswerWithinCell = this.domain[i].isInputWithinCell(
        relevantFactorAnswers[i]
      );
      if (!isSubmittedFactorAnswerWithinCell) {
        return false;
      }
    }
    return true;
  }

  interpolateRR(submittedFactorAnswers: number[]) {
    let res = this.polynomial.evaluate(submittedFactorAnswers);
    if (this.minValue && res < this.minValue) return this.minValue;
    if (this.maxValue && res > this.maxValue) return this.maxValue;
    return res;
  }
}
