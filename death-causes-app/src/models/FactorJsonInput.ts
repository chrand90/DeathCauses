import { Domain, UnitOptions } from "./FactorNumber";
import { DerivableOptions } from "./FactorAbstract";

interface FactorAsJson {
  factorname: string;
  descriptions: string[];
  type: "string" | "number";
  question: string;
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
