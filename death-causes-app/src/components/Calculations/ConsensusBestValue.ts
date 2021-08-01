import Descriptions, { OptimizabilityToNodes } from "../../models/Descriptions";
import { FactorAnswers } from "../../models/Factors";
import RelationLinks from "../../models/RelationLinks";
import {
  DimensionStatus,
  StochasticStatus,
  UpdateDic,
} from "../../models/updateFormNodes/UpdateForm";
import { LocationAndValue } from "../database/InterpolationLocation";
import { WeightedLocationAndValue } from "../database/InterpolationTable";

enum Flank {
  NEITHER = "neither",
  BOTH = "both",
  INFINITY = "infinity",
  MINUS_INFINITY = "minus infinity",
}

enum FlankStability {
  STABLE = "stable",
  UNSTABLE = "unstable",
}

export interface LongConsensus {
  textWithButtons: string;
  buttonCodes: string[]
}

export class BestValues {
  optimals: { [factorName: string]: (number | string)[] };
  factorAnswers: UpdateDic;
  optimClasses: OptimizabilityToNodes;
  factorNameToOptimClass: { [k: string]: string } = {};

  constructor(
    optimClasses: OptimizabilityToNodes,
    allPreviousUpdateForms: UpdateDic
  ) {
    this.optimClasses = optimClasses;
    this.optimals = {};
    Object.entries(optimClasses).forEach(([optimVal, fnames]) => {
      fnames.forEach((fname) => {
        this.optimals[fname] = [] as (number | string)[];
        this.factorNameToOptimClass[fname] = optimVal;
      });
    });
    this.factorAnswers = allPreviousUpdateForms;
  }

  getOptimizability(factorName: string): number {
    return parseInt(this.factorNameToOptimClass[factorName]);
  }

  getGivensAndOptimizability(factorName: string) {
    let factorOptimClass: number = -10;
    if (factorName in this.factorNameToOptimClass) {
      factorOptimClass = parseInt(this.factorNameToOptimClass[factorName]);
    }
    if (factorOptimClass < 0) {
      return {
        givens: [],
        subtracted: [],
        sames: [],
        optimizability: factorOptimClass,
      };
    }
    const numClasses = Object.keys(this.optimClasses).map((s) => +s);
    let givens: string[] = [];
    let subtracted: string[] = [];
    numClasses.forEach((optimizability) => {
      if (optimizability < factorOptimClass) {
        givens = givens.concat(this.optimClasses[optimizability.toString()]);
      } else if (optimizability > factorOptimClass) {
        subtracted = subtracted.concat(
          this.optimClasses[optimizability.toString()]
        );
      }
    });
    const sames = this.optimClasses[factorOptimClass.toString()];
    return {
      givens: givens.filter((d) => d !== "Age"),
      subtracted,
      sames,
      optimizability: factorOptimClass,
    };
  }

  addContribution(
    weightedLocs: WeightedLocationAndValue[],
    fixedFactors: string[]
  ) {
    weightedLocs.forEach(({ weight, locationAndValue }) => {
      const numericLocs = locationAndValue.getInterpolationValues();
      numericLocs.forEach((coordinate) => {
        if (
          !fixedFactors.includes(coordinate.key as string) &&
          coordinate.key !== "Age"
        ) {
          if (typeof coordinate.value === "string") {
            this.optimals[coordinate.key].push(parseFloat(coordinate.value));
          } else {
            this.optimals[coordinate.key].push(coordinate.value);
          }
        }
      });
      const categoricalLocs = locationAndValue.getNonInterpolationValues();
      categoricalLocs.forEach((coordinate) => {
        if (
          !fixedFactors.includes(coordinate.key as string) &&
          coordinate.key !== "Age"
        ) {
          this.optimals[coordinate.key as string].push(coordinate.value);
        }
      });
    });
  }

  getMinMaxOfFactorAnswers(factorAnswer: number | number[]) {
    if (Array.isArray(factorAnswer)) {
      return { min: Math.min(...factorAnswer), max: Math.max(...factorAnswer) };
    }
    return { min: factorAnswer, max: factorAnswer };
  }

