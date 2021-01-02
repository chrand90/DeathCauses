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
          case "string": {
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
    return this.factorList[name].check_input(value);
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
    let a = domain.split("-");
    if (a[0] !== "") {
      explanation += explanationStart;
      lowerLim = parseFloat(a[0]);
      if (a[1] !== "") {
        upperLim = parseFloat(a[1]);
        explanation += " between " + a[0] + " and " + a[1];
      } else {
        explanation += " larger than " + a[0];
      }
    } else {
      if (a[1] !== "") {
        explanation += explanationStart + " smaller than " + a[1];
        upperLim = parseFloat(a[1]);
      }
    }
    return { lowerLim: lowerLim, upperLim: upperLim, explanation: explanation };
  }
}

abstract class GeneralFactor<T> {
  factorName: string;
  initialValue: T | "";
  phrasing: string; //If the factor is not going to be asked, the phrasing should be nu
  placeholder: string;
  factorType: string = "abstract";
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
    this.factorType = "abstract";
  }

  getInitialValue(): T | "" {
    return this.initialValue;
  }

  check_input(input: string | boolean): InputValidity {
    return { status: "Success", message: "" };
  }
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

  check_input(val: string): InputValidity {
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

  check_input(input: string): InputValidity {
    let s = input.trim();
    if (s === "") {
      return { status: "Missing", message: "" };
    }
    let isNum = /^(-?)(\d+|[.]\d+|\d+[.]\d+)$/.test(s);
    let l = parseFloat(s);
    if (!isNum) {
      if (/^(-?)([\d,]+|[,]\d+|[\d,]+[,.]\d+)$/.test(s)) {
        return {
          status: "Error",
          message: "Use a dot(.) as decimal separator.",
        };
      }
      return { status: "Error", message: "Input is not a number" };
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
