import { DimensionStatus, UpdateDic } from "../../models/updateFormNodes/UpdateForm";
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

export enum InterpolationKeys {
  INDEX = "index",
  VAR_NAME = "varName",
  XVAR = "xvar",
}

export enum NonInterpolationKeys {
  INDEX = "index",
  VAR_NAME = "varName",
}

interface VarNameToCoordinateWithUndefined {
  [key:string]: number | string | undefined;
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
    key: NonInterpolationKeys = NonInterpolationKeys.VAR_NAME
  ): LocationAsKeyValuePairs[] {
    if (key === NonInterpolationKeys.VAR_NAME) {
      return this.setNonInterpolationVariables.map((varName: string) => {
        return {
          key: varName,
          value: this.variableToCoordinate[varName],
        };
      });
    } else {
      if (key !== NonInterpolationKeys.INDEX) {
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
    key: InterpolationKeys = InterpolationKeys.VAR_NAME
  ):LocationAsKeyValuePairs[] {
    if (key === InterpolationKeys.VAR_NAME) {
      return this.setInterpolationVariables.map((varName: string) => {
        return {
          key: varName,
          value: this.variableToCoordinate[varName],
        };
      });
    } else if (key === InterpolationKeys.INDEX) {
      return this.setInterpolationVariables.map((varName: string) => {
        return {
          key: this.interpolationVariables.getIndexFromName(varName),
          value: this.variableToCoordinate[varName],
        };
      });
    } else {
      if (key !== InterpolationKeys.XVAR) {
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

  getVariableToCoordinate(){
    return this.variableToCoordinate
  }
  

  getFixedInterpolationVariables(key: InterpolationKeys=InterpolationKeys.VAR_NAME){
    if(key===InterpolationKeys.VAR_NAME){
      return this.setInterpolationVariables;
    }
    else if(key===InterpolationKeys.XVAR){
      return this.setInterpolationVariables.map((varname: string) => {
        return this.interpolationVariables.getXvarFromName(varname);
      })
    }
    else if(key===InterpolationKeys.INDEX){
      return this.setInterpolationVariables.map((varname: string) => {
        return this.interpolationVariables.getIndexFromName(varname);
      })
    }  
  }

  getFreeUnsetVariableIndex(fixed: string[]){
      //there are both free and set variables. This function returns what is neither (and in the current implementation there should be only one)
    let resIndex=-1
    this.interpolationVariables.indexToName.forEach((varname:string, index: number) => {
        const xvarname=this.interpolationVariables.getXvarFromName(varname)
        if(!this.setInterpolationVariables.includes(varname) && !fixed.includes(xvarname)){
            if(resIndex!==-1){
                throw Error("It seems there are more than one free unset variable")
            }
            resIndex=index
        }
    })
    return resIndex;
  }

  getNumberOfFixedInterpolationVariables(){
    return this.setInterpolationVariables.length;
  }

  getValueFromIndex(index:number){
      const varname=this.interpolationVariables.getRealNameFromIndex(index)
      return this.variableToCoordinate[varname]
  }

  getValueFromXvar(xvar:string){
    const varname=this.interpolationVariables.getRealNameFromXVarName(xvar)
    return this.variableToCoordinate[varname]
  }

  makeChild(){
    let child= new Location(this.interpolationVariables, this.nonInterpolationVariables)
    child.setWithVarNames(this.variableToCoordinate)
    return child
  }

  makeChildWithValue(value: number): LocationAndValue{
    let child= new LocationAndValue(this.interpolationVariables, this.nonInterpolationVariables, value)
    child.setWithVarNames(this.variableToCoordinate)
    return child;
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

  setWithVarNamesWhenMatch(dict: UpdateDic, ageIndex:number, matchList: string[]) {
    matchList.forEach((key) => {
      let value: string | number;
      if(dict[key].dimension===DimensionStatus.YEARLY){
        value=(dict[key].value as string[] | number[])[ageIndex];
      }
      else{
        value=dict[key].value as string | number;
      }
      if (this.interpolationVariables.includesVarName(key)) {
        this.setInterpolationVariables.push(key);
        this.variableToCoordinate[key] = value;
      } else if (this.nonInterpolationVariables.includes(key)) {
        this.setNonInterpolationVariables.push(key);
        this.variableToCoordinate[key] = value;
      }
    });
  }

  setWithVarNameButInterpolationX(dict: VarNameToCoordinateWithUndefined) {
    Object.entries(dict).forEach(([key, value]) => {
      if (isXVariableName(key) && value!==undefined) {
        let realVarName = this.interpolationVariables.getRealNameFromXVarName(
          key
        );
        this.setInterpolationVariables.push(realVarName);
        this.variableToCoordinate[realVarName] = value;
      } else if (this.nonInterpolationVariables.includes(key) && value) {
        this.variableToCoordinate[key] = value;
        this.setNonInterpolationVariables.push(key);
      } else if(value){
        throw Error("An unrecognized key was unexpectedly tried initialized");
      }
    });
  }

  setWithInterpolationIndex(index: number, value: number){
    const varname=this.interpolationVariables.getRealNameFromIndex(index)
    this.setInterpolationVariables.push(varname)
    this.variableToCoordinate[varname]=value;
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

  getValue(){
    return this.value;
  }

  truncateValue(lowerTruncation: number | null, upperTruncation: number | null){
    if(lowerTruncation){
      this.value=Math.max(lowerTruncation, this.value);
    }
    if(upperTruncation){
      this.value=Math.min(upperTruncation, this.value);
    }
  }
}

export function locationAndValueSorter(
  locAndVal1: LocationAndValue,
  locAndVal2: LocationAndValue
) {
  return locAndVal1.value - locAndVal2.value;
}

export function addValueToLocation(location: Location, value: number): LocationAndValue{
  let res = new LocationAndValue(location.interpolationVariables, location.nonInterpolationVariables, value);
  res.variableToCoordinate= location.variableToCoordinate; //make it point to the same object. 
  return res;
}
