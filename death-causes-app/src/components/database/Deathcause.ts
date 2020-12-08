import FrequencyTable, { FrequencyInput } from "./Age";
import { RiskFactorGroup, RiskFactorGroupInput } from "./RickFactorGroup";

interface DeathcauseInput {
    Age: FrequencyInput;
    RiskFactorGroups: RiskFactorGroupInput[];
}

export class Deathcause {
    age: FrequencyTable;
    riskFactorGroups: RiskFactorGroup[];
    deathCauseName: string;

    constructor(json: DeathcauseInput, name: string) {
        this.age = new FrequencyTable(json.Age);
        this.riskFactorGroups = json.RiskFactorGroups.map(element => {
            return new RiskFactorGroup(element)
        });
        this.deathCauseName = name
    }
}

export default Deathcause;