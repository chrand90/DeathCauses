import { stratify } from "d3-hierarchy";
import { FactorAnswers } from "../../models/Factors";
import {
  parseStringToInputType,
  parseVariableNumber,
  parseStringToPolynomial,
} from "./ParsingFunctions";
import { NumericInterval } from "./RiskRatioTableCell/NumericInterval";
import { RiskRatioTableCellInterface } from "./RiskRatioTableCell/RiskRatioTableCellInterface";
import FixedMin, { FixedMinObjectJson } from "./InterpolationFixedMin";
import { Polynomial } from "./Polynomial";
import InterpolationVariableMapping from "./InterpolationVariableMapping";
import Location, {
  LocationAndValue,
  InterpolationKeys,
  NonInterpolationKeys,
  addValueToLocation,
  locationAndValueSorter,
  VarNameToCoordinate,
} from "./InterpolationLocation";

enum ReasonsForNoMin {
  INFINITE_INTERVAL = "Infinite interval",
}

interface VarToVal {
  [key: string]: number | string | undefined;
}

export interface MinObject {
  minValue: number;
  minLocation: VarToVal;
}

interface FixedMinObjectJsons {
  fixed: string[];
  mins: FixedMinObjectJson[];
}

interface FixedMinPair {
  fixed: string[];
  mins: FixedMin[];
}

export interface InterpolationTableCellJson {
  interpolation_domains?: string[];
  non_interpolation_domains?: string[];
  value?: number;
  interpolation_polynomial?: string;
  min?: MinObject;
  fixed_mins?: FixedMinObjectJsons[];
  lower_truncation?: number | null;
  upper_truncation?: number | null;
}

export default class InterpolationTableCell {
  interpolationDomains: RiskRatioTableCellInterface[];
  nonInterpolationDomains: RiskRatioTableCellInterface[];
  value: number | undefined;
  interpolationPolynomial: Polynomial | undefined;
  min: LocationAndValue | ReasonsForNoMin;
  fixedMins: FixedMinPair[];
  truncate: boolean;
  lowerTruncation: number | null;
  upperTruncation: number | null;
  interpolationVariables: InterpolationVariableMapping;
  nonInterpolationVariables: string[];
  infiniteInterpolationVariables: string[];

  constructor(
    cell: InterpolationTableCellJson,
    interpolationVariables: InterpolationVariableMapping,
    nonInterpolationVariables: string[],
    lowerTruncationFromTable: number | null=null,
    upperTruncationFromTable: number | null=null
  ) {
    this.interpolationVariables = interpolationVariables;
    this.nonInterpolationVariables = nonInterpolationVariables;
    this.interpolationDomains = cell.interpolation_domains
      ? this.initDomains(cell.interpolation_domains)
      : [];

    this.infiniteInterpolationVariables = this.getFactorsWithInfiniteDomain();

    this.nonInterpolationDomains = cell.non_interpolation_domains
      ? this.initDomains(cell.non_interpolation_domains)
      : [];

    this.value = cell.value;

    this.interpolationPolynomial = cell.interpolation_polynomial
      ? parseStringToPolynomial(cell.interpolation_polynomial)
      : undefined;

    this.lowerTruncation = this.initializeTruncation(cell.lower_truncation, lowerTruncationFromTable)
    this.upperTruncation = this.initializeTruncation(cell.upper_truncation, upperTruncationFromTable)
  

    this.min = this.initializeCellMin(cell.min);

    this.truncate =
      (cell.lower_truncation || cell.upper_truncation || lowerTruncationFromTable || upperTruncationFromTable) ? true : false;

    
    this.fixedMins = this.initializeCellFixedMin(cell.fixed_mins);
  }

  initializeTruncation(truncationFromCell: number | null | undefined, truncationFromTable: number | null){
    if(truncationFromCell){
      return truncationFromCell
    }
    if(truncationFromTable){
      return truncationFromTable
    }
    return null
  }

  getFactorsWithInfiniteDomain(): string[] {
    let factorsWithInfiniteDomain: string[]=[]
    this.interpolationDomains
      .forEach((domain: RiskRatioTableCellInterface, index: number) => {
        let intervalFrom = (domain as NumericInterval).endPointFrom;
        let intervalTo = (domain as NumericInterval).endPointTo;
        if(!isFinite(intervalFrom) || !isFinite(intervalTo)){
          let varname=this.interpolationVariables.getRealNameFromIndex(index)
          factorsWithInfiniteDomain.push(varname)
        }
      })
    return factorsWithInfiniteDomain;
  }

