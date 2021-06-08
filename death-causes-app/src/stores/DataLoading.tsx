import InputJson from "../models/FactorJsonInput";
import factorDatabase from "../resources/FactorDatabase.json";
import Factors from "../models/Factors";
import RelationLinks, { RelationLinkJson } from "../models/RelationLinks";
import relationLinkFile from "../resources/Relations.json";
import DeathCause, { RawDeathCauseJson, RiskFactorGroupsContainer } from "../components/database/Deathcause";
import causesData from "../resources/Causes.json";
import causesCategoryData from "../resources/CategoryCauses.json";
import Deathcause from "../components/database/Deathcause";

export interface LoadedFactors {
    factors: Factors;
    rawFactorInput: InputJson;
}

export interface LoadedRelationLinks {
    rdat: RelationLinks;
    rawRelationLinks: RelationLinkJson;
}

export interface LoadedCauseData {
    rawCauseData: RawDeathCauseJson;
    deathcauses: DeathCause[];
    rawCategoryData: RawDeathCauseJson;
    deathcauseCategories: RiskFactorGroupsContainer[];
}

function later<T>(delay: number, value:T) {
    return new Promise<T>(resolve => setTimeout(resolve, delay, value));
}

export async function loadFactors():Promise<LoadedFactors> {
    const factors = new Factors(factorDatabase as InputJson);
    return later<LoadedFactors>(500,{factors: factors, rawFactorInput: (factorDatabase as InputJson)})
}

export async function loadRelationLinks():Promise<LoadedRelationLinks> {
    const rdat= new RelationLinks(relationLinkFile as RelationLinkJson);
    return later<LoadedRelationLinks>(300, {rdat:rdat, rawRelationLinks: relationLinkFile as RelationLinkJson});
}

export async function loadCauseData():Promise<LoadedCauseData> {
    const rawData: RawDeathCauseJson = causesData as RawDeathCauseJson;
    const rawCategoryData: RawDeathCauseJson = causesCategoryData as RawDeathCauseJson;
    let deathcauses: DeathCause[]=[];
    let deathcauseCategories: RiskFactorGroupsContainer[]=[];
    Object.entries(rawData).forEach(([key, deathcause]) => {
      deathcauses.push(new Deathcause(deathcause, key));
    }); 
    Object.entries(rawCategoryData).forEach(([key, deathcause]) => {
        deathcauseCategories.push(
        new RiskFactorGroupsContainer(deathcause, key)
      );
    });
    return later<LoadedCauseData>(400, {
        rawCauseData: rawData,
        deathcauses: deathcauses,
        rawCategoryData: rawCategoryData,
        deathcauseCategories: deathcauseCategories,
    })
}