import { parseVariableNumber } from "./ParsingFunctions";

interface ReverseMapping {
    [key:string]: number
}

export default class InterpolationVariableMapping {

    nameToIndex: ReverseMapping;
    indexToName;

    constructor(interpolationVariables: string[]){
        this.indexToName=interpolationVariables;
        this.nameToIndex={};
        this.indexToName.forEach((varname:string, index:number) => {
            this.nameToIndex[varname]=index;
        })
    }

    getRealNameFromIndex(index: number){
        return this.indexToName[index];
    }

    getRealNameFromXVarName(xvar: string){
        const index=parseVariableNumber(xvar);
        return this.getRealNameFromIndex(index);
    }

    getIndexFromName(varname: string){
        return this.nameToIndex[varname];
    }

    getXvarFromName(varname: string){
        return 'x'+this.nameToIndex[varname],toString();
    }

    includesVarName(varName:string):boolean {
        return this.indexToName.includes(varName);
    }
    
}