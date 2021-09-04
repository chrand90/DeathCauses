import Descriptions from "../../models/Descriptions";
import { KnowledgeableOptimizabilities } from "../../models/Optimizabilities";
import { CauseGrouping, NodeType } from "../../models/RelationLinks";
import { InnerCause } from "../../models/updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy";
import RootStore from "../../stores/rootStore";
import { ConditionVizFlavor } from "../../stores/UIStore";
import { DataSet } from "../PlottingData";
import BarChartSettings, { CollapseCatsData, ExpandCatsData } from "./BarChartSettings";

export default class ConditionsBarChartSettings extends BarChartSettings{
    
    conditionFlavor: ConditionVizFlavor;

    constructor(conditionFlavor: ConditionVizFlavor, descriptions: Descriptions){
        super(false, true, descriptions);
        this.conditionFlavor=conditionFlavor;
    }

    getElementToWidth(store: RootStore): string | null{
        return store.barChartStore.conditionToWidth;
    }

    setElementToWidth(store: RootStore){
        return store.barChartStore.setConditionToWidth;
    }

    getGrouping(store: RootStore): CauseGrouping{
        const conditions=store.loadedDataStore.rdat.sortedNodes[NodeType.CONDITION]
        return {
            causeToParent: Object.fromEntries(conditions.map(c => [c,c])),
            parentToCauses: Object.fromEntries(conditions.map(c=> [c,[c]]))
        }
    }

    getHeader(): string{
        return this.conditionFlavor
    }

    getUseLifeExpectancy(){
        return false;
    }

    getConditionVizFlavor(){
        return this.conditionFlavor;
    }

    computeExpandSquares(dataset: DataSet | InnerCause, removed: string[], added: string[], diseaseToWidth: string | null, oldCollectedGroups: CauseGrouping, newCollectedGroups: CauseGrouping, optimizabilities: KnowledgeableOptimizabilities): ExpandCatsData {
        throw new Error("Conditions should never be expanded.");
    }

    computeCollapseSquares(dataset: DataSet | InnerCause, removed: string[], added: string[], diseaseToWidth: string | null, oldCollectedGroups: CauseGrouping, newCollectedGroups: CauseGrouping, optimizabilities: KnowledgeableOptimizabilities): CollapseCatsData {
        throw new Error("Conditions should never be collapsed");
    }
    

}