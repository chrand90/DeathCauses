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

export interface MinimumRiskRatios {
    [key: string]: number
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

    getMinimumRRForSingleFactor(submittedFactorAnswers: FactorAnswers, factorToMinimize: string): number  {
        let indexOfFactor = this.factorNames.indexOf(factorToMinimize)
        if (indexOfFactor === -1) {
            return 1;
        }

        let riskRatiosToMinimize = this.riskRatioTable.filter(rrt => {
                return rrt.isSingleFactorInDomain(indexOfFactor, submittedFactorAnswers[factorToMinimize])
            })
            .map(rte => rte.riskRatioValue)

        return Math.min(...riskRatiosToMinimize)
    }

    // getMinimumRRForFactor(submittedFactorAnswers: FactorAnswers): MinimumRiskRatios {
    //     let relevantFactorAnswers = this.getRelevantFactorAnswers(submittedFactorAnswers);
    //     let res: MinimumRiskRatios = {}
    //     let riskRatiosToMinimize = []
    //     for (let factorIndex = 0; factorIndex < this.factorNames.length; factorIndex++) {
    //         for (let i = 0; i < this.riskRatioTable.length; i++) {
    //             if (this.riskRatioTable[i].isFactorAnswersInDomainExceptOneFactor(factorIndex, relevantFactorAnswers)) {
    //                 riskRatiosToMinimize.push(this.riskRatioTable[i].riskRatioValue)
    //             }
    //         }
    //         let minRR = Math.min(...riskRatiosToMinimize)
    //         let factorname = this.factorNames[factorIndex]
    //         res[factorname] = minRR
    //     }
    //     return res;
    // }

    getMinimumRR() {
        let riskRatioValues = this.riskRatioTable.map(rrte => rrte.riskRatioValue)
        return Math.min(...riskRatioValues)
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

    // getMinimumRRForFactor2(submittedFactorAnswers: FactorAnswers) {
    //     let factorIndex = 1;
    //     let factorName = this.factorNames[factorIndex]
    //     this.riskRatioTable.filter(rrt => rrt.isSingleFactorInDomain(factorIndex, submittedFactorAnswers[factorName]))
    //         .map(rre => rre.riskRatioValue)
    //         .reduce((prev, curr) => prev < curr ? prev : curr)

    // }

    getRiskRatio(submittedFactorAnswers: FactorAnswers): number {
        let relevantFactorAnswers = this.getRelevantFactorAnswers(submittedFactorAnswers);
        for (let i = 0; i < this.riskRatioTable.length; i++) {
            if (this.riskRatioTable[i].isFactorAnswersInDomain(relevantFactorAnswers)) {
                return this.riskRatioTable[i].riskRatioValue;
            }
        }

        throw new Error("Found no risk ratio entry where " + submittedFactorAnswers + " is within domain")
    }

    private getRelevantFactorAnswers = (sumbittedFactorAnswers: FactorAnswers): (string | boolean | number)[] => {
        let res: (string | boolean | number)[] = []
        this.factorNames.forEach(factor => res.push(sumbittedFactorAnswers[factor]))
        return res;
    }

    getInterpolatedRiskRatio(submittedFactorAnswers: FactorAnswers): number {
        let relevantFactorAnswers = this.getRelevantFactorAnswers(submittedFactorAnswers);

        for (let index = 0; index < this.interpolation.length; index++) {
            let interpolationEntry = this.interpolation[index];
            let relevantInterpolationFactorAnswers = interpolationEntry.getRelevantFactorAnswers(submittedFactorAnswers) as number[];
            if (interpolationEntry.isFactorAnswersInDomain(relevantFactorAnswers)) {
                return interpolationEntry.interpolateRR(relevantInterpolationFactorAnswers);
            }

        }

        return 1;
    }
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
            let isSubmittedFactorAnswerWithinCell = this.factorValues[i].isInputWithinCell(relevantFactorAnswers[i])
            if (!isSubmittedFactorAnswerWithinCell) {
                return false;
            }
        }
        return true;
    }

    isFactorAnswersInDomainExceptOneFactor(factorToMinimize: number, relevantFactorAnswers: (string | boolean | number)[]) {
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

    isSingleFactorInDomain(factorIndexToFind: number, factorAnswer: (string | boolean | number)) {
        if (this.factorValues[factorIndexToFind].isInputWithinCell(factorAnswer)) {
            return true;
        }
        return false;
    }
}


export { RiskRatioTable, RiskRatioTableEntry };

