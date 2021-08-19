import { SurvivalCurveData } from "../../components/Calculations/SurvivalCurveData";
import DeathCause, {
  Condition,
  RiskFactorGroupsContainer
} from "../../components/database/Deathcause";
import { RiskFactorGroup } from "../../components/database/RickFactorGroup";
import { DataRow } from "../../components/PlottingData";
import Descriptions from "../Descriptions";
import { FactorAnswers } from "../Factors";
import RelationLinks, { NodeType } from "../RelationLinks";
import CauseNode from "./CauseNode";
import CauseNodeResult from "./CauseNodeResult";
import { ComputedFactorClasses } from "./ComputedFactors";
import { ConditionClasses } from "./ConditionNodes";
import { FactorAnswersToUpdateForm } from "./FactorAnswersToUpdateForm";
import riskFactorContributions from "./FinalSummary/RiskFactorContributions";
import riskFactorContributionsLifeExpectancy, { LifeExpectancyContributions } from "./FinalSummary/RiskFactorContributionsLifeExpectancy";
import computeSummaryView, { SummaryViewData } from "./FinalSummary/SummaryView";
import survivalCurve from "./FinalSummary/SurvivalCurve";
import FormUpdater from "./FormUpdater";
import RiskFactorGroupNode from "./RiskFactorGroupNode";
import { UpdateDic } from "./UpdateForm";

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
  conditions: {[conditionName: string]: Condition};
  useLifeExpectancy: boolean;

  constructor(
    rdat: RelationLinks,
    ageFrom: null | number,
    ageTo: number = 120,
    deathCauses: DeathCause[],
    deathCauseCategories: RiskFactorGroupsContainer[],
    descriptions: Descriptions,
    conditions: {[conditionName: string]: Condition},
    useLifeExpectancy=true
  ) {
    this.rdat=rdat;
    this.formUpdaters = [];
    this.formUpdaterNames = [];
    this.inputFactorTreater = new FactorAnswersToUpdateForm();
    this.ageFrom = ageFrom;
    this.ageTo = ageTo;
    this.deathCauses = deathCauses;
    this.deathCauseCategories = deathCauseCategories;
    this.conditions=conditions;
    this.useLifeExpectancy=useLifeExpectancy;
    this.initialize(rdat, descriptions);
    this.allComputedNodes=null;
  }

  initializeRiskFactorGroupNode(rfg: RiskFactorGroup, descriptions: Descriptions){
    const ancestors = [...Array.from(rfg.getAllFactorsInGroup())];
    const optims = descriptions.getOptimizabilityClasses(ancestors);
    const riskFactorGroupNode = new RiskFactorGroupNode(
      ancestors,
      this.ageFrom,
      this.ageTo,
      rfg,
      optims
    );
    return {riskFactorGroupNode, ancestors}
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
      let rfgNodes:RiskFactorGroupNode[]=[]
      let rfgNames:string[]=[]
      this.conditions[conditionName].riskFactorGroups.forEach(rfg=>{
        const { riskFactorGroupNode, ancestors } =this.initializeRiskFactorGroupNode(rfg, descriptions)
        rfgNames.push(conditionName + "." + ancestors.join("-"))
        rfgNodes.push(riskFactorGroupNode)
      })
      const causeNode=new CauseNode(rfgNames, this.ageFrom, this.ageTo, this.conditions[conditionName], this.rdat.findRiskFactors(conditionName))
      const conditionNode= ConditionClasses[conditionName](
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
            const { riskFactorGroupNode, ancestors } =this.initializeRiskFactorGroupNode(rfg, descriptions)
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

  computeInnerProbabilities(): DataRow[] | LifeExpectancyContributions {
    // Promise<DataRow[]> {
    if (this.allComputedNodes === null) {
      throw Error("It is not possible to compute survival data before calling compute()")
    }
    else {
      const finalNodeResults: CauseNodeResult[] = this.deathCauses.map((deathcause) => {
        return (this.allComputedNodes![deathcause.deathCauseName].value as CauseNodeResult)
      })
      if(this.useLifeExpectancy){ 
        const res=riskFactorContributionsLifeExpectancy(finalNodeResults, this.formUpdaters[0].getAgeFrom(this.allComputedNodes), this.rdat)
        console.log(res)
        return res;
      }
      else{
        return riskFactorContributions(finalNodeResults, this.formUpdaters[0].getAgeFrom(this.allComputedNodes), this.ageTo)
      }
    }
  }

  compute(factorAnswers: FactorAnswers) {
    let res: UpdateDic = this.inputFactorTreater.update(factorAnswers);
    this.formUpdaters.forEach((formUpdater, i) => {
      res[this.formUpdaterNames[i]] = formUpdater.update(res);
    });
    this.allComputedNodes = res;
    console.log("all computed nodes:")
    console.log(this.allComputedNodes);
    //this.computeAverage(factorAnswers)
  }

  computeAll(factorAnswers: FactorAnswers) {
    this.compute(factorAnswers)
    return { survivalData: this.computeSurvivalData(), innerCauses: this.computeInnerProbabilities(), summaryView: this.computeSummaryViewData() }
  }

  computeAverage(factorAnswers: FactorAnswers) {
    let avgFactorAnswers: FactorAnswers = {}
    Object.entries(factorAnswers).forEach(([factorName, factorObject]) => {
      if (factorName === "Age" || factorName === "Sex") {
        avgFactorAnswers[factorName] = factorAnswers[factorName]
        return;
      }
      avgFactorAnswers[factorName] = ""
    })
    let avgRes: UpdateDic = new FactorAnswersToUpdateForm().update(avgFactorAnswers);
    this.formUpdaters.forEach((formUpdater, i) => {
      avgRes[this.formUpdaterNames[i]] = formUpdater.update(avgRes);
    });
    const finalNodeResults: CauseNodeResult[] = this.deathCauses.map((deathcause) => {
      return (avgRes![deathcause.deathCauseName].value as CauseNodeResult)
    })
  }

  computeSurvivalData(): SurvivalCurveData[] {
    //Promise<SurvivalCurveData[]>{
    if (this.allComputedNodes === null) {
      throw Error("It is not possible to compute survival data before calling compute()")
    }
    const finalNodeResults: CauseNodeResult[] = this.deathCauses.map((deathcause) => {
      return (this.allComputedNodes![deathcause.deathCauseName].value as CauseNodeResult)
    })
    return survivalCurve(finalNodeResults, this.formUpdaters[0].getAgeFrom(this.allComputedNodes), this.ageTo)
  }

  computeSummaryViewData(): SummaryViewData {
    if (this.allComputedNodes === null) {
      throw Error("It is not possible to compute survival data before calling compute()")
    }
    const finalNodeResults: CauseNodeResult[] = this.deathCauses.map((deathcause) => {
      return (this.allComputedNodes![deathcause.deathCauseName].value as CauseNodeResult)
    })
    return computeSummaryView(finalNodeResults, this.formUpdaters[0].getAgeFrom(this.allComputedNodes), this.ageTo, this.inputFactorTreater.getRecentChanges())
  }
}
