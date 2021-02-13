import GeneralFactor, {DerivableOptions, InputValidity} from "./FactorAbstract";

export default class StringFactorPermanent extends GeneralFactor<string> {
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
      return this.options[
        Math.floor(Math.random() * Math.floor(this.options.length))
      ];
    }
  }