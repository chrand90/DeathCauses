export interface FactorAnswers {
  [id: string]: number | string | boolean;
}

export interface FactorAnswerUnitScaling {
  unitName: string;
  scale: number;
}
export interface FactorAnswerUnitScalings {
  [id: string]: FactorAnswerUnitScaling;
}

export interface InputValidity {
  status: "Error" | "Warning" | "Missing" | "Success";
  message: string;
}

export interface FactorList {
  [key: string]: GeneralFactor<string | number | boolean>;
}

class Factors {
  factorList: FactorList = {};

  constructor(data: d3.DSVRowArray<string> | null) {
    console.log(data);
    console.log("data");
    data?.forEach((element) => {
      if (element.factorName !== undefined) {
        //We strongly the expect the input from FactorDatabase.csv to contain this column.
        console.log("entering switch");
        switch (element.factorType) {
          case "number": {
            this.factorList[element.factorName] = new NumericFactorPermanent(
              element.factorName as string,
              element.initialValue as number | "",
              [
                element.shortExplanation as string,
                element.longExplanation as string,
              ],
              element.placeholder,
              element.requiredDomain,
              element.recommendedDomain,
              element.options && element.options.includes("_")
                ? element.options.split("_")
                : [],
              element.derivableStates && element.derivableStates.length > 0
                ? element.derivableStates.split("_")
                : []
            );
            break;
          }
          //   case "boolean": {
          //     this.factorList[element.factorName] = new BooleanFactorPermanent(
          //       element.factorName as string
          //     );
          //     break;
          //   }
          case "string": {
            this.factorList[element.factorName] = new StringFactorPermanent(
              element.factorName as string,
              element.initialValue as string,
              [
                element.shortExplanation as string,
                element.longExplanation as string,
              ],
              element.placeholder,
              element.options?.split("_"),
              element.derivableStates && element.derivableStates.length > 0
                ? element.derivableStates.split("_")
                : []
            );
            break;
          }
          default:
            break;
        }
      }
    });
    console.log(this.factorList);
  }

  getFactorsAsStateObject() {
    let stateObject: FactorAnswers = {};
    for (let factorName in this.factorList) {
      stateObject[factorName] = this.factorList[factorName].getInitialValue();
    }
    return stateObject;
  }

  getInputValidity(
    name: string,
    value: string | boolean,
    unit?: string
  ): InputValidity {
    return this.factorList[name].check_input(value, unit);
  }

  getScalingFactor(name: string, unitName: string): number {
    return this.factorList[name].getScalingFactor(unitName);
  }
}

interface ExplanationAndLimits {
  lowerLim: null | number;
  upperLim: null | number;
  explanation: string;
}

interface ScalingInfo {
  required: ExplanationAndLimits;
  recommended: ExplanationAndLimits;
  scalingFactor: number;
}

interface UnitTable {
  [key: string]: ScalingInfo;
}

enum ExplanationStart {
  RECOMMENDATION_PHRASING = "More accurate if",
  REQUIREMENT_PHRASING = "Should be",
}

function extractLimsAndExplanation(
  domain: string | null,
  explanationStart: ExplanationStart,
  scalingFactor: number = 1
): ExplanationAndLimits {
  if (domain === null) {
    return { lowerLim: null, upperLim: null, explanation: "" };
  } else {
    let lowerLim: null | number = null;
    let upperLim: null | number = null;
    let explanation: string = "";
    let a = domain.split("-");
    if (a[0] !== "") {
      explanation += explanationStart;
      lowerLim = parseFloat(a[0]) / scalingFactor;
      if (a[1] !== "") {
        upperLim = parseFloat(a[1]) / scalingFactor;
        explanation +=
          " between " +
          (scalingFactor === 1 ? a[0] : lowerLim.toPrecision(2)) +
          " and " +
          (scalingFactor === 1 ? a[1] : upperLim.toPrecision(2));
      } else {
        explanation +=
          " larger than " +
          (scalingFactor === 1 ? a[0] : lowerLim.toPrecision(2));
      }
    } else {
      if (a[1] !== "") {
        upperLim = parseFloat(a[1]) / scalingFactor;
        explanation +=
          explanationStart +
          " smaller than " +
          (scalingFactor === 1 ? a[1] : upperLim.toPrecision(2));
      }
    }
    return { lowerLim: lowerLim, upperLim: upperLim, explanation: explanation };
  }
}

interface DeriveState {
  derivedFrom: string;
  derivedFromValue: string;
  derivedValue: string | number;
}

export abstract class GeneralFactor<T> {
  factorName: string;
  initialValue: T | "";
  phrasings: string[]; //If the factor is not going to be asked, the phrasing should be nu
  placeholder: string;
  factorType: string = "abstract";
  options: string[] = [];
  derivableStates: DeriveState[] = [];

  constructor(
    factorName: string,
    initialValue: T | "",
    phrasings: string[] = ["", ""],
    placeholder: string = "",
    derivableStatesInitializer: string[] = []
  ) {
    this.factorName = factorName;
    this.initialValue = initialValue;
    this.phrasings = phrasings;
    this.placeholder = placeholder;
    this.factorType = "abstract";
    this.initializeDerivableStates(derivableStatesInitializer);
  }

  initializeDerivableStates(derivableStatesInitializer: string[]) {
    if (derivableStatesInitializer.length === 0) {
      return;
    }
    derivableStatesInitializer.forEach((deriveStateString: string) => {
      const deriveStateComponents = deriveStateString.split("=");
      this.derivableStates.push({
        derivedFrom: deriveStateComponents[0],
        derivedFromValue: deriveStateComponents[1],
        derivedValue: deriveStateComponents[2],
      });
    });
  }

