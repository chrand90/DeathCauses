import RelationLinks from "../../models/RelationLinks";
import FrequencyTable, { FrequencyJson } from "./FrequencyTable";
import { RiskFactorGroup, RiskFactorGroupJson } from "./RickFactorGroup";

export interface DeathCauseJson {
    Age: FrequencyJson;
    RiskFactorGroups: RiskFactorGroupJson[];
}

export class DeathCause {
    ages: FrequencyTable;
    riskFactorGroups: RiskFactorGroup[];
    deathCauseName: string;
    optimizabilityClasses: string[][] | null=null;

    constructor(json: DeathCauseJson, name: string) {
        this.ages = new FrequencyTable(json.Age);
        this.riskFactorGroups = json.RiskFactorGroups.map(element => {
            return new RiskFactorGroup(element)
        });
        this.deathCauseName = name
    }

    getAllFactorNamesWithoutAge(){
        return this.riskFactorGroups.flatMap((rfg: RiskFactorGroup) => {
            return Array.from(rfg.getAllFactorsInGroup())
        }).filter((d: string) => {
            return d!=="Age"
        })
    }

    getOptimizabilityClasses(rdat: RelationLinks){
        if(this.optimizabilityClasses === null){
            this.optimizabilityClasses= rdat.getOptimizabilityClasses(
                this.getAllFactorNamesWithoutAge()
            )
        }
        return this.optimizabilityClasses;
    }
}

export default DeathCause;