import { FactorAnswers } from "../Factors";
import Optimizabilities, { KnowledgeableOptimizabilities } from "../Optimizabilities";
import { ChangeStatus, DimensionStatus, MissingStatus, StochasticStatus, TypeStatus, UpdateForm } from "./UpdateForm";

export default class OptimizabilitiesNode {
    optimizabilities: Optimizabilities;

    constructor(optimizabilities: Optimizabilities){
        this.optimizabilities=optimizabilities;
    }

    compute(factorAnswers: FactorAnswers){
        return {
            change: ChangeStatus.CHANGED,
            random: StochasticStatus.DETERMINISTIC,
            dimension: DimensionStatus.SINGLE,
            missing: MissingStatus.NONMISSING,
            type: TypeStatus.OPTIMIZABILITIES,
            value: new KnowledgeableOptimizabilities(this.optimizabilities, factorAnswers)
          }
    }


}