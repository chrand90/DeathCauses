import InterpolationTableCell, {
  MinObject,
  InterpolationTableCellJson,
} from "./InterpolationTableCell";
import InterpolationVariableMapping from "./InterpolationVariableMapping";
import Location, {
  LocationAndValue,
  locationAndValueSorter,
} from "./InterpolationLocation";
import {
  DimensionStatus,
  ProbabilityObject,
  StochasticStatus,
  UpdateDic,
} from "../../models/updateFormNodes/UpdateForm";

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

interface WeightedPoints {
  weight: number;
  locs: { [factorName: string]: number | string };
}

interface WeightedLocations {
  weight: number;
  fixedLocation: Location;
}

export interface WeightedLocationAndValue {
  weight: number;
  locationAndValue: LocationAndValue;
}

export class InterpolationTable {
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
    this.globalMin.setWithVarNameButInterpolationX(
      inputJson.global_min.minLocation
    );
    this.lowerTruncation = inputJson.lower_truncation
      ? inputJson.lower_truncation
      : null;
    this.upperTruncation = inputJson.upper_truncation
      ? inputJson.upper_truncation
      : null;
    this.globalMin.truncateValue(this.lowerTruncation, this.upperTruncation);
    inputJson.cells.forEach((element) =>
      this.cells.push(
        new InterpolationTableCell(
          element,
          this.interpolationVariables,
          this.nonInterpolationVariables,
          this.lowerTruncation,
          this.upperTruncation
        )
      )
    );
  }

  createFixedLocations(
    submittedFactorAnswers: UpdateDic,
    ageIndex: number,
    fixedFactors: string[]
  ) {
    let res: WeightedPoints[] = [{ weight: 1, locs: {} }];
    fixedFactors.forEach((fixedFactor) => {
      if (
        submittedFactorAnswers[fixedFactor].random === StochasticStatus.RANDOM
      ) {
        let extraRes: WeightedPoints[] = [];
        res.forEach((resObject) => {
          let probObject: ProbabilityObject;
          if (
            submittedFactorAnswers[fixedFactor].dimension ===
            DimensionStatus.YEARLY
          ) {
            probObject = (submittedFactorAnswers[fixedFactor]
              .value as ProbabilityObject[])[ageIndex];
          } else {
            probObject = submittedFactorAnswers[fixedFactor]
              .value as ProbabilityObject;
          }
          Object.entries(probObject).forEach(([value, prob]) => {
            extraRes.push({
              weight: resObject.weight * prob,
              locs: { ...resObject.locs, [fixedFactor]: value },
            });
          });
        });
        res = extraRes;
      } else {
        let value: number | string;
        if (
          submittedFactorAnswers[fixedFactor].dimension ===
          DimensionStatus.YEARLY
        ) {
          value = (submittedFactorAnswers[fixedFactor].value as
            | string[]
            | number[])[ageIndex];
        } else {
          value = submittedFactorAnswers[fixedFactor].value as string | number;
          if(fixedFactor==="Age"){
            if(typeof value==="number"){
              value+=ageIndex
            }
            else{
              value=parseInt(value)+ageIndex
            }
          }
        }
        for (let i = 0; i < res.length; i++) {
          res[i].locs[fixedFactor] = value;
        }
      }
    });
    return res.map(({ weight, locs }) => {
      let fixedLocation = new Location(
        this.interpolationVariables,
        this.nonInterpolationVariables
      );
      fixedLocation.setWithVarNamesWhenMatch(locs, fixedFactors);
      return {
        weight: weight,
        fixedLocation: fixedLocation,
      };
    });
  }

  getMinimumForFixedLocation(fixedLocation: Location){
    let filteredCells = this.cells.filter((cell: InterpolationTableCell) => {
      return cell.inCellAndSufficientlyInternal(fixedLocation);
    });
    let mins = filteredCells.map((cell: InterpolationTableCell) => {
      return cell.getMin(fixedLocation);
    });
    mins.sort(locationAndValueSorter);
    if (mins.length === 0 || mins[0] === undefined) {
      throw Error(
        "The mins list was unexpectedly empty meaning no minRR was computed for " +
          fixedLocation.setInterpolationVariables.toString()
      );
    }
    mins[0].truncateValue(this.lowerTruncation, this.upperTruncation);
    return mins[0]
  }

  getMinimumRR(
    submittedFactorAnswers: UpdateDic,
    fixedFactors: string[],
    ageIndex: number
  ): WeightedLocationAndValue[] {
    if (fixedFactors.length === 0) {
      return [{weight:1, locationAndValue: this.globalMin}];
    }
    let fixedLocations = this.createFixedLocations(
      submittedFactorAnswers,
      ageIndex,
      fixedFactors
    );
    if(fixedLocations.length>1){
      console.log("debug location")
    }
    return fixedLocations.map(({weight, fixedLocation}) => {
      return {
        weight:weight,
        locationAndValue: this.getMinimumForFixedLocation(fixedLocation)
      }
    });
  }
}
