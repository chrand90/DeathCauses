import {
  BestValues,
  mergeBestValues,
} from "../../components/Calculations/ConsensusBestValue";
import {
  naiveDebtComputation,
  normalizeInnerCauses,
  SetToNumber,
} from "../../components/Calculations/DebtInheritance";
import DeathCause from "../../components/database/Deathcause";
import CauseNodeResult from "./CauseNodeResult";
import FormUpdater from "./FormUpdater";
import RiskFactorGroupResult, {
  OptimsToSDics,
  RiskRatioResult,
} from "./RiskFactorGroupResult";
import {
  ChangeStatus,
  DimensionStatus,
  MissingStatus,
  StochasticStatus,
  TypeStatus,
  UpdateDic,
  UpdateForm,
} from "./UpdateForm";

export default class CauseNode extends FormUpdater {
  cause: DeathCause;
  baseInnerCauseObject: SetToNumber;

  constructor(
    ancestors: string[],
    ageFrom: number | null,
    ageTo: number,
    cause: DeathCause
  ) {
    super(ancestors, ageFrom, ageTo);
    this.cause = cause;
    this.baseInnerCauseObject = Object.fromEntries(
      cause.getAllFactorNamesWithoutAge().map((d) => [d, 0])
    );
  }

  getBaseRates(ageFrom: number, ageTo: number) {
    let baseRiskOfCause: number[] = [];
    for (let age = ageFrom; age <= ageTo; age++) {
      baseRiskOfCause.push(this.cause.ages.getPrevalence(age));
    }
    return baseRiskOfCause;
  }

  //overwriting
  handleMissing(allPreviousUpdateForms: UpdateDic) {
    return this.compute(allPreviousUpdateForms);
  }

  collectSDicsAndRRs(allPreviousUpdateForms: UpdateDic, ageIndex: number):OptimsToSDics {
    const stratifiedByRFG= this.nonMissingAncestors(allPreviousUpdateForms).map(
      (riskFactorGroupName) => {
        let allAgeResult = allPreviousUpdateForms[riskFactorGroupName]
          .value as RiskFactorGroupResult;
        if (
          allPreviousUpdateForms[riskFactorGroupName].dimension ===
          DimensionStatus.YEARLY
        ) {
          return (allAgeResult.SDics as OptimsToSDics[])[ageIndex];
        }
        return allAgeResult.SDics as OptimsToSDics;
      }
    );
    return stratifiedByRFG.reduce((a,b) => {
      Object.entries(b).forEach(([key, val]) =>{
        if(key in a){
          a[key]=a[key].concat(val)
        }
        else{
          a[key]=val
        }
      })
      return a
    },{})
  }

  nonMissingAncestors(allPreviousUpdateForms: UpdateDic) {
    return this.ancestors.filter((riskFactorGroupName) => {
      return (
        allPreviousUpdateForms[riskFactorGroupName].missing ===
        MissingStatus.NONMISSING
      );
    });
  }

  collectNormalizingConstants(allPreviousUpdateForms: UpdateDic) {
    return this.nonMissingAncestors(allPreviousUpdateForms).map(
      (riskfactorgroupName) => {
        return (allPreviousUpdateForms[riskfactorgroupName]
          .value as RiskFactorGroupResult).normalizationFactors;
      }
    );
  }

  collectBestValues(allPreviousUpdateForms: UpdateDic) {
    return this.nonMissingAncestors(allPreviousUpdateForms).map(
      (riskfactorgroupName) => {
        return (allPreviousUpdateForms[riskfactorgroupName]
          .value as RiskFactorGroupResult).bestValues;
      }
    );
  }

  multiplyWithNormalizingConstants(
    allPreviousUpdateForms: UpdateDic,
    baseRisks: number[]
  ): number[] {
    const nonMissingAncestors = this.nonMissingAncestors(
      allPreviousUpdateForms
    );
    return baseRisks.map((baseRisk, index) => {
      return (
        baseRisk /
        nonMissingAncestors
          .map((riskfactorgroupName) => {
            return (allPreviousUpdateForms[riskfactorgroupName]
              .value as RiskFactorGroupResult).normalizationFactors[index];
          })
          .reduce((a, b) => a * b, 1)
      );
    });
  }

