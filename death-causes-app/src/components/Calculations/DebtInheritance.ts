import { FactorAnswers } from "../../models/Factors";
import { DataRow } from "../PlottingData";
import DeathCause from "../database/Deathcause";
import { RiskRatioTable } from "../database/RiskRatioTable";
import RelationLinks from "../../models/RelationLinks";
import { BestValues } from "./ConsensusBestValue";
import { RiskFactorGroup } from "../database/RickFactorGroup";
import { UpdateDic } from "../../models/updateFormNodes/UpdateForm";
import { WeightedLocationAndValue } from "../database/InterpolationTable";

const TOLERABLE_NUMERIC_ERROR = 1e-11;

interface Accounts {
  [key: string]: number;
}

export interface SetToNumber {
  [key: string]: number;
}

const cartesianProduct = (a: string[][]) => {
  let defaultString: string[] = [];
  let defaultString2: string[][] = [defaultString];
  return a.reduce((a: string[][], b: string[]): string[][] => {
    return a.flatMap((d: string[]): string[][] => {
      return b.map((e: string) => {
        return [d, e].flat();
      });
    });
  }, defaultString2);
};

const getAllSubsets = (theArray: any) =>
  theArray.reduce(
    (subsets: any, value: any) =>
      subsets.concat(subsets.map((set: any) => [value, ...set])),
    [[]]
  );

function getSortedSubsets(l: string[]): string[][] {
  return getAllSubsets(l).sort(function (a: string[], b: string[]) {
    return a.length - b.length;
  });
}

function trivialUsAndSs(factorNames: string[]) {
  let UDic: SetToNumber = {};
  let SDic: SetToNumber = {};
  let sortedSubsets = getSortedSubsets(factorNames);
  sortedSubsets.forEach((set: string[], index: number) => {
    let key = set.sort().join(",");
    if (set.length === 0) {
      SDic[key] = 1;
    } else {
      SDic[key] = 0;
    }
    UDic[key] = 1;
  });
  let RRmax = 1;
  return { UDic, SDic, RRmax };
}

export function computeUsAndSs(
  riskRatioTable: RiskRatioTable,
  factorAnswersSubmitted: UpdateDic,
  freeFactors: string[],
  fixedFactors: string[],
  valueStore: BestValues,
  ageIndex: number
) {
  let UDic: SetToNumber = {};
  let SDic: SetToNumber = {};
  if (freeFactors.length > 0) {
    let sortedSubsets = getSortedSubsets(freeFactors);
    sortedSubsets.forEach((set: string[], index: number) => {
      let key = set.sort().join(",");
      const varsEqualingUserInput = set.concat(fixedFactors);
      const minLocationAndValues = riskRatioTable.interpolation.getMinimumRR(
        factorAnswersSubmitted,
        varsEqualingUserInput,
        ageIndex
      );
      UDic[key] = extractValue(minLocationAndValues)
      valueStore.addContribution(minLocationAndValues, varsEqualingUserInput);

      SDic[key] = UDic[key];
      for (let j = 0; j < index; j++) {
        let candidateSubset = sortedSubsets[j];
        if (
          candidateSubset.length < set.length &&
          candidateSubset.every((d) => {
            return set.includes(d);
          })
        ) {
          SDic[key] = SDic[key] - SDic[candidateSubset.sort().join(",")];
        }
      }
    });
  } else {
    const minLocationAndValues = riskRatioTable.interpolation.getMinimumRR(
      factorAnswersSubmitted,
      fixedFactors,
      ageIndex
    );
    UDic[""] = extractValue(minLocationAndValues)
    SDic[""] = UDic[""];
  }
  let RRmax = UDic[freeFactors.sort().join(",")];
  return { UDic, SDic, RRmax };
}