  evaluate(location: Location): number {
    if (this.interpolationPolynomial) {
      return this.interpolationPolynomial.evaluate(location);
    }
    throw Error("A interpolation polynomium unexpectedly did not exist");
  }

  initializeCellMin(
    oldMinObject: MinObject | undefined
  ): LocationAndValue | ReasonsForNoMin {
    if (oldMinObject) {
      let min = new LocationAndValue(
        this.interpolationVariables,
        this.nonInterpolationVariables,
        oldMinObject.minValue
      );
      min.setWithVarNameButInterpolationX(oldMinObject.minLocation);
      min.setAllNonInterpolationsWithDomains(this.nonInterpolationDomains);
      min.truncateValue(this.lowerTruncation, this.upperTruncation);
      return min;
    } else if (this.interpolationPolynomial) {
      //the only reason for no min object to exist here is if a domain is infinite
      return ReasonsForNoMin.INFINITE_INTERVAL;
    } else if (this.value === undefined) {
      throw Error("A cell is missing both value and interpolation polynomial.");
    }
    let min = new LocationAndValue(
      this.interpolationVariables,
      this.nonInterpolationVariables,
      this.value
    );
    min.setAllNonInterpolationsWithDomains(this.nonInterpolationDomains);
    min.truncateValue(this.lowerTruncation, this.upperTruncation);
    return min;
  }

  initializeCellFixedMin(
    fixedMinInitializer: FixedMinObjectJsons[] | undefined
  ): FixedMinPair[] {
    if (!fixedMinInitializer) {
      let res: FixedMinPair[] = [];
      return res;
    }
    return fixedMinInitializer.map(({ fixed, mins }) => {
      let freeVariableIndices: number[] = [];
      let xvar: string;
      for (let i = 0; i < this.infiniteInterpolationVariables.length; i++) {
        xvar = "x" + i.toString();
        if (!fixed.includes(xvar)) {
          freeVariableIndices.push(i);
        }
      }
      return {
        fixed: fixed,
        mins: mins.map((f: FixedMinObjectJson) => {
          return new FixedMin(
            f,
            this.interpolationVariables,
            this.nonInterpolationVariables,
            fixed,
            this.lowerTruncation
          );
        }),
      };
    });
  }

  /*
  This function returns true if two conditions are true:
    1. if all the factoranswers specified in nonInterpolationFactorAnswers and interpolationFactorAnswers lie in their respective domain
    2. if all infinite intervals has a fixed factor.
   */
  inCellAndSufficientlyInternal(location: Location) {
    let inAllDomains = location
      .getNonInterpolationValues(NonInterpolationKeys.INDEX)
      .every(({ value, key }) => {
        return this.nonInterpolationDomains[key as number].isInputWithinCell(
          value
        );
      });
    if (!inAllDomains) {
      return false;
    }
    inAllDomains = location
      .getInterpolationValues(InterpolationKeys.INDEX)
      .every(({ value, key }) => {
        return this.interpolationDomains[key as number].isInputWithinCell(
          value
        );
      });
    return inAllDomains
    // if (!inAllDomains) {
    //   return false;
    // }
    // let fixedFactors: string[] = location.getFixedInterpolationVariables() as string[];
    // const allOkay=this.infiniteInterpolationVariables.every((varname: string) => {
    //   return fixedFactors.includes(varname);
    // });
    // return allOkay
  
  }

  initDomains(stringlist: string[]) {
    return stringlist.map((s: string) => {
      return parseStringToInputType(s);
    });
  }

  pointOutInfiniteIntervals() {
    this.interpolationDomains.forEach(
      (d: RiskRatioTableCellInterface, index: number) => {
        if (d.hasOwnProperty("endPointFrom")) {
          //meaning that it is a numericinterval
          let startPoint = (d as NumericInterval).endPointFrom;
          let endPoint = (d as NumericInterval).endPointTo;
          if (!isFinite(startPoint) || !isFinite(endPoint)) {
            this.infiniteInterpolationVariables.push(
              this.interpolationVariables.getRealNameFromIndex(index)
            );
          }
        }
      }
    );
  }

