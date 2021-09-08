import { Condition } from "../../components/database/Deathcause";
import { SpecialFactorTable } from "../../components/database/RiskRatioTable";
import CauseNode from "./CauseNode";
import CauseNodeResult from "./CauseNodeResult"
import FormUpdater from "./FormUpdater"
import addDistributionsForMissing from "./ReplacementDistribution";
import RiskRatioGroupNode from "./RiskFactorGroupNode"
import { ChangeStatus, DimensionStatus, MissingStatus, ProbabilityObject, StochasticStatus, TypeStatus, UpdateDic, UpdateForm } from "./UpdateForm"

export abstract class ConditionNode extends FormUpdater{

    riskFactorGroupNodes: RiskRatioGroupNode[];
    riskFactorGroupNodeNames: string[]
    causeNode: CauseNode
    condition: Condition

    constructor(
        ancestors: string[], 
        ageFrom:number | null, 
        ageTo:number, 
        condition: Condition,
        riskFactorGroupNodes: RiskRatioGroupNode[],
        riskFactorGroupNodesNames: string[],
        causeNode: CauseNode
        ){
        super(ancestors, ageFrom, ageTo)
        this.riskFactorGroupNodes=riskFactorGroupNodes;
        this.riskFactorGroupNodeNames=riskFactorGroupNodesNames;
        this.causeNode=causeNode;
        this.condition=condition;
    }

    //overwriting
    handleMissing(allPreviousUpdateForms: UpdateDic){
        if(this.isAllButAgeMissing(allPreviousUpdateForms)){
            return {
                change: ChangeStatus.CHANGED,
                missing: MissingStatus.MISSING,
                type: TypeStatus.STRING,
                dimension: DimensionStatus.SINGLE,
                random: StochasticStatus.DETERMINISTIC,
                value: ""
            }
        }
        else{
            return this.compute(allPreviousUpdateForms);
        }

    }

    computeCauseNode(allPreviousUpdateForms: UpdateDic){
        let riskFactorResults: UpdateDic={}
        this.riskFactorGroupNodes.forEach((node: RiskRatioGroupNode, index: number) => {
            riskFactorResults[this.riskFactorGroupNodeNames[index]]=node.update(allPreviousUpdateForms);
        })
        let combinedUpdateDic={...riskFactorResults, ...allPreviousUpdateForms}
        return this.causeNode.update(combinedUpdateDic);
    }

    computeChronicIllness(allPreviousUpdateForms: UpdateDic, alreadyIllVariable: string, alreadyIllTable: SpecialFactorTable):UpdateForm {
        const startAge = this.getAgeFrom(allPreviousUpdateForms);
        const endAge = this.getAgeTo();

        let probOfStartingWithDisease: number;
        if(allPreviousUpdateForms[alreadyIllVariable].missing===MissingStatus.MISSING){
            const variablesInTable= alreadyIllTable.getFactorNames()
            let relevantUpdateForms: UpdateDic = {}
            variablesInTable.forEach(varName => {
                if(allPreviousUpdateForms[varName].missing===MissingStatus.NONMISSING){
                    relevantUpdateForms[varName]=allPreviousUpdateForms[varName]
                }
            })
            const dependsOnAge = variablesInTable.includes("Age") || variablesInTable.some(varName => {
                return allPreviousUpdateForms[varName].dimension===DimensionStatus.YEARLY;
            })
            addDistributionsForMissing(
                [alreadyIllVariable],
                relevantUpdateForms,
                startAge,
                endAge,
                dependsOnAge,
                [alreadyIllTable],
                (a,b,c) => this.getFactorAnswerValue(a,b,c))
            if(relevantUpdateForms[alreadyIllVariable].dimension===DimensionStatus.YEARLY){
                probOfStartingWithDisease=(relevantUpdateForms[alreadyIllVariable].value as ProbabilityObject[])[0]["Yes"]
            }
            else{
                probOfStartingWithDisease=(relevantUpdateForms[alreadyIllVariable].value as ProbabilityObject)["Yes"]
            }
            
        }
        else if(allPreviousUpdateForms[alreadyIllVariable].value==="Yes"){
            return {
                type: TypeStatus.STRING,
                dimension: DimensionStatus.SINGLE,
                random: StochasticStatus.DETERMINISTIC,
                missing: MissingStatus.NONMISSING,
                change: ChangeStatus.CHANGED,
                value: "Yes"
            }
        }
        else if(allPreviousUpdateForms[alreadyIllVariable].value==="No"){
            probOfStartingWithDisease=0
        }
        else{
            throw Error("The variables was neither missing nor yes nor no: VAR="+alreadyIllVariable)
        }
        const causeNodeResult=this.computeCauseNode(allPreviousUpdateForms).value as CauseNodeResult
        let probOfIllness=probOfStartingWithDisease;
        let cumprobs: number[]=[]
        for(let i=0; i<causeNodeResult.probs.length; i++){
            probOfIllness=probOfIllness+(1-probOfIllness)*causeNodeResult.probs[i];
            cumprobs.push(probOfIllness)
        }
        return {
            type: TypeStatus.CONDITIONRESULT,
            random: StochasticStatus.RANDOM,
            dimension: DimensionStatus.YEARLY,
            change: ChangeStatus.CHANGED,
            missing: MissingStatus.NONMISSING,
            value: {
                probs: cumprobs.map(p => {
                    return {"No":1-p, "Yes":p}
                }),
                name: this.condition.deathCauseName,
                perYearInnerCauses: causeNodeResult.perYearInnerCauses,
                bestValues: causeNodeResult.bestValues
            }
        }
    }

}

class DiabetesCondition extends ConditionNode{

    compute(allPreviousUpdateForms: UpdateDic){
        return this.computeChronicIllness(
            allPreviousUpdateForms, 
            "DiabetesStatus",
            this.condition.specialFactorTables[0])
    }
}


type InitializerFunction = (
        ancestors: string[], 
        ageFrom: null | number, 
        ageTo: number,
        condition: Condition,
        riskFactorGroupNodes: RiskRatioGroupNode[],
        riskFactorGroupNodesNames: string[],
        causeNode: CauseNode
    ) => FormUpdater


interface FormUpdaterInitializers {
    [key: string]: InitializerFunction
}

function packConstructor(classDefinition: any): InitializerFunction {
    return (
        ancestors: string[], 
        ageFrom: null | number, 
        ageTo: number,
        condition: Condition,
        riskFactorGroupNodes: RiskRatioGroupNode[],
        riskFactorGroupNodesNames: string[],
        causeNode: CauseNode
    ) => new classDefinition(
        ancestors, 
        ageFrom, 
        ageTo, 
        condition, 
        riskFactorGroupNodes, 
        riskFactorGroupNodesNames, 
        causeNode
        )
}

export const ConditionClasses: FormUpdaterInitializers={
    "DiabetesCondition": packConstructor(DiabetesCondition),
}
