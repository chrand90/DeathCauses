import { Condition, ConditionJson, default as DeathCause, default as Deathcause, RawDeathCauseJson, RiskFactorGroupsContainer } from "../components/database/Deathcause";
import Descriptions, { DescriptionsJson } from "../models/Descriptions";
import InputJson from "../models/FactorJsonInput";
import Factors from "../models/Factors";
import Optimizabilities from "../models/Optimizabilities";
import RelationLinks, { RelationLinkJson } from "../models/RelationLinks";

export interface LoadedFactors {
    factors: Factors;
    rawFactorInput: InputJson;
}

export interface LoadedConditions {
    conditions: {[conditionName: string]: Condition};
    rawConditions: ConditionJson;
}

export interface LoadedDescriptions {
    rawDescriptions: DescriptionsJson;
    descriptions: Descriptions;
    optimizabilities: Optimizabilities;
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

export async function loadFactors():Promise<LoadedFactors> {
    const inputJson= await loadFromFile<InputJson>("FactorDatabase.json")
    const factors = new Factors(inputJson);
    return {factors: factors, rawFactorInput: inputJson}
}

export async function loadICD():Promise<{[cause: string]: string[]}> {
    const loadedICD=await loadFromFile<{[cause:string]:string[]}>("ICDMinimum.json")
    return loadedICD
}

export async function loadConditions():Promise<LoadedConditions> {
    const rawConditions= await loadFromFile<ConditionJson>("Conditions.json")
    const conditions:{[k:string]:Condition}={}
    Object.entries(rawConditions).forEach(([conditionName, conditionObject]) => {
        conditions[conditionName]=new Condition(conditionObject, conditionName);
    })
    return {rawConditions, conditions};
}

export async function loadRelationLinks():Promise<LoadedRelationLinks> {
    const rawRelationLinks= await loadFromFile<RelationLinkJson>("Relations.json");
    const rdat= new RelationLinks(rawRelationLinks);
    return {rdat:rdat, rawRelationLinks: rawRelationLinks};
}

export async function loadLifeExpectancies():Promise<number[]> {
    return await loadFromFile<number[]>("lifeTable.json");
}

export async function loadDescriptions(): Promise<LoadedDescriptions> {
    const rawDescriptions= await loadFromFile<DescriptionsJson>("Descriptions.json");
    const descriptions= new Descriptions(rawDescriptions);
    const optimizabilities= new Optimizabilities(rawDescriptions)
    return {rawDescriptions: rawDescriptions, descriptions: descriptions, optimizabilities: optimizabilities};
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