export function naiveDebtComputation(SDics: SetToNumber[], scaler: number=1): SetToNumber {
  let innerCauses: Accounts = {};
  let allKeys = SDics.map((SDic) => {
    return Object.keys(SDic);
  });
  let cartesProduct = cartesianProduct(allKeys);
  cartesProduct.forEach((keySetsToCombine: string[]) => {
    let multiplicities: Accounts = {}; //when the same factor appears many times we want to combine the different
    let Ss = keySetsToCombine.map((key: string, index: number) => {
      key.split(",").forEach((factorName: string) => {
        if (factorName === "") {
        } else if (multiplicities[factorName]) {
          multiplicities[factorName] += 1;
        } else {
          multiplicities[factorName] = 1;
        }
      });
      return SDics[index][key];
    });
    let setSize = Object.values(multiplicities).reduce(function (a, b) {
      return a + b;
    }, 0);
    let SsProduct = Ss.reduce(function (a, b) {
      return a * b;
    }, 1)*scaler;
    Object.entries(multiplicities).forEach(([factorName, multiplicity]) => {
      if (innerCauses[factorName]) {
        innerCauses[factorName] += (multiplicity * SsProduct) / setSize;
      } else {
        innerCauses[factorName] = (multiplicity * SsProduct) / setSize;
      }
    });
  });
  Object.entries(innerCauses).forEach(([factorName, contrib]) => {
    if (contrib < 0) {
      if (contrib > -TOLERABLE_NUMERIC_ERROR) {
        innerCauses[factorName] = 0;
      } else {
        throw Error(
          "An inner cause was given a negative value. Inner cause:" +
            factorName +
            "=" +
            contrib.toString()
        );
      }
    }
  });
  return innerCauses;
}

function isAnyMissing(
  factorNames: string[],
  factorAnswers: FactorAnswers
): boolean {
  const noMissing = factorNames.every((factorName: string) => {
    return factorAnswers[factorName] !== "";
  });
  return !noMissing;
}

function extractValue(weightedLocs: WeightedLocationAndValue[]):number{
  let vals: number[]=[];
  let weights: number[]=[];
  let total=0;
  weightedLocs.forEach(({weight,locationAndValue}) => {
    weights.push(weight);
    vals.push(locationAndValue.getValue())
    total+=weight*vals[vals.length-1]
  })
  let denom=weights.reduce((a,b)=>a+b,0)
  if(denom>1e-8){
    return total/denom;
  }
  return vals.reduce((a,b)=>a+b,0)/vals.length
}

