import { getEffectiveTypeRoots } from "typescript";
import { FactorAnswers } from "../../models/Factors";
import { ProbabilityKeyValue } from "../../models/ProbabilityKeyValue";
import DeathCause from "../database/Deathcause";
import { ProbabilitiesOfAllDeathCauses, ProbabilityOfDeathCause } from "../database/ProbabilityResult";
import { RiskFactorGroup } from "../database/RickFactorGroup";
import { MinimumRiskRatios } from "../database/RiskRatioTable";
import { RiskRatioTableCellInterface } from "../database/RiskRatioTableCell/RiskRatioTableCellInterface";
import { DataRow } from "../PlottingData";
import { SurvivalCurveData } from "./SurvivalCurveData";
import calculateInnerProbabilities from './DebtInheritance';
import RelationLinks from "../../models/RelationLinks";

interface InnerCausesForAllAges {
    [key: string]: DataRow[]
}

interface MinimumFactorInputs {
    [key: string]: RiskRatioTableCellInterface
}

interface UStar {
    propForDeathcause: number,
    minProbForDeathcause: number,
    minFactorValues: FactorAnswers;
}

export class RiskRatioCalculationService {
    rdat: RelationLinks;

    constructor(rdat: RelationLinks){
        this.rdat=rdat;
    }

    private readonly MAX_AGE = 120;

    calculateSurvivalCurve(submittedFactorAnswers: FactorAnswers, deathcauses: DeathCause[]): SurvivalCurveData[] {
        let probabilitiesPerDeathCause = this.calculateProbabilitiesOfDeathCauses(submittedFactorAnswers, deathcauses)
        let deathCauseProbabilities = probabilitiesPerDeathCause.probabilitiesOfAllDeathCauses.map(x => x.probabiltiesOfDeathCause)

        let totalProbabilityOfNotDying: number[] = Array.from({ length: probabilitiesPerDeathCause.ages.length })
        totalProbabilityOfNotDying = totalProbabilityOfNotDying.map((_, i) => deathCauseProbabilities.map(val => val[i]).reduce((sum, x) => sum + x, 0))
            .map(x => 1 - x)

        let res: SurvivalCurveData[] = []
        let survivalCurve = Array.from({ length: totalProbabilityOfNotDying.length - 1 }, () => 1)
        for (let i = 1; i < totalProbabilityOfNotDying.length; i++) {
            survivalCurve[i] = survivalCurve[i - 1] * totalProbabilityOfNotDying[i]
            res.push({ age: probabilitiesPerDeathCause.ages[i], prob: survivalCurve[i] })
        }

        return res
    }

    calculateProbabilitiesOfDeathCauses(submittedFactorAnswers: FactorAnswers, deathcauses: DeathCause[]): ProbabilitiesOfAllDeathCauses {
        let currentAge: number = +submittedFactorAnswers['Age']
        let ageRange: number[] = this.getAgeRange(currentAge);

        let probabilityOfDeathcause: ProbabilityOfDeathCause[] = []
        for (var deathcause of deathcauses) {
            let probabilties = this.calculateProbForSingleCauseAndAllAges(submittedFactorAnswers, ageRange, deathcause);
            probabilityOfDeathcause.push(this.createProbabilityOfDeathCauseObject(deathcause.deathCauseName, probabilties));
        }

        let probabilityResultForAllCauses: ProbabilitiesOfAllDeathCauses = { probabilitiesOfAllDeathCauses: probabilityOfDeathcause, ages: ageRange }
        return probabilityResultForAllCauses;
    }

    private getAgeRange(currentAge: number): number[] {
        return Array.from({ length: this.MAX_AGE - currentAge + 1 }, (_, i) => i + currentAge);
    }

    private createProbabilityOfDeathCauseObject(deathCauseName: string, probabilityOfDeathcause: number[]): ProbabilityOfDeathCause {
        return { deathCause: deathCauseName, probabiltiesOfDeathCause: probabilityOfDeathcause };
    }

    private calculateProbForSingleCauseAndAllAges(submittedFactorAnswers: FactorAnswers, ageRange: number[], deathcause: DeathCause): number[] {
        let probabilities: number[] = []
        ageRange.forEach(age => {
            let probability = this.calculateProbabilityForSingleCauseAndAge(submittedFactorAnswers, age, deathcause)
            probabilities.push(probability);
        })
        return probabilities
    }

