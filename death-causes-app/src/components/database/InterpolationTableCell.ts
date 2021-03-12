import { FactorAnswers } from "../../models/Factors";
import { parseStringToInputType } from "./ParsingFunctions";
import { RiskRatioTableCellInterface } from "./RiskRatioTableCell/RiskRatioTableCellInterface";

export interface MinObjectJson {
  min_value: number;
  min_location: LocationJson;
}

export interface MinObjectJson {
    minValue: number;
    minLocation: LocationJson;
  }

export interface LookUpValue {
    value: string | number;
    index: number;
}

interface LocationJson {
  [key: string]: number | string;
}

interface LocationJsonOnlyNumeric {
  [key: string]: number | string;
}

interface FixedMinObjectJson {
  fixed: string[];
  mins: FixedMinObjectJsonForFixedVariable[];
}

interface FixedMinObjectJsonForFixedVariable {
  values: LocationJsonOnlyNumeric;
  discriminant: string[][];
}

export interface InterpolationTableCellJson {
  interpolation_domains?: string[];
  non_interpolation_domains?: string[];
  value?: number;
  interpolation_polynomial?: string;
  min?: MinObjectJson;
  fixed_mins?: FixedMinObjectJson;
  lower_truncation?: number | null;
  upper_truncation?: number | null;
}

export default class InterpolationTableCell {
  interpolationDomains: RiskRatioTableCellInterface[];
  nonInterpolationDomains: RiskRatioTableCellInterface[];
  value: number | undefined;
  interpolationPolynomial: string | undefined;
  min: MinObjectJson | undefined;
  translatedMin: MinObjectJson;
  fixedMins: FixedMinObjectJson | undefined;
  truncate: boolean;
  lowerTruncation: number | null;
  upperTruncation: number | null;
  interpolationVariables: string[];
  nonInterpolationVariables: string[];

  constructor(cell: InterpolationTableCellJson, interpolationVariables:string[], nonInterpolationVariables:string[]) {
    this.interpolationVariables=interpolationVariables
    this.nonInterpolationVariables=nonInterpolationVariables
    this.interpolationDomains = cell.interpolation_domains
      ? this.initDomains(cell.interpolation_domains)
      : [];

    this.nonInterpolationDomains = cell.non_interpolation_domains
      ? this.initDomains(cell.non_interpolation_domains)
      : [];

    this.value = cell.value ? cell.value : undefined;

    this.interpolationPolynomial = cell.interpolation_polynomial
      ? cell.interpolation_polynomial
      : undefined;

    this.min = cell.min ? cell.min : undefined;

    this.fixedMins = cell.fixed_mins ? cell.fixed_mins : undefined;

    this.truncate =
      cell.lower_truncation || cell.upper_truncation ? true : false;

    this.lowerTruncation = cell.lower_truncation
      ? cell.lower_truncation
      : null;

    this.upperTruncation = cell.upper_truncation
      ? cell.upper_truncation
      : null;

      this.translatedMin=this.translatedMin()
  }

  translatedMin(){
      for()
  }

  inCell(nonInterpolationFactorAnswers: LookUpValue[], interpolationFactorAnswers: LookUpValue[]){
      let inAllDomains= nonInterpolationFactorAnswers.every(({value, index}) => {
        return this.nonInterpolationDomains[index].isInputWithinCell(value)
      })
      if(!inAllDomains){
          return false;
      }
      return interpolationFactorAnswers.every(({value, index}) => {
        return this.interpolationDomains[index].isInputWithinCell(value)
      })

  }

  initDomains(stringlist: string[]) {
    return stringlist.map((s: string) => {
      return parseStringToInputType(s);
    });
  }

  obtainNonInterpolationLocation(){
      let res: LocationJson={};
      this.nonInterpolationDomains.forEach((d,i) =>{
          res[]
      })
  }

  getMin(fixedInterpolationFactorAnswers: LookUpValue[]):MinObjectJson{
    if(fixedInterpolationFactorAnswers.length===0){
        if(this.min){
            return this.min
        }
        else if(this.value){
            return {min_value:this.value, min_location: this.obtainNonInterpolationLocation()};
        }
    }
  }
}