export function normalizeInnerCauses(
  innerCauses: SetToNumber,
  totalRR: number
) {
  let divisor = totalRR > 1e-8 ? totalRR : 1;
  Object.entries(innerCauses).forEach(([factorName, value]) => {
    innerCauses[factorName] = value / divisor;
  });
  return innerCauses;
}
/*
function getNormalizationFactorsAndMissingRFGindices(
  age: number,
  deathcause: DeathCause,
  factorAnswersSubmitted: FactorAnswers
) {
  let normalizingFactors = 1;
  let riskFactorGroupsWithMissing: number[] = [];
  deathcause.riskFactorGroups.forEach((rfg, index) => {
    const factorNamesOfThisGroup: string[] = Array.from(
      rfg.getAllFactorsInGroup()
    );
    const anyMissing = isAnyMissing(
      factorNamesOfThisGroup,
      factorAnswersSubmitted
    );
    if (anyMissing) {
      riskFactorGroupsWithMissing.push(index);
    } else {
      normalizingFactors /= rfg.normalisationFactors.getPrevalence(age);
    }
  });

  return { normalizingFactors, riskFactorGroupsWithMissing };
}

function computeForSameOptimizabilityClass(
  deathcause: DeathCause,
  previouslyCountouredFactors: string[],
  optimClassMembers: string[],
  factorAnswersSubmitted: FactorAnswers,
  riskFactorGroupsWithMissing: number[],
  valueStore: BestValues,
) {
  let marginalContributions: SetToNumber[] = [];
  let totalRR = 1;
  deathcause.riskFactorGroups.forEach((rfg, index) => {
    let factorNamesOfThisGroup: string[] = Array.from(
      rfg.getAllFactorsInGroup()
    );
    let factorNamesOnContour = factorNamesOfThisGroup.filter(
      (factorName: string) => {
        return optimClassMembers.includes(factorName);
      }
    );
    if (!riskFactorGroupsWithMissing.includes(index)) {
      rfg.riskRatioTables.forEach((rrt) => {
        let fixedFactors = previouslyCountouredFactors.filter(
          (factorName: string) => {
            return previouslyCountouredFactors.includes(factorName);
          }
        );
        let freeFactors = rrt.getFactorNames().filter((factorName: string) => {
          return factorNamesOnContour.includes(factorName);
        });
        const { SDic, RRmax } = computeUsAndSs(
          rrt,
          factorAnswersSubmitted,
          freeFactors,
          fixedFactors,
          valueStore
        );
        totalRR *= RRmax;
        marginalContributions.push(SDic);
      });
    } else {
      rfg.riskRatioTables.forEach((rrt) => {
        let freeFactors = rrt.getFactorNames().filter((factorName: string) => {
          return factorNamesOnContour.includes(factorName);
        });
        const { SDic } = trivialUsAndSs(freeFactors);
        marginalContributions.push(SDic);
      });
    }
  });
  const groupInnerCauses = naiveDebtComputation(marginalContributions);
  const totalRROfThisAndLowerOptimClasses = totalRR;
  return { groupInnerCauses, totalRROfThisAndLowerOptimClasses };
}

export default function calculateInnerProbabilities(
  factorAnswersSubmitted: FactorAnswers,
  deathcause: DeathCause,
  rdat: RelationLinks,
  useOptimizabilities: boolean = true
): DataRow {
  const age: number = factorAnswersSubmitted["Age"] as number;
  let totalRR: number = 1;
  const agePrevalence = deathcause.ages.getPrevalence(age);
  if (deathcause.riskFactorGroups.length === 0) {
    return {
      innerCauses: {},
      name: deathcause.deathCauseName,
      totalProb: agePrevalence,
    };
  }
  let optimDividedfactorNames: string[][];
  if (useOptimizabilities) {
    optimDividedfactorNames = deathcause.getOptimizabilityClasses(rdat);
  } else {
    optimDividedfactorNames = [deathcause.getAllFactorNamesWithoutAge()];
  }
  let innerCauses: SetToNumber = {};
  let previouslyCountouredFactors: string[] = [];
  const {
    normalizingFactors,
    riskFactorGroupsWithMissing,
  } = getNormalizationFactorsAndMissingRFGindices(
    age,
    deathcause,
    factorAnswersSubmitted
  );
  const valueStore=new BestValues(optimDividedfactorNames, factorAnswersSubmitted);
  optimDividedfactorNames.forEach(
    (optimClassMembers: string[], index: number) => {
      const {
        groupInnerCauses,
        totalRROfThisAndLowerOptimClasses,
      } = computeForSameOptimizabilityClass(
        deathcause,
        previouslyCountouredFactors,
        optimClassMembers,
        factorAnswersSubmitted,
        riskFactorGroupsWithMissing,
        valueStore
      );
      innerCauses = { ...groupInnerCauses, ...innerCauses };
      previouslyCountouredFactors = previouslyCountouredFactors.concat(
        optimClassMembers
      );
      if (index === optimDividedfactorNames.length - 1) {
        totalRR = totalRROfThisAndLowerOptimClasses;
      }
    }
  );
  innerCauses = normalizeInnerCauses(innerCauses, totalRR);
  return {
    innerCauses: innerCauses,
    totalProb: totalRR * normalizingFactors * agePrevalence,
    name: deathcause.deathCauseName,
    comparisonWithBestValues: valueStore,
  };
}
*/
