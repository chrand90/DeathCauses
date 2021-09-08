import RelationLinks from "../../models/RelationLinks";
import FrequencyTable, { FrequencyJson } from "./FrequencyTable";
import { RiskFactorGroup, RiskFactorGroupJson } from "./RickFactorGroup";
import { SpecialFactorTable, SpecialFactorTableJson } from "./RiskRatioTable";

export interface DeathCauseJson {
    Age?: FrequencyJson;
    RiskFactorGroups: RiskFactorGroupJson[];
}


export interface ConditionJson extends DeathCauseJson {
    SpecialFactorGroups: SpecialFactorTableJson[][];
}

export interface RawDeathCauseJson {
    [deathCauseName: string]: DeathCauseJson;
}



export class RiskFactorGroupsContainer {
    riskFactorGroups: RiskFactorGroup[];
    deathCauseName: string;
    optimizabilityClasses: string[][] | null=null;

    constructor(json: DeathCauseJson, name: string) {
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

    getAllFactorNames(){
        return this.riskFactorGroups.flatMap((rfg: RiskFactorGroup) => {
            return Array.from(rfg.getAllFactorsInGroup())
        })
    }

}

export default class DeathCause extends RiskFactorGroupsContainer{
    ages: FrequencyTable;

    constructor(json: DeathCauseJson, name: string) {
        super(json, name);
        if(json.Age!==undefined){
            this.ages = new FrequencyTable(json.Age);
        }
        else{
            this.ages = new FrequencyTable({age_classification:[], age_prevalences:[]});
        }
    }
}

export class Condition extends DeathCause {
    specialFactorTables: SpecialFactorTable[]

    constructor(json: ConditionJson, name: string){
        super(json, name)
        this.specialFactorTables=[]
        json.SpecialFactorGroups.forEach(listOfSpecialFactorTables => {
            listOfSpecialFactorTables.forEach((specialFactorTableJSON: SpecialFactorTableJson) => {
                this.specialFactorTables.push(new SpecialFactorTable(specialFactorTableJSON))
            })
        })
    }

    
}