  getConsensusStatement(factorName: string, descriptions: Descriptions) {
    if (
      !(factorName in this.optimals) ||
      this.optimals[factorName].length === 0
    ) {
      return undefined;
      //throw Error("Not enough information to get consensus statement from "+factorName);
    }
    const factorAnswer = this.factorAnswers[factorName];
    const firstEntry = this.optimals[factorName][0];
    const factorNameDescription = descriptions.getDescription(factorName, 20);
    if (typeof firstEntry === "number") {
      const { min, max } = this.getMinMaxOfFactorAnswers(
        factorAnswer.value as number | number[]
      );
      const { side: factorAnswerFlank, stability } = computeFlankOfFactorAnswer(
        this.optimals[factorName] as number[],
        min,
        max
      );
      switch (factorAnswerFlank) {
        case Flank.NEITHER: {
          return factorNameDescription + " perhaps only rounding error";
        }
        case Flank.INFINITY: {
          if (stability === FlankStability.STABLE) {
            return (
              factorNameDescription +
              " is higher than " +
              firstEntry.toFixed(2).replace(/\.?0+$/, "")
            );
          } else {
            return factorNameDescription + " too high";
          }
        }
        case Flank.MINUS_INFINITY: {
          if (stability === FlankStability.STABLE) {
            return (
              factorNameDescription +
              " is lower than " +
              firstEntry.toFixed(2).replace(/\.?0+$/, "")
            );
          } else {
            return factorNameDescription + " too low";
          }
        }
        case Flank.BOTH: {
          return factorNameDescription + " (complicated)";
        }
      }
    } else {
      if (this.optimals[factorName].every((d) => d === firstEntry)) {
        return factorNameDescription + " is not " + firstEntry;
      } else {
        return factorNameDescription + " (complicated)";
      }
    }
  }

  getLongConsensusStatement(
    factorName: string,
    probability: number,
    causeName: string,
    descriptions: Descriptions
  ): LongConsensus {
    const factorNameDescription = descriptions.getDescription(factorName, 30);
    const causeDescription = descriptions.getDescription(causeName, 30);
    let buttonCodes:string[]=[];
    const prob =
      "<strong>" +
      (probability * 100).toFixed(1).replace(/\.?0+$/, "") +
      "%</strong>";
    const {
      givens,
      subtracted,
      optimizability,
    } = this.getGivensAndOptimizability(factorName);
    let buttonCounter=0;
    let res = "If you die"
    if(causeDescription.length>0){
      buttonCounter += 1;
      res+=" from " + `<button id="but${buttonCounter}" class="aslink">${causeDescription}</button>`
      buttonCodes.push(causeName)
    }
    res += ", there is a ";
    res += prob + " probability that the ";
    buttonCounter += 1;
    res += `<button id="but${buttonCounter}" class="aslink" href="something">best explanation</button> is `
    buttonCodes.push("optimizabilities")
    buttonCounter += 1;
    res +=  `<button id="but${buttonCounter}" class="aslink">${factorNameDescription}</button>`;
    buttonCodes.push(factorName);

    if (givens.length > 0 && false) {
      res =
        res +
        ". This includes cases where other valid reasons were " +
        listFormatting(givens, "or");
      if (subtracted.length > 0) {
        res =
          res +
          " but exludes those where " +
          listFormatting(subtracted) +
          " could also explain the death";
      }
    } else if (subtracted.length > 0 && false) {
      res =
        res +
        ". This excludes cases where other valid reasons were " +
        listFormatting(subtracted, "or");
    }
    if(!(factorName in this.factorAnswers)){
      console.error("The factor "+factorName+" was not in factoranswers")
      console.log("factoranswers:")
      console.log(this.factorAnswers)
    }
    const factorAnswer = this.factorAnswers[factorName];
    if (factorAnswer.dimension === DimensionStatus.SINGLE) {
      res =
        res + ". Your " + factorNameDescription + " is " + factorAnswer.value;
    }
    if (
      !(factorName in this.optimals) ||
      this.optimals[factorName].length === 0
    ) {
      return {
        textWithButtons: res,
        buttonCodes: buttonCodes
      };
    }
    const firstEntry = this.optimals[factorName][0];
    if (typeof firstEntry === "number") {
      const { min, max } = this.getMinMaxOfFactorAnswers(
        factorAnswer.value as number | number[]
      );
      const { side: factorAnswerFlank, stability } = computeFlankOfFactorAnswer(
        this.optimals[factorName] as number[],
        min,
        max
      );
      if (factorAnswer.dimension === DimensionStatus.YEARLY) {
        const minAnswer = min.toFixed(2).replace(/\.?0+$/, "");
        const maxAnswer = max.toFixed(2).replace(/\.?0+$/, "");
        if (minAnswer === maxAnswer) {
          res = res + ". Your " + factorNameDescription + " is " + minAnswer;
        } else {
          res =
            res +
            ". Your " +
            factorNameDescription +
            " varies between " +
            minAnswer +
            " and " +
            maxAnswer +
            " depending on your age";
        }
      }
      const minVal = Math.min(...(this.optimals[factorName] as number[]))
        .toFixed(2)
        .replace(/\.?0+$/, "");
      const maxVal = Math.max(...(this.optimals[factorName] as number[]))
        .toFixed(2)
        .replace(/\.?0+$/, "");
      if (factorAnswerFlank === Flank.NEITHER) {
        res = res + ". That is extremely close to the optimal value";
      } else if (stability === FlankStability.STABLE) {
        res = res + ". The optimal value is <strong>" + minVal + "</strong>";
      } else {
        res =
          res +
          ". The optimal value varies between " +
          minVal +
          " and " +
          maxVal +
          " depending on age, subcause, and/or other risk factors";
      }
    } else {
      if (this.optimals[factorName].every((d) => d === firstEntry)) {
        res = res + ". The optimal value is " + firstEntry;
      } else {
        res =
          res +
          ". The optimal values is one of {" +
          removeDuplicates(this.optimals[factorName] as string[]).join(", ") +
          "}" +
          " depending on age, subcause and/or other risk factors";
      }
    }
    return {
      textWithButtons: res,
      buttonCodes: buttonCodes
    };
  }

