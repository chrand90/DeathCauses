export interface InputValidity {
  status: "Error" | "Warning" | "Missing" | "Success";
  message: string;
}

export interface DeriveMapping {
  [factorValue: string]: string;
}

export interface DerivableOptions {
  [deriver: string]: DeriveMapping;
}

export enum FactorTypes {
  NUMERIC = "number",
  STRING = "string",
}

export default abstract class GeneralFactor<T> {
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

  getInitialValue(): T | "" {
    return this.initialValue;
  }

  abstract checkInput(input: string | boolean, unit?: string): InputValidity;

  abstract getScalingFactor(unitName: string): number;

  abstract simulateValue(): string | number;
}