  extractFixedMinObject(fixedVariableSet: string[]): FixedMin[] | undefined{
    let fixedVariableSetChecker: string = fixedVariableSet.sort().join(",");
    for (let i = 0; i < this.fixedMins.length; i++) {
      if (
        fixedVariableSetChecker === this.fixedMins[i].fixed.sort().join(",")
      ) {
        return this.fixedMins[i].mins;
      }
    }
    throw Error(
       "A fixedMin set which was supposed to exist did in fact not appear."
    );
  }

  computeDiscriminantCandidates(
    fixedMinPairs: FixedMin[],
    fixedInterpolationFactorAnswers: Location
  ):LocationAndValue[] {
    const candidates = fixedMinPairs.map((fixedMinObject: FixedMin) => {
      return fixedMinObject.getDiscriminantCandidates(
        fixedInterpolationFactorAnswers,
        this.interpolationDomains
      );
    });
    const candidatesUnpacked = ([] as Location[]).concat.apply([], candidates);
    const computedVals: LocationAndValue[] = candidatesUnpacked.map(
      (location: Location) => {
        const minValue = this.evaluate(location);
        return addValueToLocation(location, minValue);
      }
    );
    return computedVals;
  }

  computeBoundaryCandidates(
    fixedMinPairs: FixedMin[],
    fixedInterpolationFactorAnswers: Location
  ) {
    let candidates: LocationAndValue[] = fixedMinPairs.filter((fixedMinObject: FixedMin) => {
      return fixedMinObject.hasBoundaryCandidates()
    }).map((fixedMinObject: FixedMin) => {
      return fixedMinObject.getBoundaryMin(fixedInterpolationFactorAnswers);
    }).filter((f) => { return f!==undefined});
    const computedVals = ([] as LocationAndValue[]).concat.apply(
      [],
      candidates
    );
    return computedVals;
  }

  computeInfinityCandidates(
    fixedMinPairs: FixedMin[],
    fixedInterpolationFactorAnswers: Location
  ){
    const candidates = fixedMinPairs.map((fixedMinObject: FixedMin) => {
      return fixedMinObject.getInfinityCandidates(
        fixedInterpolationFactorAnswers,
        this.interpolationDomains
      );
    });
    const candidatesUnpacked = ([] as Location[]).concat.apply([], candidates);
    const computedVals: LocationAndValue[] = candidatesUnpacked.map(
      (location: Location) => {
        const minValue = this.evaluate(location);
        if(this.lowerTruncation && Math.abs(minValue-this.lowerTruncation)>1e-8){
          throw Error("The lower truncation was not hit by the infinity candidate")
        }
        return addValueToLocation(location, minValue);
      }
    );
    return computedVals;
  }

  getMin(fixedInterpolationFactorAnswers: Location): LocationAndValue {
    const numberOfFixed = fixedInterpolationFactorAnswers.getNumberOfFixedInterpolationVariables();
    const numberOfInterpolationVariables = this.interpolationVariables.getLength();
    if (numberOfFixed === 0) {
      if (this.min === ReasonsForNoMin.INFINITE_INTERVAL) {
        throw Error(
          "A cell has been asked to compute a minimum which it can't provide"
        );
      } else {
        return this.min;
      }
    }
    if (numberOfFixed === numberOfInterpolationVariables) {
      let value = this.evaluate(fixedInterpolationFactorAnswers);
      let min = fixedInterpolationFactorAnswers.makeChildWithValue(value);
      min.truncateValue(this.lowerTruncation, this.upperTruncation);
      return min;
    }
    //In this case it means that we need to look at fixedmins.
    let fixedVariableSet = fixedInterpolationFactorAnswers.getFixedInterpolationVariables(
      InterpolationKeys.XVAR
    );
    const fixedMinObjects: FixedMin[] = this.extractFixedMinObject(
      fixedVariableSet as string[]
    ) as FixedMin[];
    let candidates = this.computeDiscriminantCandidates(
      fixedMinObjects,
      fixedInterpolationFactorAnswers
    );
    candidates= candidates.concat(
      this.computeBoundaryCandidates(
        fixedMinObjects,
        fixedInterpolationFactorAnswers
      )
    ).concat(
      this.computeInfinityCandidates(
        fixedMinObjects,
        fixedInterpolationFactorAnswers
      )
    );
    candidates.sort(locationAndValueSorter);
    const lowestPoint=candidates[0]
    lowestPoint.truncateValue(this.lowerTruncation, this.upperTruncation)
    return lowestPoint;
  }
}
