import InterpolationVariableMapping from "./InterpolationVariableMapping";
import { isXVariableName } from "./ParsingFunctions";
import { RiskRatioTableCellInterface } from "./RiskRatioTableCell/RiskRatioTableCellInterface";

export interface VarNameToCoordinate {
  [key: string]: number | string;
}

interface LocationAsKeyValuePairs {
    key: string | number;
    value: string | number;
}

export enum KeyOptionsInterpolationVariables {
  INDEX = "index",
  VAR_NAME = "varName",
  XVAR = "xvar",
}

export enum KeyOptionsNonInterpolationVariables {
  INDEX = "index",
  VAR_NAME = "varName",
}

export default class Location {
  interpolationVariables: InterpolationVariableMapping;
  nonInterpolationVariables: string[];
  variableToCoordinate: VarNameToCoordinate;
  setInterpolationVariables: string[];
  setNonInterpolationVariables: string[];

  constructor(
    interpolationVariables: InterpolationVariableMapping,
    nonInterpolationVariables: string[]
  ) {
    this.interpolationVariables = interpolationVariables;
    this.nonInterpolationVariables = nonInterpolationVariables;
    this.setInterpolationVariables = [];
    this.setNonInterpolationVariables = [];
    this.variableToCoordinate = {};
  }

  getNonInterpolationValues(
    key: KeyOptionsNonInterpolationVariables = KeyOptionsNonInterpolationVariables.VAR_NAME
  ): LocationAsKeyValuePairs[] {
    if (key === KeyOptionsNonInterpolationVariables.VAR_NAME) {
      return this.setNonInterpolationVariables.map((varName: string) => {
        return {
          key: varName,
          value: this.variableToCoordinate[varName],
        };
      });
    } else {
      if (key !== KeyOptionsNonInterpolationVariables.INDEX) {
        throw Error("Illegal input to function");
      }
      return this.setNonInterpolationVariables.map((varName: string) => {
        return {
          key: this.nonInterpolationVariables.indexOf(varName),
          value: this.variableToCoordinate[varName],
        };
      });
    }
  }

  getInterpolationValues(
    key: KeyOptionsInterpolationVariables = KeyOptionsInterpolationVariables.VAR_NAME
  ):LocationAsKeyValuePairs[] {
    if (key === KeyOptionsInterpolationVariables.VAR_NAME) {
      return this.setInterpolationVariables.map((varName: string) => {
        return {
          key: varName,
          value: this.variableToCoordinate[varName],
        };
      });
    } else if (key === KeyOptionsInterpolationVariables.INDEX) {
      return this.setInterpolationVariables.map((varName: string) => {
        return {
          key: this.interpolationVariables.getIndexFromName(varName),
          value: this.variableToCoordinate[varName],
        };
      });
    } else {
      if (key !== KeyOptionsInterpolationVariables.XVAR) {
        throw Error("illegal input to function");
      }
      return this.setInterpolationVariables.map((varName: string) => {
        return {
          key: this.interpolationVariables.getXvarFromName(varName),
          value: this.variableToCoordinate[varName],
        };
      });
    }
  }

  getFixedInterpolationVariables(){
      return this.setInterpolationVariables;
  }

  getFreeUnsetVariableIndex(fixed: string[]){
      //there are both free and set variables. This function returns what is neither (and in the current implementation there should be only one)
    let resIndex=-1
    this.interpolationVariables.indexToName.forEach((varname:string, index: number) => {
        if(!this.setInterpolationVariables.includes(varname) && !fixed.includes(varname)){
            if(resIndex!==-1){
                throw Error("It seems there are more than one free unset variable")
            }
            resIndex=index
        }
    })
    return resIndex;
  }

  getValueFromIndex(index:number){
      const varname=this.interpolationVariables.getRealNameFromIndex(index)
      return this.variableToCoordinate[varname]
  }

  setWithVarNames(dict: VarNameToCoordinate) {
    Object.entries(dict).forEach(([key, value]) => {
      if (this.interpolationVariables.includesVarName(key)) {
        this.setInterpolationVariables.push(key);
      } else if (this.nonInterpolationVariables.includes(key)) {
        this.setNonInterpolationVariables.push(key);
      } else {
        throw Error("An unrecognized key was unexpectedly tried initialized");
      }
      this.variableToCoordinate[key] = value;
    });
  }

  setWithVarNamesWhenMatch(dict: VarNameToCoordinate, matchList: string[]) {
    matchList.forEach((key) => {
      let value = dict[key];
      if (this.interpolationVariables.includesVarName(key)) {
        this.setInterpolationVariables.push(key);
        this.variableToCoordinate[key] = value;
      } else if (this.nonInterpolationVariables.includes(key)) {
        this.setNonInterpolationVariables.push(key);
        this.variableToCoordinate[key] = value;
      }
    });
  }

  setWithVarNameButInterpolationX(dict: VarNameToCoordinate) {
    Object.entries(dict).forEach(([key, value]) => {
      if (isXVariableName(key)) {
        let realVarName = this.interpolationVariables.getRealNameFromXVarName(
          key
        );
        this.setInterpolationVariables.push(realVarName);
        this.variableToCoordinate[realVarName] = value;
      } else if (this.nonInterpolationVariables.includes(key)) {
        this.variableToCoordinate[key] = value;
        this.setNonInterpolationVariables.push(key);
      } else {
        throw Error("An unrecognized key was unexpectedly tried initialized");
      }
    });
  }

  setAllNonInterpolationsWithDomains(listOfDomains: RiskRatioTableCellInterface[]){
      listOfDomains.forEach((domain:RiskRatioTableCellInterface, i:number) => {
        let key=this.nonInterpolationVariables[i]
        this.variableToCoordinate[key] = domain.getValueInCell();
        this.setNonInterpolationVariables.push(key);
      })
  }
}

export class LocationAndValue extends Location {
  value: number;
  constructor(
    interpolationVariables: InterpolationVariableMapping,
    nonInterpolationVariables: string[],
    value: number
  ) {
    super(interpolationVariables, nonInterpolationVariables);
    this.value = value;
  }
}

export function LocationAndValueSorter(
  locAndVal1: LocationAndValue,
  locAndVal2: LocationAndValue
) {
  return locAndVal1.value - locAndVal2.value;
}
