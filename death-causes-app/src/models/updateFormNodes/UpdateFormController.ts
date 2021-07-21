import { SurvivalCurveData } from "../../components/Calculations/SurvivalCurveData";
import DeathCause, {
  RiskFactorGroupsContainer
} from "../../components/database/Deathcause";
import { DataRow } from "../../components/PlottingData";
import { FactorAnswers } from "../Factors";
import RelationLinks, { NodeType } from "../RelationLinks";
import CauseNode from "./CauseNode";
import CauseNodeResult from "./CauseNodeResult";
import { ComputedFactorClasses } from "./ComputedFactors";
import { FactorAnswersToUpdateForm } from "./FactorAnswersToUpdateForm";
import riskFactorContributions from "./FinalSummary/RiskFactorContributions";
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

  constructor(
    rdat: RelationLinks,
    ageFrom: null | number,
    ageTo: number = 120,
    deathCauses: DeathCause[],
    deathCauseCategories: RiskFactorGroupsContainer[]
  ) {
    this.formUpdaters = [];
    this.formUpdaterNames = [];
    this.inputFactorTreater = new FactorAnswersToUpdateForm();
    this.ageFrom = ageFrom;
    this.ageTo = ageTo;
    this.deathCauses = deathCauses;
    this.deathCauseCategories = deathCauseCategories;
    this.initialize(rdat);
    this.allComputedNodes = null;
  }

  initialize(rdat: RelationLinks) {
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
    const causeToRFGNames: { [a: string]: string[] } = {};
    this.deathCauseCategories
      .concat(this.deathCauses)
      .forEach((riskFactorContainer: RiskFactorGroupsContainer) => {
        if (riskFactorContainer.riskFactorGroups.length > 0) {
          causeToRFGNames[riskFactorContainer.deathCauseName] = [];
          riskFactorContainer.riskFactorGroups.map((rfg) => {
            const ancestors = [...Array.from(rfg.getAllFactorsInGroup())];
            const optims = rdat.getOptimizabilityClasses(ancestors);
            const riskFactorGroupNode = new RiskFactorGroupNode(
              ancestors,
              this.ageFrom,
              this.ageTo,
              rfg,
              optims
            );
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
      this.formUpdaters.push(new CauseNode(ancestors, this.ageFrom, this.ageTo, deathCause))
      this.formUpdaterNames.push(deathCause.deathCauseName);
    });
  }

  computeInnerProbabilities(): DataRow[] {
    // Promise<DataRow[]> {
    if (this.allComputedNodes === null) {
      throw Error("It is not possible to compute survival data before calling compute()")
    }
    else {
      const finalNodeResults: CauseNodeResult[] = this.deathCauses.map((deathcause) => {
        return (this.allComputedNodes![deathcause.deathCauseName].value as CauseNodeResult)
      })
      return riskFactorContributions(finalNodeResults, this.formUpdaters[0].getAgeFrom(this.allComputedNodes), this.ageTo)
    }
  }

  compute(factorAnswers: FactorAnswers) {
    this.computeAverage(factorAnswers)
    let res: UpdateDic = this.inputFactorTreater.update(factorAnswers);
    this.formUpdaters.forEach((formUpdater, i) => {
      res[this.formUpdaterNames[i]] = formUpdater.update(res);
    });
    this.allComputedNodes = res;
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
      avgRes[this.formUpdaterNames[i]] = formUpdater.update(avgRes, false);
    });
    const finalNodeResults: CauseNodeResult[] = this.deathCauses.map((deathcause) => {
      return (avgRes![deathcause.deathCauseName].value as CauseNodeResult)
    })

    let tmp = computeSummaryView(finalNodeResults, this.formUpdaters[0].getAgeFrom(this.allComputedNodes!), this.ageTo)
    console.log(tmp)
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
    return computeSummaryView(finalNodeResults, this.formUpdaters[0].getAgeFrom(this.allComputedNodes), this.ageTo)
  }
}
