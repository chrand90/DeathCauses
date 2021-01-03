import { FactorAnswers } from "../../models/Factors";
import { RiskRatioTableCellData } from "./DataTypes";
import { ParsingFunctions } from "./ParsingFunctions";
import { Polynomial } from "./Polynomial";

export class InterpolationEntry {
    domain: RiskRatioTableCellData[] = [];
    factors: string[]
    minValue: number;
    maxValue: number
    polynomial: Polynomial;

    constructor(domainString: string[], factors: string[], polynomialString: string, minValue: number, maxValue: number) {
        domainString.forEach(element => this.domain.push(ParsingFunctions.parseStringToInputType(element)))
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.factors = factors;
        this.polynomial = ParsingFunctions.parseStringToPolynomial(polynomialString);
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