    private calculateProbabilityForSingleCauseAndAge(factorAnswers: FactorAnswers, selectedAge: number, deathcause: DeathCause): number {
        let agePrevalence = deathcause.ages.getPrevalence(selectedAge);
        let res = 1;
        deathcause.riskFactorGroups.forEach(riskFactorGroup =>
            res = res * this.calculateProbabilityOfRiskFactorGroup(factorAnswers, riskFactorGroup, selectedAge)
        )
        return agePrevalence * res;
    }

    private calculateProbabilityOfRiskFactorGroup(factorAnswers: FactorAnswers, riskFactorGroup: RiskFactorGroup, age: number): number {
        const riskFactorGroupFactors = Array.from(riskFactorGroup.getAllFactorsInGroup().values())

        for (let i = 0; i < riskFactorGroup.getAllFactorsInGroup().size; i++) {
            const factor = riskFactorGroupFactors[i]
            if (factorAnswers[factor] === '') {
                return 1;
            }
        }

        let res = 1;
        riskFactorGroup.riskRatioTables.forEach(riskRatioTable => {
            let factor=riskRatioTable.getRiskRatio(factorAnswers)
            if(factor<0){
                console.log("factor: "+factor.toString())
            }
            res = res * factor
        });
        return res / riskFactorGroup.normalisationFactors.getPrevalence(age)
    }

    calculateInnerProbabilitiesForAllCausesAndAges(factorAnswersSubmitted: FactorAnswers, deathCauses: DeathCause[]): DataRow[] {
        let innerCausesForAllAges: InnerCausesForAllAges = {}
        let currentAge = +factorAnswersSubmitted['Age'] as number
        let ageRange = this.getAgeRange(currentAge)
        let currentProbOfBeingAlive = 1;
        let totalProbOfDying = 0;

        deathCauses.forEach(d => innerCausesForAllAges[d.deathCauseName] = [])

        ageRange.forEach(age => {
            let factorAnswersSubmittedUpdated = { ...factorAnswersSubmitted }
            factorAnswersSubmittedUpdated['Age'] = age
            let innerCausesForAges: DataRow[] = []

            deathCauses.forEach(deathCause => {
                innerCausesForAges.push(calculateInnerProbabilities(factorAnswersSubmittedUpdated, deathCause, this.rdat))
            })

            totalProbOfDying = innerCausesForAges.map(it => it.totalProb).reduce((first, second) => first + second, 0)

            innerCausesForAges.forEach(innerCause => innerCause.totalProb *= currentProbOfBeingAlive)

            currentProbOfBeingAlive *= 1 - Math.min(1,totalProbOfDying)

            innerCausesForAges.forEach(innerCause => {
                innerCausesForAllAges[innerCause.name].push(innerCause)
            })

        })

        let res: DataRow[] = []
        for (let key of Object.keys(innerCausesForAllAges)) {
            res.push(this.combineMultipleInnerCauses(innerCausesForAllAges[key]))
        }
        return res;
    }

    private combineMultipleInnerCauses(innerCauses: DataRow[]): DataRow {
        let sum = innerCauses.map(innerCause => innerCause.totalProb).reduce((first, second) => first + second, 0)
        let deathCauseName = innerCauses[0].name

        let factors = Object.keys(innerCauses[0].innerCauses)

        if (sum === 0) {
            let emptyInnerCause: ProbabilityKeyValue = {}
            for (let factor of factors) {
                emptyInnerCause[factor]=0
            }
            return { name: deathCauseName, totalProb: 0, innerCauses: emptyInnerCause }
        }

        let combinedInnerCause: ProbabilityKeyValue = {}

        for (let factor of factors) {
            combinedInnerCause[factor] = 0
            innerCauses.forEach(innerCause => {
                combinedInnerCause[factor] += innerCause.totalProb * innerCause.innerCauses[factor] / sum
            })
        }

        return { name: deathCauseName, totalProb: sum, innerCauses: combinedInnerCause }
    }



    // calculateInnerProbabilities(factorAnswersSubmitted: FactorAnswers, deathcause: DeathCause): DataRow {
    //     let uStar = this.calculateUStar(factorAnswersSubmitted, deathcause);
    //     let firstOrderDecomposition = this.calculateFirstOrderDecomposition(factorAnswersSubmitted, deathcause);

