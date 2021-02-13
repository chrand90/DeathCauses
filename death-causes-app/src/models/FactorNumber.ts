import GeneralFactor, {DerivableOptions, InputValidity} from "./FactorAbstract";

export interface Domain {
  min?: number;
  max?: number;
}

export interface UnitOptions {
  [unitname: string]: number;
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

const IS_NUMBER_REGEX = /^[-]?(\d+|[.]\d+|\d+[.]\d*|)$/;
const IS_NUMBER_WITH_COMMAS_REGEX = /^[-]?([\d,]+|[,]\d+|[\d,]+[,.]\d+)$/;

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


export default class NumericFactorPermanent extends GeneralFactor<number> {
    lowerRecommended: number | null = null;
    upperRecommended: number | null = null;
    lowerRequired: number | null = null;
    upperRequired: number | null = null;
    explanationRecommendation: string = "";
    explanationRequirement: string = "";
    unitOptions: UnitOptions;
    unitDic: UnitTable = {};
    unitStrings: string[];
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
        derivableStates,
        helpJson
      );
      this.unitOptions = unitOptions;
      this.unitStrings = Object.keys(unitOptions);
      this.requiredDomain = requiredDomain;
      this.recommendedDomain = recommendedDomain;
      this.initializeUnitDic()
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
  
    initializeUnitDic(){
      Object.entries(this.unitOptions).forEach(([unitName, scalingFactor]) => {
        this.unitDic[unitName] = {
          required: extractLimsAndExplanation(
            this.requiredDomain,
            ExplanationStart.REQUIREMENT_PHRASING,
            scalingFactor
          ),
          recommended: extractLimsAndExplanation(
            this.recommendedDomain,
            ExplanationStart.RECOMMENDATION_PHRASING,
            scalingFactor
          ),
          scalingFactor: scalingFactor,
        };
      });
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
  
    simulateValue(): string {
      const lower: number = this.lowerRecommended
        ? this.lowerRecommended
        : this.upperRecommended
        ? Math.min(this.upperRecommended - 0.1, 0)
        : 0;
      const upper = this.upperRecommended
        ? this.upperRecommended
        : this.lowerRecommended
        ? Math.max(this.lowerRecommended + 0.1, 10)
        : 10;
      return customRound(lower + Math.random() * (upper - lower));
    }
  }
  
