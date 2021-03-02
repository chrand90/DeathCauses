import { FactorAnswers } from "../../models/Factors";
import { InterpolationEntry, InterpolationTableJson } from "./InterpolationEntry";
import { RiskRatioTableEntry } from "./RiskRatioTableEntry";

export interface RiskRatioTableJson {
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

    constructor(json: RiskRatioTableJson) {
        this.factorNames = json.riskFactorNames;
        this.riskRatioTable = json.riskRatioTable.map(element => new RiskRatioTableEntry(element[0] as string[], element[1] as number))
        json.interpolationTable.forEach(element => {
            return this.interpolation.push(new InterpolationEntry(element))
        });
    }

    getMinimumRRForSingleFactor(submittedFactorAnswers: FactorAnswers, factorToMinimize: string): number {
        let indexOfFactor = this.factorNames.indexOf(factorToMinimize)
        if (indexOfFactor === -1) {
            return 1;
        }

        let riskRatiosToMinimize = this.riskRatioTable.filter(rrt => {
            return rrt.isSingleFactorInDomain(indexOfFactor, submittedFactorAnswers[factorToMinimize])
        }).map(rte => rte.riskRatioValue)

        return Math.min(...riskRatiosToMinimize)
    }

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

export { RiskRatioTable };

