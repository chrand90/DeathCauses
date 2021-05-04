import { FactorAnswers } from "../../models/Factors";
import { InterpolationTable, InterpolationTableJson } from "./InterpolationTable";
import { RiskRatioTableEntry } from "./RiskRatioTableEntry";

export interface RiskRatioTableJson {
    riskFactorNames: string[];
    interpolationTable: InterpolationTableJson;
    riskRatioTable: (string[] | number)[][];
}

export interface MinimumRiskRatios {
    [key: string]: number
}

class RiskRatioTable {
    factorNames: string[];
    riskRatioTable: RiskRatioTableEntry[];
    interpolation: InterpolationTable;

    constructor(json: RiskRatioTableJson) {
        this.factorNames = json.riskFactorNames;
        this.riskRatioTable = json.riskRatioTable.map(element => new RiskRatioTableEntry(element[0] as string[], element[1] as number))
        this.interpolation=new InterpolationTable(json.interpolationTable)
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

export { RiskRatioTable };

