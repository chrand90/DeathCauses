import { SurvivalCurveData } from "../../components/Calculations/SurvivalCurveData";
import DeathCause, {
  RiskFactorGroupsContainer,
} from "../../components/database/Deathcause";
import { DataRow } from "../../components/PlottingData";
import { FactorAnswers } from "../Factors";
import RelationLinks, { NodeType } from "../RelationLinks";
import CauseNode from "./CauseNode";
import CauseNodeResult from "./CauseNodeResult";
import { ComputedFactorClasses } from "./ComputedFactors";
import FormUpdater from "./FormUpdater";
import RiskFactorGroupNode from "./RiskFactorGroupNode";
import survivalCurve from "./FinalSummary/SurvivalCurve";
import { UpdateDic } from "./UpdateForm";
import { FactorAnswersToUpdateForm } from "./FactorAnswersToUpdateForm";
import riskFactorContributions from "./FinalSummary/RiskFactorContributions";

export default class ComputeController {
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
    this.allComputedNodes=null;
  }

  initialize(rdat: RelationLinks) {
    rdat.sortedNodes[NodeType.COMPUTED_FACTOR].forEach((computedFactorName) => {
      let ancestors = rdat.getAncestors(computedFactorName);
      if (!(computedFactorName in ComputedFactorClasses)) {
        throw (
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
        const causeAncestors=rdat.findCauseCategoryAncestors(deathCause.deathCauseName)
        let ancestors: string[]=[];
        causeAncestors.forEach((causeOrCategory:string) => {
            if(causeOrCategory in causeToRFGNames){
              ancestors=ancestors.concat(causeToRFGNames[causeOrCategory])
            }
        })
        this.formUpdaters.push(new CauseNode(ancestors, this.ageFrom, this.ageTo, deathCause))
        this.formUpdaterNames.push(deathCause.deathCauseName);
    });
  }

  computeInnerProbabilities(): DataRow[] {
    // Promise<DataRow[]> {
    if(this.allComputedNodes === null){
        throw Error("It is not possible to compute survival data before calling compute()")
    }
    else{
      const finalNodeResults: CauseNodeResult[]= this.deathCauses.map((deathcause) => {
        return (this.allComputedNodes![deathcause.deathCauseName].value as CauseNodeResult)
      })
      return riskFactorContributions(finalNodeResults, this.formUpdaters[0].getAgeFrom(this.allComputedNodes), this.ageTo)
    }
  }

  compute(factorAnswers: FactorAnswers){
    let res: UpdateDic = this.inputFactorTreater.update(factorAnswers);
    this.formUpdaters.forEach((formUpdater, i) => {
      res[this.formUpdaterNames[i]] = formUpdater.update(res);
    });
    this.allComputedNodes=res;
    console.log(this.allComputedNodes);
  }

  computeAll(factorAnswers: FactorAnswers){
      this.compute(factorAnswers)
      return {survivalData: this.computeSurvivalData(), innerCauses: this.computeInnerProbabilities()}
  }

  computeSurvivalData(): SurvivalCurveData[] {
    //Promise<SurvivalCurveData[]>{
      if(this.allComputedNodes === null){
        throw Error("It is not possible to compute survival data before calling compute()")
      }
      else{
        const finalNodeResults: CauseNodeResult[]= this.deathCauses.map((deathcause) => {
          return (this.allComputedNodes![deathcause.deathCauseName].value as CauseNodeResult)
        })
        return survivalCurve(finalNodeResults, this.formUpdaters[0].getAgeFrom(this.allComputedNodes), this.ageTo)
      }
      
    // return this.compute(factorAnswers).then((udic:UpdateDic) => {
    //     return updateDicToFactorAnswers(udic);
    // }).then((fAnswers: FactorAnswers) => {
    //     return this.calculationFacade.calculateSurvivalCurve(fAnswers);
    // })
  }
}
