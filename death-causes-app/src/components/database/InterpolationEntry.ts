import { FactorAnswers } from "../../models/Factors";
import { parseStringToInputType, parseStringToPolynomial } from "./ParsingFunctions";
import { Polynomial } from "./Polynomial";
import { RiskRatioTableCellInterface } from "./RiskRatioTableCell/RiskRatioTableCellInterface";

export interface InterpolationTableJson {
    domain: string[];
    factors: string[];
    interpolationPolynomial: string;
    minValue: number | null;
    maxValue: number | null;
}

export class InterpolationEntry {
    domain: RiskRatioTableCellInterface[] = [];
    factors: string[]
    minValue: number| null;
    maxValue: number | null;
    polynomial: Polynomial;

    constructor(inputJson: InterpolationTableJson) {
        inputJson.domain.forEach(element => this.domain.push(parseStringToInputType(element)))
        this.minValue = inputJson.minValue;
        this.maxValue = inputJson.maxValue;
        this.factors = inputJson.factors;
        this.polynomial = parseStringToPolynomial(inputJson.interpolationPolynomial);
    }

    getRelevantFactorAnswers = (sumbittedFactorAnswers: FactorAnswers): (string | number)[] => {
        let res: (string | number)[] = []
        this.factors.forEach(factor => res.push(sumbittedFactorAnswers[factor]))
        return res;
    }

    isFactorAnswersInDomain(relevantFactorAnswers: (string  | number)[]) {
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
        if (this.minValue && res < this.minValue) return this.minValue;
        if (this.maxValue && res > this.maxValue) return this.maxValue; 
        return res;
    }
}