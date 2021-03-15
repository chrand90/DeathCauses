import { stratify } from "d3-hierarchy";
import { FactorAnswers } from "../../models/Factors";
import {
  parseStringToInputType,
  parseVariableNumber,
  parseStringToPolynomial,
} from "./ParsingFunctions";
import { NumericInterval } from "./RiskRatioTableCell/NumericInterval";
import { RiskRatioTableCellInterface } from "./RiskRatioTableCell/RiskRatioTableCellInterface";
import FixedMin, {
  FixedMinObjectJson,
} from "./InterpolationFixedMin";
import { Polynomial } from "./Polynomial";
import InterpolationVariableMapping from "./InterpolationVariableMapping";
import Location, { LocationAndValue, KeyOptionsInterpolationVariables, KeyOptionsNonInterpolationVariables, VarNameToCoordinate } from "./InterpolationLocation";

enum ReasonsForNoMin {
  INFINITE_INTERVAL = "Infinite interval",
}

export interface MinObject {
  minValue: number;
  minLocation: VarNameToCoordinate;
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
    nonInterpolationVariables: string[]
  ) {
    this.interpolationVariables = interpolationVariables;
    this.nonInterpolationVariables = nonInterpolationVariables;
    this.infiniteInterpolationVariables = [];
    this.interpolationDomains = cell.interpolation_domains
      ? this.initDomains(cell.interpolation_domains)
      : [];

    this.nonInterpolationDomains = cell.non_interpolation_domains
      ? this.initDomains(cell.non_interpolation_domains)
      : [];

    this.value = cell.value ? cell.value : undefined;

    this.interpolationPolynomial = cell.interpolation_polynomial
      ? parseStringToPolynomial(cell.interpolation_polynomial)
      : undefined;

    this.min = this.initializeCellMin(cell.min);

    this.fixedMins = this.initializeCellFixedMin(cell.fixed_mins);

    this.truncate =
      cell.lower_truncation || cell.upper_truncation ? true : false;

    this.lowerTruncation = cell.lower_truncation ? cell.lower_truncation : null;

    this.upperTruncation = cell.upper_truncation ? cell.upper_truncation : null;
  }

  evaluateByLookUpValue(functionArguments: LookUpValue[]): number {
    if (this.interpolationPolynomial) {
      return this.interpolationPolynomial.evaluateByLookUp(functionArguments);
    }
    throw Error("A interpolation polynomium unexpectedly did not exist");
  }

  translateInterpolationVariable(xvariable: string) {
    return this.interpolationVariables[parseVariableNumber(xvariable)];
  }

  lookUpValueToMinLocation(lookup: LookUpValue[]) {
    let res: Location = {};
    lookup.forEach(({ value, index }) => {
      res[this.interpolationVariables[index]] = value;
    });
    return res;
  }

  xNotationToVerboseNotation(oldMinObject: MinObject) {
    //This function substitutes x0, x1, and so on with their factornames
    let newMinLocation: Location = {};
    Object.entries(oldMinObject.minLocation).forEach(([xvariable, val]) => {
      let factorname = this.translateInterpolationVariable(xvariable);
      newMinLocation[factorname] = val;
    });
    return { minValue: oldMinObject.minValue, minLocation: newMinLocation };
  }

  initializeCellMin(
    oldMinObject: MinObject | undefined
  ): LocationAndValue | ReasonsForNoMin {
    if (oldMinObject) {
      let min=new LocationAndValue(this.interpolationVariables, this.nonInterpolationVariables, oldMinObject.minValue);
      min.setWithVarNameButInterpolationX(oldMinObject.minLocation)

    }
    if (this.interpolationPolynomial) {
      //the only reason for no min object to exist here is if a domain is infinite
      return ReasonsForNoMin.INFINITE_INTERVAL;
    }
    if (!this.value) {
      throw Error("A cell is missing both value and interpolation polynomial.");
    }
    let min=new LocationAndValue(this.interpolationVariables, this.nonInterpolationVariables, this.value);
    min.setAllNonInterpolationsWithDomains(this.nonInterpolationDomains);
    return min
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
          return new FixedMin(f, this.interpolationVariables, this.nonInterpolationVariables, fixed);
        }),
      };
    });
  }

  /*
  This function returns true if two conditions are true:
    1. if all the factoranswers specified in nonInterpolationFactorAnswers and interpolationFactorAnswers lie in their respective domain
    2. if all infinite intervals has a fixed factor.
   */
  inCellAndSufficientlyInternal(
    location: Location
  ) {
    let inAllDomains= location.getNonInterpolationValues(KeyOptionsNonInterpolationVariables.INDEX).every(
      ({ value, key }) => {
        return this.nonInterpolationDomains[(key as number)].isInputWithinCell(value);
      }
    );
    if (!inAllDomains) {
      return false;
    }
    inAllDomains = location.getInterpolationValues(KeyOptionsInterpolationVariables.INDEX).every(({ value, key }) => {
      return this.interpolationDomains[(key as number)].isInputWithinCell(value);
    });
    if (!inAllDomains) {
      return false;
    }
    let fixedFactors: string[]=location.getFixedInterpolationVariables()
    return this.infiniteInterpolationVariables.every((varname: string) => {
      return fixedFactors.includes(varname);
    });
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

  extractFixedMinObject(fixedVariableSet: string[]): FixedMin[] {
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
    fixedInterpolationFactorAnswers: LookUpValue[]
  ) {
    const candidates = fixedMinPairs.map((fixedMinObject: FixedMin) => {
      return fixedMinObject.getDiscriminantCandidates(
        fixedInterpolationFactorAnswers,
        this.interpolationDomains
      );
    });
    const candidatesUnpacked = ([] as LookUpValue[][]).concat.apply(
      [],
      candidates
    );
    const computedVals: MinObject[] = candidatesUnpacked.map(
      (l: LookUpValue[]) => {
        const minValue = this.evaluateByLookUpValue(
          l.concat(fixedInterpolationFactorAnswers)
        );
        const minLocation = {
          ...this.lookUpValueToMinLocation(fixedInterpolationFactorAnswers),
          ...this.lookUpValueToMinLocation(l),
        };
        return {
          minValue: minValue,
          minLocation: minLocation,
        };
      }
    );
    computedVals.sort(function (a, b) {
      return a.minValue - b.minValue;
    });
    if (computedVals.length > 0) {
      return computedVals[0];
    }
    return null;
  }

  computeBoundaryCandidates(
    fixedMinPairs: FixedMin[],
    fixedInterpolationFactorAnswers: LookUpValue[]
  ) {
    let candidates = fixedMinPairs.map((fixedMinObject: FixedMin) => {
      return fixedMinObject.getBoundaryMin(fixedInterpolationFactorAnswers);
    });
    const minObjectsUnpacked = ([] as MinObject[]).concat.apply([], candidates);
    minObjectsUnpacked.sort(function (a, b) {
      return a.minValue - b.minValue;
    });
    if (computedVals.length > 0) {
      return computedVals[0];
    }
    return null;
  }

  getMin(fixedInterpolationFactorAnswers: LookUpValue[]): MinObject {
    if (fixedInterpolationFactorAnswers.length === 0) {
      if (this.min === ReasonsForNoMin.INFINITE_INTERVAL) {
        throw Error(
          "A cell has been asked to compute a minimum which it can't provide"
        );
      } else {
        return this.min;
      }
    }
    if (
      fixedInterpolationFactorAnswers.length ===
      this.interpolationVariables.length
    ) {
      return {
        minValue: this.evaluateByLookUpValue(fixedInterpolationFactorAnswers),
        minLocation: this.lookUpValueToMinLocation(
          fixedInterpolationFactorAnswers
        ),
      };
    }
    //In this case it means that we need to look at fixedmins.
    let fixedVariableSet = fixedInterpolationFactorAnswers.map(
      ({ index, value }) => {
        return "x" + index.toString();
      }
    );
    const fixedMinObjects: FixedMin[] = this.extractFixedMinObject(
      fixedVariableSet
    );
    let discriminantCandidate = this.computeDiscriminantCandidates(
      fixedMinObjects,
      fixedInterpolationFactorAnswers
    );
    let boundaryCandidate = this.computeBoundaryCandidates(
      fixedMinObjects,
      fixedInterpolationFactorAnswers
    );
  }
}
