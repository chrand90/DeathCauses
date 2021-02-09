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

interface Domain {
  min?: number;
  max?: number;
}

interface UnitOptions {
  [unitname: string]: number;
}

interface DeriveMapping {
  [factorVale: string]: string | number;
}

interface DerivableOptions {
  [deriver: string]: DeriveMapping;
}
interface FactorAsJson {
  type: "string" | "number";
  longExplanation: string;
  placeholder: string;
  recommendedDomain?: Domain;
  requiredDomain?: Domain;
  helpJson?: string;
  initialValue?: string;
  options?: string[];
  units?: UnitOptions;
  derivables?: DerivableOptions;
}

export interface InputJson {
  [factorname: string]: FactorAsJson;
}

const IS_NUMBER_REGEX = /^[-]?(\d+|[.]\d+|\d+[.]\d*|)$/;
const IS_NUMBER_WITH_COMMAS_REGEX = /^[-]?([\d,]+|[,]\d+|[\d,]+[,.]\d+)$/;

enum FactorTypes {
  NUMERIC = "number",
  STRING = "string",
}

class Factors {
  factorList: FactorList = {};

  constructor(data: InputJson | null) {
    console.log(data);
    console.log("data");
    this.factorList = {};
    if (data) {
      Object.entries(data).forEach(([factorname, factorobject]) => {
        switch (factorobject.type) {
          case FactorTypes.NUMERIC: {
            this.factorList[factorname] = new NumericFactorPermanent(
              factorname,
              factorobject.initialValue
                ? parseFloat(factorobject.initialValue)
                : "",
              factorobject.longExplanation,
              factorobject.placeholder,
              factorobject.requiredDomain ? factorobject.requiredDomain : null,
              factorobject.recommendedDomain
                ? factorobject.recommendedDomain
                : null,
              factorobject.units ? factorobject.units : {},
              factorobject.helpJson ? factorobject.helpJson : null,
              factorobject.derivables ? factorobject.derivables : {}
            );
            break;
          }
          //   case "boolean": {
          //     this.factorList[element.factorName] = new BooleanFactorPermanent(
          //       element.factorName as string
          //     );
          //     break;
          //   }
          case FactorTypes.STRING: {
            this.factorList[factorname] = new StringFactorPermanent(
              factorname,
              factorobject.initialValue ? factorobject.initialValue : "",
              factorobject.longExplanation,
              factorobject.placeholder,
              factorobject.options ? factorobject.options : [],
              factorobject.helpJson ? factorobject.helpJson : null,
              factorobject.derivables ? factorobject.derivables : {}
            );
            break;
          }
          default:
            break;
        }
      });
    }
    console.log(this.factorList);
  }

  getRandomFactorOrder() {
    return Object.keys(this.factorList);
  }

