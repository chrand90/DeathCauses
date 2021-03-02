import { Domain, UnitOptions } from "./FactorNumber";
import { DerivableOptions } from "./FactorAbstract";

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
export default interface InputJson {
  [factorname: string]: FactorAsJson;
}
