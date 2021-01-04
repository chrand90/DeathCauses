export interface FactorAnswers {
  [id: string]: number | string | boolean;
}

export interface InputValidity {
  status: "Error" | "Warning" | "Missing" | "Success";
  message: string;
}

export interface FactorList {
  [key: string]: GeneralFactor<string | number | boolean>;
}

const IS_NUMBER_REGEX=/^[-]?(\d+|[.]\d+|\d+[.]\d*|)$/;
const IS_NUMBER_WITH_COMMAS_REGEX=/^[-]?([\d,]+|[,]\d+|[\d,]+[,.]\d+)$/

enum FactorTypes {
  NUMERIC='number',
  STRING='string',
};

class Factors {
  factorList: FactorList = {};

  constructor(data: d3.DSVRowArray<string> | null) {
    data?.forEach((element) => {
      if (element.factorName !== undefined) {
        //We strongly the expect the input from FactorDatabase.csv to contain this column.
        switch (element.factorType) {
          case FactorTypes.NUMERIC: {
            this.factorList[element.factorName] = new NumericFactorPermanent(
              element.factorName as string,
              element.initialValue as number | "",
              element.phrasing,
              element.placeholder,
              element.requiredDomain,
              element.recommendedDomain
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
            this.factorList[element.factorName] = new StringFactorPermanent(
              element.factorName as string,
              element.initialValue as string,
              element.phrasing,
              element.placeholder,
              element.options?.split("_")
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

  getInputValidity(name: string, value: string | boolean): InputValidity {
    return this.factorList[name].checkInput(value);
  }
}

interface ExplanationAndLimits {
  lowerLim: null | number;
  upperLim: null | number;
  explanation: string;
}

enum ExplanationStart {
  RECOMMENDATION_PHRASING = "More accurate if",
  REQUIREMENT_PHRASING = "Should be",
}

function extractLimsAndExplanation(
  domain: string | null,
  explanationStart: ExplanationStart
): ExplanationAndLimits {
  if (domain === null) {
    return { lowerLim: null, upperLim: null, explanation: "" };
  } else {
    let lowerLim: null | number = null;
    let upperLim: null | number = null;
    let explanation: string = "";
    let limitsAsStrings = domain.split("-");
    if (limitsAsStrings[0] !== "") {
      explanation += explanationStart;
      lowerLim = parseFloat(limitsAsStrings[0]);
      if (limitsAsStrings[1] !== "") {
        upperLim = parseFloat(limitsAsStrings[1]);
        explanation += " between " + limitsAsStrings[0] + " and " + limitsAsStrings[1];
      } else {
        explanation += " larger than " + limitsAsStrings[0];
      }
    } else {
      if (limitsAsStrings[1] !== "") {
        explanation += explanationStart + " smaller than " + limitsAsStrings[1];
        upperLim = parseFloat(limitsAsStrings[1]);
      }
    }
    return { lowerLim: lowerLim, upperLim: upperLim, explanation: explanation };
  }
}

export abstract class GeneralFactor<T> {
  factorName: string;
  initialValue: T | "";
  phrasing: string; //If the factor is not going to be asked, the phrasing should be nu
  placeholder: string;
  factorType: string='abstract';
  options: string[] = [];

  constructor(
    factorName: string,
    initialValue: T | "",
    phrasing: string = "",
    placeholder: string = ""
  ) {
    this.factorName = factorName;
    this.initialValue = initialValue;
    this.phrasing = phrasing;
    this.placeholder = placeholder;
  }

  getInitialValue(): T | "" {
    return this.initialValue;
  }

  abstract checkInput(input: string | boolean): InputValidity
}

class StringFactorPermanent extends GeneralFactor<string> {
  constructor(
    factorName: string,
    initialValue: string,
    phrasing: string = "",
    placeholder: string = "",
    options: string[] = []
  ) {
    super(factorName, initialValue, phrasing, placeholder);
    this.factorType = "string";
    this.options = options;
  }

  checkInput(val: string): InputValidity {
    if (val in this.options) {
      return { status: "Success", message: "" };
    }
    return { status: "Missing", message: "" };
  }
}

class NumericFactorPermanent extends GeneralFactor<number> {
  lowerRecommended: number | null;
  upperRecommended: number | null;
  lowerRequired: number | null;
  upperRequired: number | null;
  explanationRecommendation: string;
  explanationRequirement: string;

  constructor(
    factorName: string,
    initialValue: number | "",
    phrasing: string = "",
    placeholder: string = "",
    requiredDomain: string | null = null,
    recommendedDomain: string | null = null
  ) {
    super(factorName, initialValue, phrasing, placeholder);
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

  checkInput(input: string): InputValidity {
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
    return this.checkNumberInput(numberToCheck);
  }

  checkNumberInput(numberToCheck:number):InputValidity{
    if (
      (this.lowerRequired !== null && numberToCheck < this.lowerRequired) ||
      (this.upperRequired && numberToCheck > this.upperRequired)
    ) {
      return { status: "Error", message: this.explanationRequirement };
    }
    if (
      (this.lowerRecommended !== null && numberToCheck < this.lowerRecommended) ||
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