  merge(otherStore: BestValues) {
    Object.entries(otherStore.optimals).forEach(([factorName, vals]) => {
      if (factorName in this.optimals) {
        this.optimals[factorName] = this.optimals[factorName].concat(vals);
      } else {
        this.optimals[factorName] = vals;
      }
    });
    Object.entries(otherStore.optimClasses).forEach(([optimValue, nodes]) => {
      if (optimValue in this.optimClasses) {
        this.optimClasses[optimValue] = [
          ...Array.from(
            new Set<string>(this.optimClasses[optimValue].concat(nodes))
          ),
        ];
      } else {
        this.optimClasses[optimValue] = nodes;
      }
    });
    this.factorNameToOptimClass = {
      ...this.factorNameToOptimClass,
      ...otherStore.factorNameToOptimClass,
    };
  }
}

function removeDuplicates(l: string[]) {
  return Array.from(new Set<string>(l));
}

function computeFlankOfFactorAnswer(
  optimals: number[],
  minVal: number,
  maxVal: number
): { side: Flank; stability: FlankStability } {
  let side = Flank.NEITHER;

  let stability = FlankStability.STABLE;
  let lastBestValue: number;
  optimals.forEach((d, i) => {
    if (d < maxVal - 1e-10) {
      if (side === Flank.MINUS_INFINITY) {
        side = Flank.BOTH;
      }
      if (side === Flank.NEITHER) {
        side = Flank.INFINITY;
      }
    }
    if (d > minVal + 1e-10) {
      if (side === Flank.INFINITY) {
        side = Flank.BOTH;
      }
      if (side === Flank.NEITHER) {
        side = Flank.MINUS_INFINITY;
      }
    }
    if (i === 0) {
      lastBestValue = d;
    } else {
      if (
        stability === FlankStability.STABLE &&
        Math.abs(d - lastBestValue) > 1e-5
      ) {
        stability = FlankStability.UNSTABLE;
      }
    }
  });
  return { side, stability };
}

function createButton(buttonText: string, counter: number){
  return `<button id="but${counter}" class="aslink" href="something">${buttonText}</button>`
}

function listFormatting(factors: string[], finalword: string = "or") {
  if (factors.length === 1) {
    return "<i>" + factors[0] + "</i>";
  } else {
    const lastElement = factors.pop();
    let res = "";
    factors.forEach((d) => {
      res += "<i>" + d + "</i>, ";
    });
    return res.slice(0, -2) + " " + finalword + " <i>" + lastElement + "</i>";
  }
}

export function getUnexplainedStatement(prob: number, cause: string, descriptions: Descriptions){
  const causeDescription = descriptions.getDescription(cause, 30);
  let res=""
  res+="If you die"
  let buttonCounter=0
  let buttonCodes: string[]=[]
  if(cause!=="any cause"){
      buttonCounter+=1
      res+=" from "+ createButton(causeDescription, buttonCounter);
      buttonCodes.push(cause)
  }
  res+=", there is <strong>" +(prob*100).toFixed(1).replace(/\.?0+$/,"")+ "%</strong> probability that the "
  buttonCounter+=1
  res+=createButton("best explanation", buttonCounter)
  buttonCodes.push("optimizabilities")
  res+= " is "
  buttonCounter+=1;
  res+=createButton("Unknown", buttonCounter)
  buttonCodes.push("UnkownFactor")
  res+="."
  return {
      textWithButtons: res,
      buttonCodes:  buttonCodes
  };    
}

export function mergeBestValues(bestValues: BestValues[]): BestValues {
  const firstBestValues = bestValues[0];
  const shell = new BestValues({}, firstBestValues.factorAnswers);
  return bestValues.reduce((first: BestValues, second: BestValues) => {
    first.merge(second);
    return first;
  }, shell);
}
