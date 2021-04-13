import { FactorAnswers } from "../../models/Factors";
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
  factorAnswers: FactorAnswers;

  constructor(
    optimDividedFactorNames: string[][],
    factorAnswers: FactorAnswers
  ) {
    this.optimals = {};
    optimDividedFactorNames.forEach((fnames) => {
      fnames.forEach((fname) => {
        this.optimals[fname] = [] as (number | string)[];
      });
    });
    this.factorAnswers = factorAnswers;
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
        factorAnswer as number
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
  bestValues: (BestValues | undefined)[]
): BestValues | undefined {
  return bestValues.reduce(
    (first: BestValues | undefined, second: BestValues | undefined) => {
      if (!first) {
        if (!second) {
          return undefined;
        }
        return second;
      }
      if (!second) {
        return first;
      }
      first.merge(second);
      return first;
    }
  );
}