  getInitialValue(): T | "" {
    return this.initialValue;
  }

  check_input(input: string | boolean, unit?: string): InputValidity {
    return { status: "Success", message: "" };
  }

  getScalingFactor(unitName: string): number {
    return 1;
  }
}

class StringFactorPermanent extends GeneralFactor<string> {
  constructor(
    factorName: string,
    initialValue: string,
    phrasings: string[] = ["", ""],
    placeholder: string = "",
    options: string[] = [],
    derivableStatesInitializer: string[]=[]
  ) {
    super(factorName, initialValue, phrasings, placeholder, derivableStatesInitializer);
    this.factorType = "string";
    this.options = options;
  }

  check_input(val: string, unit = undefined): InputValidity {
    if (val in this.options) {
      return { status: "Success", message: "" };
    }
    return { status: "Missing", message: "" };
  }
}

class NumericFactorPermanent extends GeneralFactor<number> {
  lowerRecommended: number | null = null;
  upperRecommended: number | null = null;
  lowerRequired: number | null = null;
  upperRequired: number | null = null;
  explanationRecommendation: string = "";
  explanationRequirement: string = "";
  unitDic: UnitTable = {};
  requiredDomain: string | null;
  recommendedDomain: string | null;

  constructor(
    factorName: string,
    initialValue: number | "",
    phrasings: string[] = ["", ""],
    placeholder: string = "",
    requiredDomain: string | null = null,
    recommendedDomain: string | null = null,
    unitOptions: string[] = [],
    derivableStatesInitializer: string[]=[],
  ) {
    super(factorName, initialValue, phrasings, placeholder, derivableStatesInitializer);
    this.options = [];
    let scalingFactor: number;
    if (unitOptions.length > 0) {
      //Initializing error messages for all possible choice of units.
      unitOptions.forEach((d: string) => {
        let v = d.split("=");
        scalingFactor = parseFloat(v[1]);
        this.unitDic[v[0]] = {
          required: extractLimsAndExplanation(
            requiredDomain,
            ExplanationStart.REQUIREMENT_PHRASING,
            scalingFactor
          ),
          recommended: extractLimsAndExplanation(
            recommendedDomain,
            ExplanationStart.RECOMMENDATION_PHRASING,
            scalingFactor
          ),
          scalingFactor: scalingFactor,
        };
        this.options.push(v[0]);
      });
    }
    this.requiredDomain = requiredDomain;
    this.recommendedDomain = recommendedDomain;
    const elm = extractLimsAndExplanation(
      requiredDomain,
      ExplanationStart.REQUIREMENT_PHRASING
    );
    this.lowerRequired = elm.lowerLim;
    this.upperRequired = elm.upperLim;
    this.explanationRequirement = elm.explanation;
    const elm2 = extractLimsAndExplanation(
      recommendedDomain,
      ExplanationStart.RECOMMENDATION_PHRASING
    );
    this.lowerRecommended = elm2.lowerLim;
    this.upperRecommended = elm2.upperLim;
    this.explanationRecommendation = elm2.explanation;
    this.factorType = "number";
  }

  hasUnitOptions() {
    return this.options.length > 0;
  }

  getScalingFactor(unitName: string) {
    return this.unitDic[unitName].scalingFactor;
  }

  check_input(
    input: string,
    unit: string | undefined = undefined
  ): InputValidity {
    let s = input.trim();
    if (s === "") {
      return { status: "Missing", message: "" };
    }
    let isNum = /^(-?)(\d+|[.]\d+|\d+[.]\d+)$/.test(s);
    if (!isNum) {
      if (/^(-?)([\d,]+|[,]\d+|[\d,]+[,.]\d+)$/.test(s)) {
        return {
          status: "Error",
          message: "Use a dot(.) as decimal separator.",
        };
      }
      return { status: "Error", message: "Input is not a number" };
    }
    let l = parseFloat(s);

    if (unit && this.hasUnitOptions()) {
      let lowerRequired = this.unitDic[unit].required.lowerLim;
      let upperRequired = this.unitDic[unit].required.upperLim;
      let explanationRequirement = this.unitDic[unit].required.explanation;
      let lowerRecommended = this.unitDic[unit].recommended.lowerLim;
      let upperRecommended = this.unitDic[unit].recommended.upperLim;
      let explanationRecommendation = this.unitDic[unit].recommended
        .explanation;
      if (
        (lowerRequired !== null && l < lowerRequired) ||
        (upperRequired && l > upperRequired)
      ) {
        return { status: "Error", message: explanationRequirement };
      }
      if (
        (lowerRecommended !== null && l < lowerRecommended) ||
        (upperRecommended && l > upperRecommended)
      ) {
        return { status: "Warning", message: explanationRecommendation };
      }
      return { status: "Success", message: "" };
    }
    if (
      (this.lowerRequired !== null && l < this.lowerRequired) ||
      (this.upperRequired && l > this.upperRequired)
    ) {
      return { status: "Error", message: this.explanationRequirement };
    }
    if (
      (this.lowerRecommended !== null && l < this.lowerRecommended) ||
      (this.upperRecommended && l > this.upperRecommended)
    ) {
      return { status: "Warning", message: this.explanationRecommendation };
    }
    return { status: "Success", message: "" };
  }
}

// class BooleanFactorPermanent extends GeneralFactor<boolean> {
//   constructor(factorName: string) {
//     super(factorName, false);
//   }
// }

export default Factors;
