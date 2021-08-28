import { FactorAnswers } from "./Factors";
import { ConditionalOptimizability } from "./Optimizabilities";
import { MultifactorGainType } from "./updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy";



interface DescriptionNode {
  descriptions: string[],
  baseUnit?: string,
  color: string,
  optimizability?:number | ConditionalOptimizability
}


export interface DescriptionsJson {
    [nodeName: string]: DescriptionNode;
}

interface NodeDic {
    [nodeName: string]: string[];
}

interface NodeToString {
  [nodeName: string]: string;
}

export default class Descriptions {
    descriptions: NodeDic={};
    colors: NodeToString={};
    baseUnit: NodeToString={};

    constructor(descriptionsJson: DescriptionsJson){
        this.colors["Unexplained"]="#FFFFFF";
        Object.entries(descriptionsJson).forEach(([nodeName, nodeDescriptions]) => {
            this.descriptions[nodeName]=nodeDescriptions.descriptions
            this.colors[nodeName]=nodeDescriptions.color;
            if(nodeDescriptions.optimizability){
            }
            this.baseUnit[nodeName]= nodeDescriptions.baseUnit ? nodeDescriptions.baseUnit : ""
        })
        this.colors[MultifactorGainType.KNOWN]="#f7f7f5";
        this.colors[MultifactorGainType.UNKNOWN]="#fcfcfa";
        this.descriptions[MultifactorGainType.KNOWN]=["Multiple known factors bonus", "Known factors", "Knowns"]
        this.descriptions[MultifactorGainType.UNKNOWN]=["Multiple factors bonus", "Unknown factors", "Unknowns"]
    }

    getColor(nodeName: string){
      return this.colors[nodeName];
    }

    getBaseUnit(nodeName: string){
      if(nodeName in this.baseUnit){
        if(this.baseUnit[nodeName].includes("=")){
          return ""
        }
        return this.baseUnit[nodeName]
      }
      return ""
    }

    getDescription(nodeName: string, maxSize:number=20): string{
        if(nodeName === "any cause") {
          return "";
        }
        let candidateLength=0;
        let candidate=null;
        this.descriptions[nodeName].forEach(desc => {
          if(desc.length>= candidateLength && desc.length<=maxSize){
            candidate=desc;
            candidateLength=desc.length;
          }
        })
        if(candidate){
          return candidate
        }
        console.error(`No sufficiently short description(length<${maxSize}) was found for ${nodeName}`)
        return nodeName;
    }

}

