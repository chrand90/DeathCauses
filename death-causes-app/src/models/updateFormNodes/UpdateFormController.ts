import DeathCause, {
  Condition,
  RiskFactorGroupsContainer
} from "../../components/database/Deathcause";
import { RiskFactorGroup } from "../../components/database/RickFactorGroup";
import { EVALUATION_UNIT } from "../../stores/AdvancedOptionsStore";
import Descriptions from "../Descriptions";
import { FactorAnswers } from "../Factors";
import Optimizabilities from "../Optimizabilities";
import RelationLinks, { NodeType } from "../RelationLinks";
import CauseNode from "./CauseNode";
import CauseNodeResult from "./CauseNodeResult";
import { ComputedFactorClasses } from "./ComputedFactors";
import { ConditionClasses } from "./ConditionNodes";
import { FactorAnswerChanges, FactorAnswersToUpdateForm } from "./FactorAnswersToUpdateForm";
import { conditionsContributions } from "./FinalSummary/ConditionSummary";
import riskFactorContributions from "./FinalSummary/RiskFactorContributions";
import riskFactorContributionsLifeExpectancy, { DeathCauseContributions, DeathCauseContributionsAndChanges } from "./FinalSummary/RiskFactorContributionsLifeExpectancy";
import FormUpdater from "./FormUpdater";
import OptimizabilitiesNode from "./OptimizabilitiesNode";
import RiskFactorGroupNode from "./RiskFactorGroupNode";
import { UpdateDic } from "./UpdateForm";

export interface WrappedLifeExpectancyContributions {
  evaluationUnit: EVALUATION_UNIT,
  data: DeathCauseContributions
}

export default class UpdateFormController {
  formUpdaters: FormUpdater[];
  inputFactorTreater: FactorAnswersToUpdateForm;
  formUpdaterNames: string[];
  ageFrom: null | number;
  ageTo: number;
  deathCauses: DeathCause[];
  deathCauseCategories: RiskFactorGroupsContainer[];
  riskFactorGroupNodes: RiskFactorGroupNode[] = [];
  allComputedNodes: UpdateDic | null;
  rdat: RelationLinks;
  conditions: { [conditionName: string]: Condition };
  evaluationUnit: EVALUATION_UNIT;
  optimizabilityNode: OptimizabilitiesNode;

  constructor(
    rdat: RelationLinks,
    ageFrom: null | number,
    ageTo: number = 120,
    deathCauses: DeathCause[],
    deathCauseCategories: RiskFactorGroupsContainer[],
    descriptions: Descriptions,
    evalutionUnit: EVALUATION_UNIT,
    conditions: {[conditionName: string]: Condition},
    optimizabilities: Optimizabilities,
  ) {
    this.rdat = rdat;
    this.formUpdaters = [];
    this.formUpdaterNames = [];
    this.inputFactorTreater = new FactorAnswersToUpdateForm();
    this.ageFrom = ageFrom;
    this.ageTo = ageTo;
    this.deathCauses = deathCauses;
    this.deathCauseCategories = deathCauseCategories;
    this.conditions = conditions;
    this.evaluationUnit = evalutionUnit;
    this.optimizabilityNode=new OptimizabilitiesNode(optimizabilities);
    this.initialize(rdat, descriptions);
    this.allComputedNodes = null;
  }

  initializeRiskFactorGroupNode(rfg: RiskFactorGroup, descriptions: Descriptions) {
    const ancestors = [...Array.from(rfg.getAllFactorsInGroup())];
    const riskFactorGroupNode = new RiskFactorGroupNode(
      ancestors,
      this.ageFrom,
      this.ageTo,
      rfg
    );
    return { riskFactorGroupNode, ancestors }
  }

