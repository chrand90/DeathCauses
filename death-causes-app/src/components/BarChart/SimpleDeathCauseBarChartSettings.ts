import Descriptions from "../../models/Descriptions";
import { CauseGrouping, ParentToCausesMapping, CauseToParentMapping } from "../../models/RelationLinks";
import RootStore from "../../stores/rootStore";
import DeathCauseBarChartSettings from "./DeathCauseBarChartSettings";


export default class SimpleDeathCauseBarChartSettings extends DeathCauseBarChartSettings{

    constructor(useLifeExpectancy: boolean, descriptions: Descriptions){
        super(true, useLifeExpectancy, descriptions);
    }

    getElementToWidth(store: RootStore): string | null{
        return store.barChartStore.diseaseToWidth;
    }

    setElementToWidth(store: RootStore){
        return store.barChartStore.setDiseaseToWidth;
    }

    getGrouping(store: RootStore): CauseGrouping{
        return simplifyGrouping(store.barChartStore.explicitCollectedGroups, this.useLifeExpectancy);
    }

    getHeader(): string{
        return "Probability of dying from cause"
    }
}

function simplifyGrouping(grouping: CauseGrouping, useLifeExpectancy: boolean=false): CauseGrouping {
  
    let parentToCauses: ParentToCausesMapping = {};
    let causeToParent: CauseToParentMapping = {};
    if(useLifeExpectancy){
      parentToCauses["any cause"]=["any cause"]
      causeToParent["any cause"]="any cause"
      return { parentToCauses, causeToParent }
    }
    const allCauses = Object.keys(grouping.causeToParent);
    parentToCauses["any cause"] = allCauses;
    allCauses.forEach((d) => {
      causeToParent[d] = "any cause";
    });
    return { parentToCauses, causeToParent };
}
