export interface InputValidity {
  status: "Error" | "Warning" | "Missing" | "Success";
  message: string;
}

export interface DeriveMapping {
  [factorValue: string]: string | number;
}

export interface DerivableOptions {
  [deriver: string]: DeriveMapping;
}

export enum FactorTypes {
  NUMERIC = "number",
  STRING = "string",
}

export default abstract class GeneralFactor {
  factorName: string;
  initialValue: string;
  phrasing: string; //If the factor is not going to be asked, the phrasing should be nu
  placeholder: string;
  factorType: string = "abstract";
  helpJson: string | null;
  derivableStates: DerivableOptions;

  constructor(
    factorName: string,
    initialValue: string,
    phrasing: string,
    placeholder: string = "",
    derivableStates: DerivableOptions = {},
    helpJson: string | null = null
  ) {
    this.factorName = factorName;
    this.initialValue = initialValue;
    this.phrasing = phrasing;
    this.placeholder = placeholder;
    this.helpJson = helpJson;
    this.derivableStates = derivableStates;
  }

  // replaceFloats(derivableStates: DerivableOptions): DerivableOptions {
  //   Object.entries(derivableStates).forEach(([factorname, mappings]) => {
  //     Object.entries(mappings).forEach(([from,to]) => {
  //       derivableStates[factorname][from]=to.toString()
  //     })
  //   })
  //   return derivableStates
  // }

  getInitialValue(): string {
    return this.initialValue;
  }

  insertActualValue(val: string): string | number{
    return val;
  }

  abstract checkInput(input: string | boolean, unit?: string): InputValidity;

  abstract getScalingFactor(unitName: string): number;

  abstract simulateValue(): string ;
}
