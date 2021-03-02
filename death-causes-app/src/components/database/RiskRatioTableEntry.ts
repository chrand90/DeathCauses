import { parseStringToInputType } from "./ParsingFunctions";
import { RiskRatioTableCellInterface } from "./RiskRatioTableCell/RiskRatioTableCellInterface";

export class RiskRatioTableEntry {
    factorValues: RiskRatioTableCellInterface[];
    riskRatioValue: number;

    constructor(factorValues: string[], riskRatioValue: number) {
        this.riskRatioValue = riskRatioValue;
        this.factorValues = factorValues.map(element => parseStringToInputType(element))
    }

    isFactorAnswersInDomain(relevantFactorAnswers: (string | number)[]) {
        for (let i = 0; i < this.factorValues.length; i++) {
            let isSubmittedFactorAnswerWithinCell = this.factorValues[i].isInputWithinCell(relevantFactorAnswers[i])
            if (!isSubmittedFactorAnswerWithinCell) {
                return false;
            }
        }
        return true;
    }

    isFactorAnswersInDomainExceptOneFactor(factorToMinimize: number, relevantFactorAnswers: (string | number)[]) {
        for (let i = 0; i < this.factorValues.length; i++) {
            if (i === factorToMinimize) {
                continue;
            }
            let isSubmittedFactorAnswerWithinCell = this.factorValues[i].isInputWithinCell(relevantFactorAnswers[i])
            if (!isSubmittedFactorAnswerWithinCell) {
                return false;
            }
        }
        return true;
    }

    isSingleFactorInDomain(factorIndexToFind: number, factorAnswer: (string | number)) {
        if (this.factorValues[factorIndexToFind].isInputWithinCell(factorAnswer)) {
            return true;
        }
        return false;
    }
}
