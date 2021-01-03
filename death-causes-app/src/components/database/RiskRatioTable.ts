import Factors, { FactorAnswers } from "../../models/Factors";
import { RiskRatioTableCellData } from "./DataTypes";
import { InterpolationEntry } from "./InterpolationEntry";
import { ParsingFunctions } from "./ParsingFunctions";

export interface InterpolationTableJson {
    domain: string[];
    factors: string[];
    interpolationPolynomial: string;
    minValue: number;
    maxValue: number;
}

export interface RiskRatioTableInput {
    riskFactorNames: string[];
    interpolationTable: InterpolationTableJson[];
    riskRatioTable: (string[] | number)[][];
}

class RiskRatioTable {
    factorNames: string[];
    riskRatioTable: RiskRatioTableEntry[];
    interpolation: InterpolationEntry[] = [];

    constructor(json: RiskRatioTableInput) {
        this.factorNames = json.riskFactorNames;
        this.riskRatioTable = json.riskRatioTable.map(element => new RiskRatioTableEntry(element[0] as string[], element[1] as number))
        json.interpolationTable.forEach(element => {
            return this.interpolation.push(new InterpolationEntry(element.domain, element.factors, element.interpolationPolynomial, element.minValue, element.maxValue))
        });
    }

    getRiskRatio(submittedFactorAnswers: FactorAnswers): number {
        let relevantFactorAnswers = this.getRelevantFactorAnswers(submittedFactorAnswers);
        this.riskRatioTable.forEach(element => {
            if(element.isFactorAnswersInDomain(relevantFactorAnswers)) {
                return element.riskRatioValue;
            }
        })
        throw new Error("Found no risk ratio entry where " + submittedFactorAnswers + " is within domain")
    }

    private getRelevantFactorAnswers = (sumbittedFactorAnswers: FactorAnswers): (string | boolean | number)[] => {
        let res: (string | boolean | number)[] = []
        this.factorNames.forEach(factor => res.push(sumbittedFactorAnswers[factor]))
        return res;
    }

    getInterpolatedRiskRatio(submittedFactorAnswers: FactorAnswers){        
        let relevantFactorAnswers = this.getRelevantFactorAnswers(submittedFactorAnswers);
        
        this.interpolation.forEach(interpolationEntry => {
            let relevantInterpolationFactorAnswers = interpolationEntry.getRelevantFactorAnswers(submittedFactorAnswers) as number[];
            if(interpolationEntry.isFactorAnswersInDomain(relevantFactorAnswers)) {
                return interpolationEntry.interpolateRR(relevantInterpolationFactorAnswers);
            }
        })}
}

class RiskRatioTableEntry {
    factorValues: RiskRatioTableCellData[];
    riskRatioValue: number;

    constructor(factorValues: string[], riskRatioValue: number) {
        this.riskRatioValue = riskRatioValue;
        this.factorValues = factorValues.map(element => ParsingFunctions.parseStringToInputType(element))
    }

    isFactorAnswersInDomain(relevantFactorAnswers: (string | boolean | number)[]) {
        for (let i = 0; i < this.factorValues.length; i++) {
            let isSubmittedFactorAnswerWithinCell =  this.factorValues[i].isInputWithinCell(relevantFactorAnswers[i])
            if (!isSubmittedFactorAnswerWithinCell) {
                return false;
            }
        }
        return true;
    }
}



export { RiskRatioTable, RiskRatioTableEntry };

