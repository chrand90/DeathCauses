import { FactorAnswers } from "../../models/Factors";
import { parseStringToInputType, parseStringToPolynomial } from "./ParsingFunctions";
import { Polynomial } from "./Polynomial";
import { RiskRatioTableCellInterface } from "./RiskRatioTableCell/RiskRatioTableCellInterface";
import InterpolationTableCell, {MinObjectJson, InterpolationTableCellJson} from "./InterpolationTableCell";

interface VariableToIndex {
    [key:string]: number
}

export interface InterpolationTableJson {
    cells: InterpolationTableCellJson[],
    lower_truncation?: number | null,
    upper_truncation?: number | null,
    global_min: MinObjectJson,
    interpolation_variables?: string[],
    non_interpolation_variables?: string[]
}

export class InterpolationEntry {
    cells: InterpolationTableCell[] = [];
    nonInterpolationVariables: string[]
    interpolationVariables: string[];
    globalMin: MinObjectJson;
    lowerTruncation: number | null;
    upperTruncation: number | null;


    constructor(inputJson: InterpolationTableJson) {

        inputJson.cells.forEach(element => this.cells.push(new InterpolationTableCell(element)));
        this.nonInterpolationVariables= inputJson.non_interpolation_variables ? inputJson.non_interpolation_variables : []
        this.interpolationVariables= inputJson.interpolation_variables ? inputJson.interpolation_variables : []
        this.globalMin= inputJson.global_min
        this.lowerTruncation= inputJson.lower_truncation ? inputJson.lower_truncation : null
        this.upperTruncation= inputJson.upper_truncation ? inputJson.upper_truncation : null
    }

    getMinimumRR(submittedFactorAnswers: FactorAnswers, fixedFactors: string[]): MinObjectJson {
        if(fixedFactors.length === 0){
            return this.globalMin
        }
        const fixedNonInterpolationFactors= fixedFactors.map((f:string) => {
            return {index: this.nonInterpolationVariables.indexOf(f), value: submittedFactorAnswers[f]}
        });
        const fixedInterpolationFactors= fixedFactors.map((f:string) => {
            return {index: this.interpolationVariables.indexOf(f), value: submittedFactorAnswers[f]}
        });
        let mins=this.cells.filter((cell: InterpolationTableCell) => {
            return cell.inCell(fixedNonInterpolationFactors, fixedInterpolationFactors)
        }).map( (cell: InterpolationTableCell) => {
            return cell.getMin(fixedInterpolationFactors)
        })
        mins.sort(function(a,b){
            return a.min_value-b.min_value
        })
        return mins[0]
    }


    getMinimumRRFactors() {
        let riskRatioValues = this.riskRatioTable.map(rrte => rrte.riskRatioValue)
        let minimumIndex = riskRatioValues.indexOf(Math.min(...riskRatioValues))
        let minRrte = this.riskRatioTable[minimumIndex]
        let res: any = {}
        this.factorNames.forEach((value, index) =>
            res[value] = minRrte.factorValues[index]
        )
        return res
    }

    getRiskRatio(submittedFactorAnswers: FactorAnswers): number {
        let relevantFactorAnswers = this.getRelevantFactorAnswers(submittedFactorAnswers);
        for (let i = 0; i < this.riskRatioTable.length; i++) {
            if (this.riskRatioTable[i].isFactorAnswersInDomain(relevantFactorAnswers)) {
                return this.riskRatioTable[i].riskRatioValue;
            }
        }
        return this.riskRatioTable[this.riskRatioTable.length-1].riskRatioValue; // tmp to make it run

        throw new Error("Found no risk ratio entry where " + submittedFactorAnswers + " is within domain")
    }

    private getRelevantFactorAnswers = (sumbittedFactorAnswers: FactorAnswers): (string  | number)[] => {
        let res: (string  | number)[] = []
        this.factorNames.forEach(factor => res.push(sumbittedFactorAnswers[factor]))
        return res;
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