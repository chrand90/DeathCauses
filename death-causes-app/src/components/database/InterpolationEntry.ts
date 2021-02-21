import { FactorAnswers } from "../../models/Factors";
import { parseStringToInputType, parseStringToPolynomial } from "./ParsingFunctions";
import { Polynomial } from "./Polynomial";
import { RiskRatioTableCellInterface } from "./RiskRatioTableCell/RiskRatioTableCellInterface";

export interface InterpolationTableJson {
    domain: string[];
    factors: string[];
    interpolationPolynomial: string;
    minValue: number;
    maxValue: number;
}

export class InterpolationEntry {
    domain: RiskRatioTableCellInterface[] = [];
    factors: string[]
    minValue: number;
    maxValue: number
    polynomial: Polynomial;

    constructor(inputJson: InterpolationTableJson) {
        inputJson.domain.forEach(element => this.domain.push(parseStringToInputType(element)))
        this.minValue = inputJson.minValue;
        this.maxValue = inputJson.maxValue;
        this.factors = inputJson.factors;
        this.polynomial = parseStringToPolynomial(inputJson.interpolationPolynomial);
    }

    getRelevantFactorAnswers = (sumbittedFactorAnswers: FactorAnswers): (string | boolean | number)[] => {
        let res: (string | boolean | number)[] = []
        this.factors.forEach(factor => res.push(sumbittedFactorAnswers[factor]))
        return res;
    }

    isFactorAnswersInDomain(relevantFactorAnswers: (string | boolean | number)[]) {
        for (let i = 0; i < this.factors.length; i++) {
            let isSubmittedFactorAnswerWithinCell = this.domain[i].isInputWithinCell(relevantFactorAnswers[i])
            if (!isSubmittedFactorAnswerWithinCell) {
                return false;
            }
        }
        return true;
    }

    interpolateRR(submittedFactorAnswers: number[]) {
        let res = this.polynomial.evaluate(submittedFactorAnswers)
        if (res < this.minValue) return this.minValue;
        if (res > this.maxValue) return this.maxValue; 
        return res;
    }
}