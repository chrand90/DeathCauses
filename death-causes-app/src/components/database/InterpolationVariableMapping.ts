import { parseVariableNumber } from "./ParsingFunctions";

interface ReverseMapping {
    [key:string]: number
}

interface StringToStringMapping {
    [key:string]: string
}

export default class InterpolationVariableMapping {

    nameToIndex: ReverseMapping;
    indexToName: string[];
    xvarToVarName: StringToStringMapping;

    constructor(interpolationVariables: string[]){
        this.indexToName=interpolationVariables;
        this.nameToIndex={};
        this.xvarToVarName={};
        this.indexToName.forEach((varname:string, index:number) => {
            this.nameToIndex[varname]=index;
            this.xvarToVarName['x'+index]=varname;
        })
    }

    getRealNameFromIndex(index: number){
        return this.indexToName[index];
    }

    getRealNameFromXVarName(xvar: string){
        return this.xvarToVarName[xvar];
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

    getLength(){
        return this.indexToName.length;
    }
    
}