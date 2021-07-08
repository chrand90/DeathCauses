import InterpolationTableCell, {
  MinObject,
  InterpolationTableCellJson,
} from "./InterpolationTableCell";
import InterpolationVariableMapping from "./InterpolationVariableMapping";
import Location, { LocationAndValue, locationAndValueSorter } from "./InterpolationLocation";
import { DimensionStatus, ProbabilityObject, StochasticStatus, UpdateDic } from "../../models/updateFormNodes/UpdateForm";

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
  weight:number;
  locs: (string | number)[];
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

  createFixedLocations(submittedFactorAnswers: UpdateDic, ageIndex:number, fixedFactors:string[]){
    let res=[{weight:1, locs:[]}]
    fixedFactors.forEach(fixedFactor => {
      if(submittedFactorAnswers[fixedFactor].random===StochasticStatus.RANDOM){
        let extra_res:=[]
        res.forEach(resObject=> {
          let probObject: ProbabilityObject;
          if(submittedFactorAnswers[fixedFactor].dimension===DimensionStatus.YEARLY){
            probObject=(submittedFactorAnswers[fixedFactor].value as ProbabilityObject[])[ageIndex]
          }
          else{
            probObject=submittedFactorAnswers[fixedFactor].value as ProbabilityObject
          }
          Object.entries(probObject).forEach(([value, prob]) =>{

          } )
        })
      }
      submittedFactorAnswers[fixedFactor]
    })
  }

  getMinimumRR(
    submittedFactorAnswers: UpdateDic,
    fixedFactors: string[],
    ageIndex:number
  ): LocationAndValue {
    if (fixedFactors.length === 0) {
      return this.globalMin;
    }
    let fixedLocation=new Location(this.interpolationVariables, this.nonInterpolationVariables);
    fixedLocation.setWithVarNamesWhenMatch(submittedFactorAnswers, ageIndex, fixedFactors)
    let filteredCells= this.cells
      .filter((cell: InterpolationTableCell) => {
        return cell.inCellAndSufficientlyInternal(
          fixedLocation
        );
      })
    let mins=filteredCells.map((cell: InterpolationTableCell) => {
        return cell.getMin(fixedLocation);
      });
    mins.sort(locationAndValueSorter);
    if(mins.length===0 || mins[0]===undefined){
      throw Error("The mins list was unexpectedly empty meaning no minRR was computed for "+fixedFactors.toString());
    }
    mins[0].truncateValue(this.lowerTruncation, this.upperTruncation);
    return mins[0];
  }

}