    //     let ratio
    //     if (uStar.propForDeathcause < 1e-12) {
    //         ratio = 0
    //     } else {
    //         ratio = Math.max(0,uStar.propForDeathcause - uStar.minProbForDeathcause) / uStar.propForDeathcause
    //     }
    //     let innerCauses: ProbabilityKeyValue = {}
    //     for (let key of Object.keys(firstOrderDecomposition)) {
    //         innerCauses[key] = firstOrderDecomposition[key] * ratio
    //     }

    //     let res = {
    //         name: deathcause.deathCauseName,
    //         totalProb: uStar.propForDeathcause,
    //         innerCauses: innerCauses
    //     }

    //     return res
    // }

    // private calculateUStar(factorAnswersSubmitted: FactorAnswers, deathcause: DeathCause): UStar {
    //     let probForDeathcause = this.calculateProbabilityForSingleCauseAndAge(factorAnswersSubmitted, factorAnswersSubmitted['Age'] as number, deathcause)
    //     let minimumFactorInputs: FactorAnswers = {}
    //     deathcause.riskFactorGroups.forEach(rfg => {
    //         rfg.riskRatioTables.forEach(rrt => {
    //             //checking for missing:
    //             const noMissing=rrt.getFactorNames().every( (factorName:string) => {
    //                 return factorAnswersSubmitted[factorName]!==""
    //             })
    //             if(noMissing){
    //                 minimumFactorInputs = { ...minimumFactorInputs, ...rrt.getMinimumRRFactors() }
    //             }
    //             else{
    //                 rrt.getFactorNames().forEach( (factorName:string) => {
    //                     minimumFactorInputs[factorName]=""
    //                 })
    //             }
    //         })
    //     })

    //     let minProbForDeathcause = this.calculateProbabilityForSingleCauseAndAge(minimumFactorInputs, factorAnswersSubmitted['Age'] as number, deathcause)

    //     return { propForDeathcause: probForDeathcause, minProbForDeathcause: minProbForDeathcause, minFactorValues: minimumFactorInputs }
    // }

    // private calculateFirstOrderDecomposition(factorAnswersSubmitted: FactorAnswers, deathcause: DeathCause): ProbabilityKeyValue {
    //     let res: ProbabilityKeyValue = {}
    //     for (let rfg of deathcause.riskFactorGroups) {
    //         let rfgRes = this.calculateFirstOrderDecompositionForRiskFactorGroup(factorAnswersSubmitted, rfg);
    //         res = { ...res, ...rfgRes };
    //     }

    //     let sum = 0;
    //     for (let key of Object.keys(res)) {
    //         sum += res[key];
    //     }
    //     for (let key of Object.keys(res)) {
    //         if (sum === 0) {
    //             res[key] = 1 / Object.keys(res).length
    //         } else {
    //             res[key] = res[key] / sum;
    //         }
    //     }

    //     return res;
    // }

    // //todo: returner objekter med de optimale faktorværdier og om det submitted faktor værdi er for lidt / for meget ift. den minimale.
    // private calculateFirstOrderDecompositionForRiskFactorGroup(factorAnswersSubmitted: FactorAnswers, riskFactorGroup: RiskFactorGroup) {
    //     let res: MinimumRiskRatios = {}
    //     let factors = riskFactorGroup.getAllFactorsInGroup()

    //     factors.forEach(factor => {
    //         res[factor] = 1
    //     })

    //     riskFactorGroup.riskRatioTables.forEach(rrt => {
    //         let ratio = 1;
    //         if(rrt.factorNames.every( (fname:string) => factorAnswersSubmitted[fname]!=="")){ //checking if there are no missing variables.
    //             rrt.factorNames.forEach(factor => {
    //                 let minRR = rrt.getMinimumRR() //todo: return factor values/factor intervals for minRR and minRRexceptForOne
    //                 let minRRexceptForOne = rrt.getMinimumRRForSingleFactor(factorAnswersSubmitted, factor)
    //                 if (minRR === 0) {
    //                     ratio = 0
    //                 } else {
    //                     ratio = ratio * Math.max(0,minRRexceptForOne - minRR) / minRR
    //                 }
    //                 res[factor] *= ratio;
    //             })
    //         }
    //         else{
    //             rrt.factorNames.forEach(factor => {
    //                 res[factor]=0
    //             });
    //         }
            
    //     })
    //     return res;
    // }
}