  mergeBestValuesAcrossRiskFactorGroups(allPreviousUpdateForms: UpdateDic) {
    const bestvaluesToMerge = this.nonMissingAncestors(
      allPreviousUpdateForms
    ).map((d) => {
      return (allPreviousUpdateForms[d].value as RiskFactorGroupResult)
        .bestValues;
    });
    if (bestvaluesToMerge.length > 0) {
      return mergeBestValues(bestvaluesToMerge);
    }
    return undefined;
  }

  computeInnerCausesAndTotalRRForAge(
    allPreviousUpdateForms: UpdateDic,
    ageIndex: number
  ) {
    const optimDividedResults: OptimsToSDics = this.collectSDicsAndRRs(
      allPreviousUpdateForms,
      ageIndex
    );
    const allSeenOptimizabilities = Object.keys(optimDividedResults);
    const numericOptims = allSeenOptimizabilities.map((s) => +s);
    let innerCauses: SetToNumber = { ...this.baseInnerCauseObject };
    numericOptims.sort();
    numericOptims.forEach((optimizability, index) => {
      const stringOptim = optimizability.toString();
      const innerCausesOfOptimizability = naiveDebtComputation(
        optimDividedResults[stringOptim].map((r) => r.SDics)
      );
      innerCauses = { ...innerCauses, ...innerCausesOfOptimizability };
    });
    let totalRR=1;
    if(numericOptims.length>0){
      const maxOptim=numericOptims[numericOptims.length-1]
      totalRR= optimDividedResults[maxOptim.toString()].map(r=>r.RRmax).reduce((a,b)=>a*b,1)
      innerCauses = normalizeInnerCauses(innerCauses, totalRR);
    }
    return { totalRR, innerCauses };
  }

  compute(allPreviousUpdateForms: UpdateDic): UpdateForm {
    const startAge = this.getAgeFrom(allPreviousUpdateForms);
    const endAge = this.getAgeTo();

    let riskOfCause = this.getBaseRates(startAge, endAge);
    riskOfCause = this.multiplyWithNormalizingConstants(
      allPreviousUpdateForms,
      riskOfCause
    );
    let perYearInnerCauses:
      | { [cause: string]: number }
      | { [cause: string]: number }[];
    let dimension: DimensionStatus = DimensionStatus.SINGLE;
    const bestValues:
      | BestValues
      | undefined = this.mergeBestValuesAcrossRiskFactorGroups(
      allPreviousUpdateForms
    );
    if (this.inputDependsOnAge(allPreviousUpdateForms)) {
      dimension = DimensionStatus.YEARLY;
      const ageIndices = Array.from(Array(endAge - startAge + 1).keys());
      const totalRRsAndInnerCauses = ageIndices.map((ageIndex: number) => {
        return this.computeInnerCausesAndTotalRRForAge(
          allPreviousUpdateForms,
          ageIndex
        );
      });
      riskOfCause = totalRRsAndInnerCauses.map((RRAndOther, index) => {
        return riskOfCause[index] * RRAndOther.totalRR;
      });
      perYearInnerCauses = totalRRsAndInnerCauses.map((d) => d.innerCauses);
    } else {
      const totalRRAndInnerCauses = this.computeInnerCausesAndTotalRRForAge(
        allPreviousUpdateForms,
        -1 //no value necessary
      );
      riskOfCause = riskOfCause.map((baseRisk) => {
        return baseRisk * totalRRAndInnerCauses.totalRR;
      });
      perYearInnerCauses = totalRRAndInnerCauses.innerCauses
    }
    let causeInfo: CauseNodeResult = {
      probs: riskOfCause,
      name: this.cause.deathCauseName,
      perYearInnerCauses: perYearInnerCauses,
      bestValues: bestValues,
    };
    return {
      missing: MissingStatus.NONMISSING,
      dimension: dimension,
      random: StochasticStatus.DETERMINISTIC,
      type: TypeStatus.CAUSERESULT,
      change: ChangeStatus.CHANGED,
      value: causeInfo,
    };
  }
}
