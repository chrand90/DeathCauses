import { FactorAnswers } from "../../models/Factors";
import { OptimizabilityToNodes } from "../../models/RelationLinks";
import { UpdateDic } from "../../models/updateFormNodes/UpdateForm";
import { LocationAndValue } from "../database/InterpolationLocation";

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

export class BestValues {
  optimals: { [factorName: string]: (number | string)[] };
  factorAnswers: UpdateDic;
  optimClasses: OptimizabilityToNodes;

  constructor(
    optimClasses: OptimizabilityToNodes,
    allPreviousUpdateForms: UpdateDic
  ) {
    this.optimClasses=optimClasses;
    this.optimals = {};
    Object.values(optimClasses).forEach((fnames) => {
      fnames.forEach((fname) => {
        this.optimals[fname] = [] as (number | string)[];
      })
    });
    this.factorAnswers = allPreviousUpdateForms;
  }

  addContribution(loc: LocationAndValue, fixedFactors: string[]) {
    const numericLocs = loc.getInterpolationValues();
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
    const categoricalLocs = loc.getNonInterpolationValues();
    categoricalLocs.forEach((coordinate) => {
      if (
        !fixedFactors.includes(coordinate.key as string) &&
        coordinate.key !== "Age"
      ) {
        this.optimals[coordinate.key as string].push(coordinate.value);
      }
    });
  }

  getConsensusStatement(factorName: string) {
    if (
      !(factorName in this.optimals) ||
      this.optimals[factorName].length === 0
    ) {
      return undefined;
      //throw Error("Not enough information to get consensus statement from "+factorName);
    }
    const factorAnswer = this.factorAnswers[factorName];
    const firstEntry = this.optimals[factorName][0];
    if (typeof firstEntry === "number") {
      const { side: factorAnswerFlank, stability } = computeFlankOfFactorAnswer(
        this.optimals[factorName] as number[],
        factorAnswer.value as number
      );
      switch (factorAnswerFlank) {
        case Flank.NEITHER: {
          return factorName + " perhaps only rounding error";
        }
        case Flank.INFINITY: {
          if (stability === FlankStability.STABLE) {
            return factorName + " is higher than " + firstEntry.toFixed(2).replace(/\.?0+$/,"")
          } else {
            return factorName + " too high";
          }
        }
        case Flank.MINUS_INFINITY: {
          if (stability === FlankStability.STABLE) {
            return factorName + " is lower than " + firstEntry.toFixed(2).replace(/\.?0+$/,"")
          } else {
            return factorName + " too low";
          }
        }
        case Flank.BOTH: {
          return factorName + "(complicated)";
        }
      }
    } else {
      if (this.optimals[factorName].every((d) => d === firstEntry)) {
        return factorName + " is not " + firstEntry;
      } else {
        return factorName + " (complicated)";
      }
    }
  }

  merge(otherStore: BestValues) {
    Object.entries(otherStore.optimals).forEach(([factorName, vals]) => {
      if (factorName in this.optimals) {
        this.optimals[factorName] = this.optimals[factorName].concat(vals);
      } else {
        this.optimals[factorName] = vals;
      }
    });
    Object.entries(otherStore.optimClasses).forEach(([optimValue, nodes]) =>{
      if (optimValue in this.optimClasses) {
        this.optimClasses[optimValue] = [...Array.from(new Set<string>(this.optimClasses[optimValue].concat(nodes)))];
      } else {
        this.optimClasses[optimValue] = nodes;
      }
    })
  }
}


function computeFlankOfFactorAnswer(
  optimals: number[],
  factorAnswer: number
): { side: Flank; stability: FlankStability } {
  if(typeof factorAnswer==="string"){
      factorAnswer=parseFloat(factorAnswer);
  }
  let side = Flank.NEITHER;

  let stability = FlankStability.STABLE;
  let lastBestValue: number;
  optimals.forEach((d, i) => {
    if (d < factorAnswer - 1e-10) {
      if (side === Flank.MINUS_INFINITY) {
        side = Flank.BOTH;
      }
      if (side === Flank.NEITHER) {
        side = Flank.INFINITY;
      }
    }
    if (d > factorAnswer + 1e-10) {
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

export function mergeBestValues(
  bestValues: BestValues[]
): BestValues  {
  return bestValues.reduce(
    (first: BestValues , second: BestValues ) => {
      first.merge(second);
      return first;
    }
  );
}
