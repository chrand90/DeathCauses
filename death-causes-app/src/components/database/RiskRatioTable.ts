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
        console.log(json.interpolationTable)
        this.interpolation=new InterpolationTable(json.interpolationTable)
    }

    getMinimumRRForSingleFactor(submittedFactorAnswers: FactorAnswers, factorToMinimize: string): number {
        let fixedFactors=this.factorNames.filter((d) => { 
            return d!==factorToMinimize
        });
        const noMissing=fixedFactors.every((factorName) => {
            return submittedFactorAnswers[factorName]!==undefined && submittedFactorAnswers[factorName]!==""
        })
        if(noMissing){
            return this.interpolation.getMinimumRR(submittedFactorAnswers, fixedFactors).getValue();
        }
        return 1.0
    }

    getMinimumRR() {
        let fixedFactors:string[]=[]
        return this.interpolation.getMinimumRR({}, fixedFactors).getValue();
    }

    getMinimumRRFactors() {
        let fixedFactors:string[]=[]
        return this.interpolation.getMinimumRR({}, fixedFactors).getVariableToCoordinate()
    }

    getRiskRatio(submittedFactorAnswers: FactorAnswers): number {
        let fixedFactors:string[]= this.factorNames
        const noMissing=fixedFactors.every((factorName) => {
            return submittedFactorAnswers[factorName]!==undefined && submittedFactorAnswers[factorName]!==""
        })
        if(noMissing){
            return this.interpolation.getMinimumRR(submittedFactorAnswers, fixedFactors).getValue();
        }
        return 1.0
    }

    private getRelevantFactorAnswers = (sumbittedFactorAnswers: FactorAnswers): (string  | number)[] => {
        let res: (string  | number)[] = []
        this.factorNames.forEach(factor => res.push(sumbittedFactorAnswers[factor]))
        return res;
    }

    // getInterpolatedRiskRatio(submittedFactorAnswers: FactorAnswers): number {
    //     let relevantFactorAnswers = this.getRelevantFactorAnswers(submittedFactorAnswers);

    //     for (let index = 0; index < this.interpolation.length; index++) {
    //         let interpolationEntry = this.interpolation[index];
    //         let relevantInterpolationFactorAnswers = interpolationEntry.getRelevantFactorAnswers(submittedFactorAnswers) as number[];
    //         if (interpolationEntry.isFactorAnswersInDomain(relevantFactorAnswers)) {
    //             return interpolationEntry.interpolateRR(relevantInterpolationFactorAnswers);
    //         }

    //     }

    //     return 1;
    // }
}

export { RiskRatioTable };

