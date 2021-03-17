import { FactorAnswers } from "../../models/Factors";
import InterpolationTableCell, {
  MinObject,
  InterpolationTableCellJson,
} from "./InterpolationTableCell";
import InterpolationVariableMapping from "./InterpolationVariableMapping";
import Location, { LocationAndValue, locationAndValueSorter } from "./InterpolationLocation";

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
        return cell.getMin(fixedLocation);
      });
    mins.sort(locationAndValueSorter);
    if(mins.length===0){
      console.log("examination point");
      throw Error("The mins list was unexpectedly empty meaning no minRR was computed for "+fixedFactors.toString());
    }
    console.log("mins")
    console.log(mins)
    return mins[0];
  }

}
