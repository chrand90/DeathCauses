import { FactorAnswers } from "../../models/Factors";
import { DimensionStatus, MissingStatus, TypeStatus, UpdateDic, UpdateForm } from "../../models/updateFormNodes/UpdateForm";
import { ERROR_COLOR } from "../Question";
import { InterpolationTable, InterpolationTableJson } from "./InterpolationTable";
import { RiskRatioTableEntry } from "./RiskRatioTableEntry";

export interface SpecialFactorTableJson {
    riskRatioTable: (string[] | number)[][];
    riskFactorNames: string[];
}

export interface RiskRatioTableJson {
    riskFactorNames: string[];
    interpolationTable: InterpolationTableJson;
    riskRatioTable: (string[] | number)[][];
}

export interface MinimumRiskRatios {
    [key: string]: number
}

class SpecialFactorTable {
    factorNames: string[];
    riskRatioTable: RiskRatioTableEntry[];

    constructor(json: SpecialFactorTableJson) {
        this.factorNames = json.riskFactorNames;
        this.riskRatioTable = json.riskRatioTable.map(element => new RiskRatioTableEntry(element[0] as string[], element[1] as number, element[2] as number))
    }

    // getMinimumRRForSingleFactor(submittedFactorAnswers: FactorAnswers, factorToMinimize: string): number {
    //     let fixedFactors=[factorToMinimize]
    //     const noMissing=fixedFactors.every((factorName) => {
    //         return submittedFactorAnswers[factorName]!==undefined && submittedFactorAnswers[factorName]!==""
    //     })
    //     if(noMissing){
    //         return Math.max(0,this.interpolation.getMinimumRR(submittedFactorAnswers, fixedFactors).getValue());
    //     }
    //     return 1.0
    // }

    // getMinimumRR() {
    //     let fixedFactors:string[]=[]
    //     return Math.max(0,this.interpolation.getMinimumRR({}, fixedFactors).getValue());
    // }

    // getMinimumRRFactors() {
    //     let fixedFactors:string[]=[]
    //     return this.interpolation.getMinimumRR({}, fixedFactors).getVariableToCoordinate()
    // }

/*     getRiskRatio(submittedFactorAnswers: FactorAnswers): number {
        let fixedFactors:string[]= this.factorNames
        const noMissing=fixedFactors.every((factorName) => {
            return submittedFactorAnswers[factorName]!==undefined && submittedFactorAnswers[factorName]!==""
        })
        if(noMissing){
            return Math.max(0,this.interpolation.getMinimumRR(submittedFactorAnswers, fixedFactors).getValue());
        }
        return 1.0
    } */

    getFactorNameToIndex(){
        return Object.fromEntries(
            this.factorNames.map((f,i) => {
                return [f,i]
            })
        )
    }

    getType(factorName:string):TypeStatus{
        for(let i=0; i<this.factorNames.length; i++){
            if(this.factorNames[i]===factorName){
                //we can ask any row in the riskratiotable because either can give the type
                return this.riskRatioTable[0].getType(i);
            }
        }
        throw Error("The factorName: "+factorName+ " was not found")
    }

    getFactorNames(){
        return this.factorNames;
    }

    getFactorNamesWithoutAge(){
        return this.factorNames.filter((d:string) => {
            return d!=="Age";
        });
    }

    private getRelevantFactorAnswers = (sumbittedFactorAnswers: FactorAnswers): (string  | number)[] => {
        let res: (string  | number)[] = []
        this.factorNames.forEach(factor => res.push(sumbittedFactorAnswers[factor]))
        return res;
    }


}

class RiskRatioTable extends SpecialFactorTable {

    interpolation: InterpolationTable;
    constructor(json: RiskRatioTableJson){
        super(json);  
        this.interpolation=new InterpolationTable(json.interpolationTable)
    }
}

export { RiskRatioTable, SpecialFactorTable };

