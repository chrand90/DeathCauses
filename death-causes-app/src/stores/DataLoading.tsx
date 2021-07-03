import InputJson from "../models/FactorJsonInput";
import Factors from "../models/Factors";
import RelationLinks, { RelationLinkJson } from "../models/RelationLinks";
import DeathCause, { RawDeathCauseJson, RiskFactorGroupsContainer } from "../components/database/Deathcause";
import Deathcause from "../components/database/Deathcause";
import Descriptions, { DescriptionsJson } from "../models/Descriptions";

export interface LoadedFactors {
    factors: Factors;
    rawFactorInput: InputJson;
}

export interface LoadedDescriptions {
    rawDescriptions: DescriptionsJson;
    descriptions: Descriptions;
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

async function loadFromFile<T>(filename: string){
    let urlStart=""
    if(process.env.NODE_ENV === "development"){
        urlStart+="http://localhost:5000"
    }
    else{
        urlStart+=""
    }
    const link=urlStart+"/api/data/"+filename
    console.log("fetching link: "+link)
    let prom= await fetch(link).then((response) => {
        if(!response.ok){
            console.error(response.statusText)
            throw response.statusText;
        }
        return response.json();
        }).catch( () => {
            return {} as T
        }
    );
    return (prom as T);
}

function later<T>(delay: number, value:T) {
    return new Promise<T>(resolve => setTimeout(resolve, delay, value));
}

export async function loadFactors():Promise<LoadedFactors> {
    const inputJson= await loadFromFile<InputJson>("FactorDatabase.json")
    const factors = new Factors(inputJson);
    return {factors: factors, rawFactorInput: inputJson}
}

export async function loadRelationLinks():Promise<LoadedRelationLinks> {
    const rawRelationLinks= await loadFromFile<RelationLinkJson>("Relations.json");
    const rdat= new RelationLinks(rawRelationLinks);
    return {rdat:rdat, rawRelationLinks: rawRelationLinks};
}

export async function loadDescriptions(): Promise<LoadedDescriptions> {
    const rawDescriptions= await loadFromFile<DescriptionsJson>("Descriptions.json");
    const descriptions= new Descriptions(rawDescriptions);
    return {rawDescriptions: rawDescriptions, descriptions: descriptions};
}

export async function loadCauseData():Promise<LoadedCauseData> {
    const rawData: RawDeathCauseJson = await loadFromFile<RawDeathCauseJson>("Causes.json");
    const rawCategoryData: RawDeathCauseJson = await loadFromFile<RawDeathCauseJson>("CategoryCauses.json");    
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
    return {
        rawCauseData: rawData,
        deathcauses: deathcauses,
        rawCategoryData: rawCategoryData,
        deathcauseCategories: deathcauseCategories,
    }
}