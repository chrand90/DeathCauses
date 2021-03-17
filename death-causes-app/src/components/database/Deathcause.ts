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

    constructor(json: DeathCauseJson, name: string) {
        this.ages = new FrequencyTable(json.Age);
        this.riskFactorGroups = json.RiskFactorGroups.map(element => {
            return new RiskFactorGroup(element)
        });
        this.deathCauseName = name
    }
}

export default DeathCause;