  getHelpJson(factorname: string): string {
    return this.factorList[factorname].helpJson
      ? this.factorList[factorname].helpJson as string
      : "No help available";
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
    return this.factorList[name].checkInput(value, unit);
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

function customRound(x: number): string {
  return Number.parseFloat(x.toPrecision(2)).toPrecision();
}

function extractLimsAndExplanation(
  domain: Domain | null,
  explanationStart: ExplanationStart,
  scalingFactor: number = 1
): ExplanationAndLimits {
  if (domain === null) {
    return { lowerLim: null, upperLim: null, explanation: "" };
  } else {
    let lowerLim: null | number = null;
    let upperLim: null | number = null;
    let explanation: string = "";
    if ("min" in domain) {
      explanation += explanationStart;
      lowerLim = domain.min! / scalingFactor;
      if ("max" in domain) {
        upperLim = domain.max! / scalingFactor;
        explanation +=
          " between " +
          (scalingFactor === 1 ? domain.min : customRound(lowerLim)) +
          " and " +
          (scalingFactor === 1 ? domain.max : customRound(upperLim));
      } else {
        explanation +=
          " larger than " +
          (scalingFactor === 1 ? domain.min : customRound(lowerLim));
      }
    } else {
      if ("max" in domain) {
        upperLim = domain.max! / scalingFactor;
        explanation +=
          explanationStart +
          " smaller than " +
          (scalingFactor === 1 ? domain.max : customRound(upperLim));
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
  phrasing: string; //If the factor is not going to be asked, the phrasing should be nu
  placeholder: string;
  factorType: string = "abstract";
  derivableStates: DerivableOptions = {};
  helpJson: string | null;

  constructor(
    factorName: string,
    initialValue: T | "",
    phrasing: string,
    placeholder: string = "",
    helpJson: string | null = null,
    derivableStatesInitializer: DerivableOptions
  ) {
    this.factorName = factorName;
    this.initialValue = initialValue;
    this.phrasing = phrasing;
    this.placeholder = placeholder;
    this.helpJson = helpJson;
    //this.initializeDerivableStates(derivableStatesInitializer);
  }

  // initializeDerivableStates(derivableStatesInitializer: string[]) {
  //   if (derivableStatesInitializer.length === 0) {
  //     return;
  //   }
  //   derivableStatesInitializer.forEach((deriveStateString: string) => {
  //     const deriveStateComponents = deriveStateString.split("=");
  //     this.derivableStates.push({
  //       derivedFrom: deriveStateComponents[0],
  //       derivedFromValue: deriveStateComponents[1],
  //       derivedValue: deriveStateComponents[2],
  //     });
  //   });
  // }

  getInitialValue(): T | "" {
    return this.initialValue;
  }

  abstract checkInput(input: string | boolean, unit?: string): InputValidity;

  abstract getScalingFactor(unitName: string): number;
}

export class StringFactorPermanent extends GeneralFactor<string> {
  options: string[] = [];
  constructor(
    factorName: string,
    initialValue: string,
    phrasing: string,
    placeholder: string = "",
    options: string[] = [],
    helpJson: string | null = null,
    derivableStatesInitializer: DerivableOptions
  ) {
    super(
      factorName,
      initialValue,
      phrasing,
      placeholder,
      helpJson,
      derivableStatesInitializer
    );
    this.factorType = "string";
    this.options = options;
  }

  checkInput(val: string, unit = undefined): InputValidity {
    if (val in this.options) {
      return { status: "Success", message: "" };
    }
    return { status: "Missing", message: "" };
  }

  getScalingFactor(unitName: string): number {
    return 1;
  }
}

export class NumericFactorPermanent extends GeneralFactor<number> {
  lowerRecommended: number | null = null;
  upperRecommended: number | null = null;
  lowerRequired: number | null = null;
  upperRequired: number | null = null;
  explanationRecommendation: string = "";
  explanationRequirement: string = "";
  unitOptions: UnitOptions;
  unitDic: UnitTable = {};
  requiredDomain: Domain | null;
  recommendedDomain: Domain | null;

  constructor(
    factorName: string,
    initialValue: number | "",
    phrasing: string = "",
    placeholder: string = "",
    requiredDomain: Domain | null = null,
    recommendedDomain: Domain | null = null,
    unitOptions: UnitOptions,
    helpJson: string | null = null,
    derivableStates: DerivableOptions
  ) {
    super(
      factorName,
      initialValue,
      phrasing,
      placeholder,
      helpJson,
      derivableStates
    );
    this.unitOptions = unitOptions;
    //Initializing error messages for all possible choice of units.
    Object.entries(unitOptions).forEach(([unitName, scalingFactor]) => {
      this.unitDic[unitName] = {
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
    });
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
    return Object.keys(this.unitOptions).length > 0;
  }

  getScalingFactor(unitName: string) {
    return this.unitDic[unitName].scalingFactor;
  }

  checkInput(
    input: string,
    unit: string | undefined = undefined
  ): InputValidity {
    let trimmedInput = input.trim();
    if (trimmedInput === "") {
      return { status: "Missing", message: "" };
    }
    let isNumeric = IS_NUMBER_REGEX.test(trimmedInput);

    if (!isNumeric) {
      if (IS_NUMBER_WITH_COMMAS_REGEX.test(trimmedInput)) {
        return {
          status: "Error",
          message: "Use a dot(.) as decimal separator.",
        };
      }
      return { status: "Error", message: "Input is not a number" };
    }
    const numberToCheck = parseFloat(trimmedInput);
    return this.checkNumberInput(numberToCheck, unit);
  }

  checkNumberInput(
    numberToCheck: number,
    unit: string | undefined
  ): InputValidity {
    if (unit && this.hasUnitOptions()) {
      let lowerRequired = this.unitDic[unit].required.lowerLim;
      let upperRequired = this.unitDic[unit].required.upperLim;
      let explanationRequirement = this.unitDic[unit].required.explanation;
      let lowerRecommended = this.unitDic[unit].recommended.lowerLim;
      let upperRecommended = this.unitDic[unit].recommended.upperLim;
      let explanationRecommendation = this.unitDic[unit].recommended
        .explanation;
      if (
        (lowerRequired !== null && numberToCheck < lowerRequired) ||
        (upperRequired && numberToCheck > upperRequired)
      ) {
        return { status: "Error", message: explanationRequirement };
      }
      if (
        (lowerRecommended !== null && numberToCheck < lowerRecommended) ||
        (upperRecommended && numberToCheck > upperRecommended)
      ) {
        return { status: "Warning", message: explanationRecommendation };
      }
      return { status: "Success", message: "" };
    }
    if (
      (this.lowerRequired !== null && numberToCheck < this.lowerRequired) ||
      (this.upperRequired && numberToCheck > this.upperRequired)
    ) {
      return { status: "Error", message: this.explanationRequirement };
    }
    if (
      (this.lowerRecommended !== null &&
        numberToCheck < this.lowerRecommended) ||
      (this.upperRecommended && numberToCheck > this.upperRecommended)
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
