import { UpdateDic } from "../../models/updateFormNodes/UpdateForm";
import { parseStringToInputType } from "./ParsingFunctions";
import { RiskRatioTableCellInterface } from "./RiskRatioTableCell/RiskRatioTableCellInterface";

export class RiskRatioTableEntry {
    factorValues: RiskRatioTableCellInterface[];
    riskRatioValue: number;
    frequency: number;

    constructor(factorValues: string[], riskRatioValue: number, frequency: number) {
        this.riskRatioValue = riskRatioValue;
        this.frequency = frequency;
        this.factorValues = factorValues.map(element => parseStringToInputType(element))
    }

    getType(factorIndex: number){
        return this.factorValues[factorIndex].getType()
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
