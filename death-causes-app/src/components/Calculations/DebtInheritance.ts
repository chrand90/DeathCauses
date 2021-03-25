import { FactorAnswers } from "../../models/Factors";
import { DataRow } from "../PlottingData";
import DeathCause from "../database/Deathcause";
import { RiskRatioTable } from "../database/RiskRatioTable";

const TOLERABLE_NUMERIC_ERROR=1e-11

interface Accounts {
  [key: string]: number;
}

interface SetToNumber {
  [key: string]: number;
}

const cartesianProduct = (a: string[][]) => {
  let defaultString: string[]=[]
  let defaultString2: string[][]=[defaultString];
  return a.reduce(
    (a: string[][], b: string[]):string[][] =>{
      return a.flatMap((d: string[]):string[][] => {
        return b.map((e: string) => {
          return [d, e].flat();
        });
      })},
    defaultString2
  );
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

function trivialUsAndSs(factorNames: string[]){
  let UDic: SetToNumber = {};
  let SDic: SetToNumber = {};
  let sortedSubsets = getSortedSubsets(factorNames);
  sortedSubsets.forEach((set: string[], index: number) => {
    let key = set.sort().join(",");
    if(set.length===0){
      SDic[key]=1
    }
    else{
      SDic[key]=0
    }
    UDic[key]=1
  })
  let RRmax=1
  return {UDic, SDic, RRmax};
}

function computeUsAndSs(
  riskRatioTable: RiskRatioTable,
  factorAnswersSubmitted: FactorAnswers
) {
  const factorNames= riskRatioTable.getFactorNamesWithoutAge()
  let UDic: SetToNumber = {};
  let SDic: SetToNumber = {};
  let sortedSubsets = getSortedSubsets(factorNames);
  sortedSubsets.forEach((set: string[], index: number) => {
    let key = set.sort().join(",");
    UDic[key] = riskRatioTable.interpolation
      .getMinimumRR(factorAnswersSubmitted, set)
      .getValue();
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
  let RRmax = UDic[factorNames.sort().join(",")];
  return { UDic, SDic, RRmax };
}

function naiveDebtComputation(
  SDics: SetToNumber[],
  totalRR: number
): SetToNumber {
  let innerCauses: Accounts = {};
  let allKeys = SDics.map((SDic) => {
    return Object.keys(SDic);
  });
  let cartesProduct = cartesianProduct(allKeys);
  cartesProduct.map((keySetsToCombine: string[]) => {
    let multiplicities: Accounts = {}; //when the same factor appears many times we want to combine the different
    let Ss = keySetsToCombine.map((key: string, index: number) => {
      key.split(",").forEach((factorName: string) => {
        if(factorName===""){

        }
        else if (multiplicities[factorName]) {
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
    }, 1);
    let divisor = totalRR<1e-8 ? 1 : totalRR
    Object.entries(multiplicities).forEach(([factorName, multiplicity]) => {
      if (innerCauses[factorName]) {
        innerCauses[factorName] +=
          ((multiplicity * SsProduct) / setSize) / divisor;
      } else {
        innerCauses[factorName] =
          ((multiplicity * SsProduct) / setSize) / divisor;
      }
    });
  });
  Object.entries(innerCauses).forEach(([factorName, contrib])=> {
    if(contrib<0){
      if(contrib>-TOLERABLE_NUMERIC_ERROR){
        innerCauses[factorName]=0
      }
      else{
        throw Error("An inner cause was given a negative value. Inner cause:"+factorName+"="+(contrib).toString())
      }
    }
    
  })
  return innerCauses;
}

function isAnyMissing(factorNames: string[], factorAnswers: FactorAnswers):boolean{
  const noMissing= factorNames.every((factorName: string) => {
    return factorAnswers[factorName]!==""
  });
  return !noMissing
}

export default function calculateInnerProbabilities(
  factorAnswersSubmitted: FactorAnswers,
  deathcause: DeathCause
): DataRow {
  const age: number = factorAnswersSubmitted["Age"] as number;
  let marginalContributions: SetToNumber[] = [];
  let totalRR: number = 1;
  let normalizingFactors: number = 1;
  const agePrevalence = deathcause.ages.getPrevalence(age);
  if (deathcause.riskFactorGroups.length === 0) {
    return {
      innerCauses: {},
      name: deathcause.deathCauseName,
      totalProb: agePrevalence,
    };
  }
  deathcause.riskFactorGroups.forEach((rfg) => {
    let factorNamesOfThisGroup:string[]= Array.from(rfg.getAllFactorsInGroup())
    let anyMissing=isAnyMissing(factorNamesOfThisGroup, factorAnswersSubmitted)
    if(!anyMissing){
      rfg.riskRatioTables.forEach((rrt) => {
        const { UDic, SDic, RRmax } = computeUsAndSs(
          rrt,
          factorAnswersSubmitted
        );
        totalRR *= RRmax;
        marginalContributions.push(SDic);
      });
      normalizingFactors /= rfg.normalisationFactors.getPrevalence(age);
    }
    else{
      rfg.riskRatioTables.forEach((rrt) => {
        const { UDic, SDic, RRmax } = trivialUsAndSs(
          rrt.getFactorNamesWithoutAge()
        );
        marginalContributions.push(SDic);
      });
    }
  });
  const innerCauses = naiveDebtComputation(marginalContributions, totalRR);
  return {
    innerCauses: innerCauses,
    totalProb: totalRR * normalizingFactors * agePrevalence,
    name: deathcause.deathCauseName,
  };
}
