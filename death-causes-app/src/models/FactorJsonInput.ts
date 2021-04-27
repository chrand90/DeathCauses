import { Domain, UnitOptions } from "./FactorNumber";
import { DerivableOptions } from "./FactorAbstract";

interface FactorAsJson {
  factorname: string;
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

type InputJson = FactorAsJson[];
export default InputJson;
