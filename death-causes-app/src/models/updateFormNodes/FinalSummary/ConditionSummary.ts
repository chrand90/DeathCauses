import { DataRow } from "../../../components/PlottingData";
import RelationLinks from "../../RelationLinks";
import CauseNodeResult from "../CauseNodeResult";
import { ConditionNodeResult, DimensionStatus, ProbabilityObject, TypeStatus, UpdateDic, UpdateForm } from "../UpdateForm";
import { computeProbOfNotDying, probOfStillBeingAlive } from "./CommonSummarizerFunctions";
import survivalCurve from "./SurvivalCurve";

export interface ConditionsRes {
    averageProportion: {[conditionName: string] : DataRow},
    probOfHavingWhileDying: {[conditionName: string]: DataRow}
}

interface stringToNum {
    [key:string]: number
}

export function conditionsContributions(
    causeNodeResults: CauseNodeResult[], 
    conditionNodes: UpdateDic,
    rdat: RelationLinks
    ): ConditionsRes{

    const notDyingProb= computeProbOfNotDying(causeNodeResults);
    const survivalCurve= probOfStillBeingAlive(causeNodeResults);
    const survivalCurveSum=survivalCurve.reduce((a,b) => a+b,0)
    const survivalWeights=survivalCurve.map(s => s/survivalCurveSum)
    const deathSum=notDyingProb.map((p,i) => (1-p)*survivalCurve[i]).reduce((a,b)=> a+b,0)
    const deathWeights=notDyingProb.map((p,i) => (1-p)*survivalCurve[i]/deathSum);
    
    const averageProportion: {[conditionName: string] : DataRow}={};
    const probOfHavingWhileDying: {[conditionName: string] : DataRow}={};
    Object.entries(conditionNodes).forEach(([key, conditionNode]) => {
        const ancestors=rdat.getAncestors(key)
        const basicInnerCauses=Object.fromEntries(
            ancestors.map(ancestor => [ancestor, 0.0])
        )
        basicInnerCauses["Pre-existing"]=0.0
        if(conditionNode.type===TypeStatus.STRING){
            if(conditionNode.dimension === DimensionStatus.YEARLY){
                averageProportion[key]=yearlyConstants(conditionNode.value as string[], survivalWeights, key, basicInnerCauses);
                probOfHavingWhileDying[key]=yearlyConstants(conditionNode.value as string[], deathWeights, key, basicInnerCauses);
            }
            if(conditionNode.value as string ==="Yes"){
                averageProportion[key] = {
                    totalProb: 1.0,
                    name: key,
                    innerCauses: {...basicInnerCauses, "Pre-existing": 1.0}
                }
                probOfHavingWhileDying[key]=averageProportion[key];
            }
        }
        else{
            //in this case there are some for every 
            if(conditionNode.dimension === DimensionStatus.YEARLY){
                averageProportion[key]=randomYearlyConstants(conditionNode.value as ConditionNodeResult, survivalWeights, key, basicInnerCauses);
                probOfHavingWhileDying[key]=randomYearlyConstants(conditionNode.value as ConditionNodeResult, deathWeights, key, basicInnerCauses);
            }
            else{
                averageProportion[key] =randomSingleConstant(conditionNode.value as ConditionNodeResult, key, basicInnerCauses);
                probOfHavingWhileDying[key]=averageProportion[key];
            }
        }
    })
    return {averageProportion, probOfHavingWhileDying}
}



function yearlyConstants(constants: string[], multiplier: number[], conditionName: string, basicInnerCauses: stringToNum): DataRow {
    let res=0;
    for(let i=0; i<constants.length; i++){
        if(constants[i]==="Yes"){
            res+=multiplier[i]
        }
    }
    return {
        name: conditionName,
        totalProb: res,
        innerCauses: {...basicInnerCauses, "Pre-existing": 1}
    }
}

function randomSingleConstant(constants: ConditionNodeResult, conditionName:string, basicInnerCauses: stringToNum): DataRow{
    return {
        name: conditionName,
        totalProb: (constants.probs as ProbabilityObject)["Yes"],
        innerCauses: {...basicInnerCauses, ...constants.perYearInnerCauses as {[k: string]: number}},
        comparisonWithBestValues: constants.bestValues
    }
}

function randomYearlyConstants(constants: ConditionNodeResult, multiplier: number[], conditionName: string,basicInnerCauses: stringToNum): DataRow {
    let res=0;
    
    let innerCauses= Object.fromEntries(
        Array.isArray(constants.perYearInnerCauses) ? 
        Object.keys(constants.perYearInnerCauses[0]).map(
            k => [k,0]
        ) :
        Object.keys(constants.perYearInnerCauses).map(
            k => [k,0]
        )
    )
    if(Array.isArray(constants.perYearInnerCauses)){
        const perYearInnerCauses=constants.perYearInnerCauses as {[k: string]: number}[]
        for(let i=0; i<constants.probs.length; i++){
            res+=multiplier[i]*(constants.probs as ProbabilityObject[])[i]["Yes"]
            Object.keys(innerCauses).forEach(k => {
                innerCauses[k]+=perYearInnerCauses[i][k]*multiplier[i];
            })
        }
    }
    else{
        innerCauses=constants.perYearInnerCauses as {[k: string]: number}
        for(let i=0; i<constants.probs.length; i++){
            res+=multiplier[i]*(constants.probs as ProbabilityObject[])[i]["Yes"]
        }
    }
    
    return {
        name: conditionName,
        totalProb: res,
        innerCauses: {...basicInnerCauses, ...innerCauses},
        comparisonWithBestValues: constants.bestValues
    }
}

