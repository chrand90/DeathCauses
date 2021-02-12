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

interface FactorMasking {
  effectiveValue: string;
  maskedByFactor: string;
  maskedByValue: string;
}
export interface FactorMaskings {
  [maskedFactor: string]: FactorMasking
}

interface FactorMaskingsWithNulls {
  [maskedFactor: string]: FactorMasking | null;
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
  [factorValue: string]: string ;
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

interface DerivableOptionsSet {
  [causedFactor: string]: DerivableOptions;
}

function reverseDeriveMapping(dos: DerivableOptionsSet){
  let res: DerivableOptionsSet={}
  let inner: DeriveMapping;
  let middle: DerivableOptions;
  Object.entries(dos).forEach( ([causedFactor, dom] )=>{
    Object.entries(dom).forEach( ([causativeFactor, dm]) => {
      Object.entries(dm).forEach(([causativeFactorValue, causedFactorValue]) => {
        if(!(causativeFactor in res)){
          inner = {}
          inner[causativeFactorValue]=causedFactorValue
          middle = {}
          middle[causedFactor]=inner
          res[causativeFactor]=middle
        }
        else if(!(causedFactor in res[causativeFactor])){
          inner = {}
          inner[causativeFactorValue]=causedFactorValue
          res[causativeFactor][causedFactor]=inner
        }
        else{
          res[causativeFactor][causedFactor][causativeFactorValue]=causedFactorValue
        }
      })
    })
  })
  return res
}

function removeNulls(fin: FactorMaskingsWithNulls): FactorMaskings{
  let res: FactorMaskings={}
  Object.entries(fin).forEach(([factorname, maskValue])=> {
    if(maskValue){
      res[factorname]=maskValue
    }
  })
  return res
}

class Factors {
  factorList: FactorList = {};
  reverseDerivables: DerivableOptionsSet={};


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
    this.initializeReverseDerivables()
  }

  initializeReverseDerivables(){
    let derivables: DerivableOptionsSet={}
    Object.entries(this.factorList).forEach( ([factorname, factorobject])=> {
      derivables[factorname]=factorobject.derivableStates
    })
    this.reverseDerivables=reverseDeriveMapping(derivables)
  }

  updateMasked(factorAnswers: FactorAnswers, changedFactor: string, oldMaskedValues: FactorMaskings): FactorMaskings | "nothing changed" {
    if(!(changedFactor in this.reverseDerivables)){
      return "nothing changed"
    }
    let factorsToCheck: string[]=[changedFactor]
    let factorToCheck: string;
    let factorMaskingChanges: FactorMaskingsWithNulls={};
    while(factorsToCheck.length>0){
      factorToCheck=factorsToCheck.pop()!
      if(factorToCheck in this.reverseDerivables){//this means that something may have changed
        let factorValue= factorAnswers[factorToCheck] as string//by design of factordatabase.json, this is a string
        if(factorToCheck in factorMaskingChanges && factorMaskingChanges[factorToCheck]){
          factorValue=factorMaskingChanges[factorToCheck]?.effectiveValue! //putting on exclamation point because we have just tested for null-value
        }
        const maskedFactors= this.reverseDerivables[factorToCheck]
        Object.entries(maskedFactors).forEach( ([maskedFactor, maskingObject]) => {
          if(factorValue in maskingObject){
            factorMaskingChanges[maskedFactor]= {
              effectiveValue: maskingObject[factorValue],
              maskedByFactor: factorToCheck,
              maskedByValue: factorValue
            }
          }
          else{
            factorMaskingChanges[maskedFactor]=null
          }
        })
        factorsToCheck=factorsToCheck.concat(Object.keys(maskedFactors))
      }
    }
    const newFactorMaskingsWithNulls: FactorMaskingsWithNulls= {...oldMaskedValues, ...factorMaskingChanges}
    console.log("newFactorMaskings");
    console.log(newFactorMaskingsWithNulls)
    return removeNulls(newFactorMaskingsWithNulls)
  }
  
  simulateFactorAnswersAndMaskings(){
    let factorMaskings: FactorMaskings={}
    let factorAnswers: FactorAnswers={}
    let factorMaskingCandidate: FactorMaskings | "nothing changed";
    Object.keys(this.factorList).forEach( (factorname) => {
      factorAnswers[factorname]=""
    })
    Object.entries(this.factorList).forEach( ([factorName, factorobject]) => {
      if(factorName in factorMaskings){
        factorAnswers[factorName]=String(factorMaskings[factorName].effectiveValue)
      }
      else{
        factorAnswers[factorName]=factorobject.simulateValue()
      }
      if(factorobject.factorType==="string"){
        factorMaskingCandidate= this.updateMasked(factorAnswers, factorName, factorMaskings)
        if(factorMaskingCandidate!=="nothing changed"){
          factorMaskings=factorMaskingCandidate
        }
      }
      
    });
    return {factorAnswers, factorMaskings}
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
  helpJson: string | null;
  derivableStates: DerivableOptions;
  

  constructor(
    factorName: string,
    initialValue: T | "",
    phrasing: string,
    placeholder: string = "",
    derivableStates: DerivableOptions={},
    helpJson: string | null = null,
  ) {
    this.factorName = factorName;
    this.initialValue = initialValue;
    this.phrasing = phrasing;
    this.placeholder = placeholder;
    this.helpJson = helpJson;
    this.derivableStates= derivableStates;
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

  abstract simulateValue(): string | number;
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
      derivableStatesInitializer,
      helpJson
      
    );
    this.factorType = "string";
    this.options = options;
  }

  checkInput(val: string, unit = undefined): InputValidity {
    if (this.options.includes(val)) {
      return { status: "Success", message: "" };
    }
    return { status: "Missing", message: "" };
  }

  getScalingFactor(unitName: string): number {
    return 1;
  }

  simulateValue(): string {
    return this.options[Math.floor(Math.random() * Math.floor(this.options.length))]
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
      helpJson,
    );
    this.unitOptions = unitOptions;
    this.unitStrings = Object.keys(unitOptions)
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

  simulateValue(): string {
    const lower: number=this.lowerRecommended ? this.lowerRecommended : ( this.upperRecommended ? Math.min(this.upperRecommended-0.1, 0) : 0)
    const upper=this.upperRecommended ? this.upperRecommended : ( this.lowerRecommended ? Math.max(this.lowerRecommended+0.1,10) : 10)
    return Number((lower+Math.random()*(upper-lower)).toPrecision(3)).toPrecision()
  }
}

// class BooleanFactorPermanent extends GeneralFactor<boolean> {
//   constructor(factorName: string) {
//     super(factorName, false);
//   }
// }

export default Factors;
