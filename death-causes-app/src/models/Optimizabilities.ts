import { DescriptionsJson } from "./Descriptions";
import { FactorAnswers } from "./Factors";
import { MultifactorGainType } from "./updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy";


export interface ConditionalOptimizability {
    default: number;
    conditionals: {[otherNode: string] : {[otherNodeValue: string]: number}}
}

export interface NodeToOptimizability {
    [nodeName: string]: number | ConditionalOptimizability;
  }
  
  export interface NodeToComputedOptimizability {
    [nodeName: string]: number;
  }
  
  export interface OptimizabilityToNodes {
    [optim: string]: string[];
  }

export default class Optimizabilities {
    optimizabilities: NodeToOptimizability={};

    constructor(descriptionsJson: DescriptionsJson){
        Object.entries(descriptionsJson).forEach(([nodeName, nodeDescriptions]) => {
            if(nodeDescriptions.optimizability){
              this.optimizabilities[nodeName]=nodeDescriptions.optimizability;
            }
        })
        this.optimizabilities[MultifactorGainType.UNKNOWN]=0
        this.optimizabilities[MultifactorGainType.KNOWN]=5
        this.optimizabilities["Unspecified"]=0
    }


    getOptimizability(nodeName: string, factorAnswers: FactorAnswers): number{
      if(nodeName in this.optimizabilities){
        if(typeof this.optimizabilities[nodeName] === "number"){
          return this.optimizabilities[nodeName] as number;
        }
        else{
          return evaluateOptimizabilityObject(this.optimizabilities[nodeName] as ConditionalOptimizability, factorAnswers)
        }
      }
      console.error(`There is no optimizability for ${nodeName}).`)
      throw Error("A requested optimizability does not exist.")
    }

}

export class KnowledgeableOptimizabilities {
    optimizabilitiesObject: Optimizabilities;
    nodeToOptimizability: NodeToComputedOptimizability;


    constructor(optimizabilitiesObject: Optimizabilities, factorAnswers: FactorAnswers){
        this.optimizabilitiesObject=optimizabilitiesObject;
        this.nodeToOptimizability=Object.fromEntries(
            Object.keys(optimizabilitiesObject.optimizabilities).map( nodeName => {
                return [nodeName, optimizabilitiesObject.getOptimizability(nodeName, factorAnswers)]
            })
        )
    }

    getOptimizability(nodeName: string): number{
        return this.nodeToOptimizability[nodeName]
    }

    getOptimizabilityClasses(nodeNames: string[]): OptimizabilityToNodes {
        const optims: OptimizabilityToNodes = {}
        nodeNames.forEach(nodeName => {
          const optim=this.nodeToOptimizability[nodeName]
          const stringOptim=optim.toString()
          if(stringOptim in optims){
            optims[stringOptim].push(nodeName)
          }
          else{
            optims[stringOptim]=[nodeName]
          }
        })
        return optims
      }
}

function evaluateOptimizabilityObject(optim: ConditionalOptimizability, factorAnswers: FactorAnswers): number {
    for(let factorName in optim.conditionals){
      let nodeValueToOptim=optim.conditionals[factorName]
      const factorAnswerValue=factorAnswers[factorName]
      if(factorAnswerValue!==""){
        if(factorAnswerValue in nodeValueToOptim){
          return nodeValueToOptim[factorAnswerValue]
        }
      }
    }
    return optim.default
  }