  initialize(rdat: RelationLinks, descriptions: Descriptions) {
    rdat.sortedNodes[NodeType.COMPUTED_FACTOR].forEach((computedFactorName) => {
      let ancestors = rdat.getAncestors(computedFactorName);
      if (!(computedFactorName in ComputedFactorClasses)) {
        throw Error(
          computedFactorName.toString() +
          " was not defined as a computed factor"
        );
      }
      this.formUpdaters.push(
        ComputedFactorClasses[computedFactorName](
          ancestors,
          this.ageFrom,
          this.ageTo
        )
      );
      this.formUpdaterNames.push(computedFactorName);
    });
    rdat.sortedNodes[NodeType.CONDITION].forEach((conditionName) => {
      let rfgNodes: RiskFactorGroupNode[] = []
      let rfgNames: string[] = []
      this.conditions[conditionName].riskFactorGroups.forEach(rfg => {
        const { riskFactorGroupNode, ancestors } = this.initializeRiskFactorGroupNode(rfg, descriptions)
        rfgNames.push(conditionName + "." + ancestors.join("-"))
        rfgNodes.push(riskFactorGroupNode)
      })
      const causeNode = new CauseNode(rfgNames, this.ageFrom, this.ageTo, this.conditions[conditionName], this.rdat.findRiskFactors(conditionName))
      const conditionNode = ConditionClasses[conditionName](
        rdat.getAncestors(conditionName),
        this.ageFrom,
        this.ageTo,
        this.conditions[conditionName],
        rfgNodes,
        rfgNames,
        causeNode)
      this.formUpdaters.push(conditionNode)
      this.formUpdaterNames.push(conditionName);
    })
    const causeToRFGNames: { [a: string]: string[] } = {};
    this.deathCauseCategories
      .concat(this.deathCauses)
      .forEach((riskFactorContainer: RiskFactorGroupsContainer) => {
        if (riskFactorContainer.riskFactorGroups.length > 0) {
          causeToRFGNames[riskFactorContainer.deathCauseName] = [];
          riskFactorContainer.riskFactorGroups.map((rfg) => {
            const { riskFactorGroupNode, ancestors } = this.initializeRiskFactorGroupNode(rfg, descriptions)
            this.formUpdaters.push(riskFactorGroupNode);
            const nodeName =
              riskFactorContainer.deathCauseName + "." + ancestors.join("-");
            this.formUpdaterNames.push(nodeName);
            causeToRFGNames[riskFactorContainer.deathCauseName].push(nodeName);
          });
        }
      });
    this.deathCauses.forEach((deathCause) => {
      const causeAncestors = rdat.findCauseCategoryAncestors(deathCause.deathCauseName)
      let ancestors: string[] = [];
      causeAncestors.forEach((causeOrCategory: string) => {
        if (causeOrCategory in causeToRFGNames) {
          ancestors = ancestors.concat(causeToRFGNames[causeOrCategory])
        }
      })
      this.formUpdaters.push(new CauseNode(ancestors, this.ageFrom, this.ageTo, deathCause, this.rdat.findRiskFactors(deathCause.deathCauseName)))
      this.formUpdaterNames.push(deathCause.deathCauseName);
    });
  }

  computeInnerProbabilities(evaluationUnit: EVALUATION_UNIT): DeathCauseContributionsAndChanges {
    if (this.allComputedNodes === null) {
      throw Error("It is not possible to compute survival data before calling compute()")
    }

    const finalNodeResults: CauseNodeResult[] = this.deathCauses.map((deathcause) => {
      return (this.allComputedNodes![deathcause.deathCauseName].value as CauseNodeResult)
    })
    if (evaluationUnit === EVALUATION_UNIT.YEARS_LOST) {
      return {...riskFactorContributionsLifeExpectancy(finalNodeResults, this.formUpdaters[0].getAgeFrom(this.allComputedNodes), this.rdat),
         changes: this.inputFactorTreater.getRecentChanges()
        }
    }
    else {
      return {...riskFactorContributions(finalNodeResults, this.formUpdaters[0].getAgeFrom(this.allComputedNodes)), 
        changes: this.inputFactorTreater.getRecentChanges()
      }
    }
  }

  // computeFactorAnswerChanges(): FactorAnswerChanges {
  //   return this.inputFactorTreater.getRecentChanges()
  // }

  compute(factorAnswers: FactorAnswers) {
    let res: UpdateDic = this.inputFactorTreater.update(factorAnswers);
    res["optimizabilities"]=this.optimizabilityNode.compute(factorAnswers);
    this.formUpdaters.forEach((formUpdater, i) => {
      res[this.formUpdaterNames[i]] = formUpdater.update(res);
    });
    this.allComputedNodes = res;
  }

  computeAll(factorAnswers: FactorAnswers, evaluationUnit: EVALUATION_UNIT) {
    this.compute(factorAnswers)
    let innerCauses = this.computeInnerProbabilities(evaluationUnit)
    let changes: FactorAnswerChanges = this.inputFactorTreater.getRecentChanges()
    return { innerCauses: innerCauses, changes: changes, conditionsRes: this.computeConditions() }
  }

  computeConditions(){
    //Promise<SurvivalCurveData[]>{
      if (this.allComputedNodes === null) {
        throw Error("It is not possible to compute survival data before calling compute()")
      }
      const finalNodeResults: CauseNodeResult[] = this.deathCauses.map((deathcause) => {
        return (this.allComputedNodes![deathcause.deathCauseName].value as CauseNodeResult)
      })
      const conditionNodeResults: UpdateDic = Object.fromEntries(
        Object.keys(this.conditions).map((condition) => {
          return [condition, this.allComputedNodes![condition]]
        })
      )
      return conditionsContributions(finalNodeResults, conditionNodeResults, this.rdat);
  }

  // computeSurvivalData(): SurvivalCurveData[] {
  //   //Promise<SurvivalCurveData[]>{
  //   if (this.allComputedNodes === null) {
  //     throw Error("It is not possible to compute survival data before calling compute()")
  //   }
  //   const finalNodeResults: CauseNodeResult[] = this.deathCauses.map((deathcause) => {
  //     return (this.allComputedNodes![deathcause.deathCauseName].value as CauseNodeResult)
  //   })
  //   return survivalCurve(finalNodeResults, this.formUpdaters[0].getAgeFrom(this.allComputedNodes), this.ageTo)
  // }

  // computeSummaryViewData(innerCauses: LifeExpectancyContributions): SummaryViewData {
  //   let tmp = {
  //     lifeExpentancyData: {
  //       lifeExpentancy: innerCauses.baseLifeExpectancy,
  //       ages: innerCauses.ages,
  //       probabilities: innerCauses.survivalProbs
  //     },
  //     changes: this.inputFactorTreater.getRecentChanges()
  //   }

  //   return tmp
  // }
}
