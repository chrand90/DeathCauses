import { MultifactorGainType } from "./updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy";

interface DescriptionNode {
  descriptions: string[],
  baseUnit?: string,
  color: string,
  optimizability?:number
}

export interface NodeToOptimizability {
  [nodeName: string]: number;
}

export interface OptimizabilityToNodes {
  [optim: string]: string[];
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
    optimizabilities: NodeToOptimizability={};
    optimClasses: OptimizabilityToNodes={};
    baseUnit: NodeToString={};

    constructor(descriptionsJson: DescriptionsJson){
        this.colors["Unexplained"]="#FFFFFF";
        Object.entries(descriptionsJson).forEach(([nodeName, nodeDescriptions]) => {
            this.descriptions[nodeName]=nodeDescriptions.descriptions
            this.colors[nodeName]=nodeDescriptions.color;
            if(nodeDescriptions.optimizability){
              this.optimizabilities[nodeName]=nodeDescriptions.optimizability;
            }
            this.baseUnit[nodeName]= nodeDescriptions.baseUnit ? nodeDescriptions.baseUnit : ""
        })
        this.colors[MultifactorGainType.KNOWN]="#f7f7f5";
        this.colors[MultifactorGainType.UNKNOWN]="#fcfcfa";
        this.descriptions[MultifactorGainType.KNOWN]=["Multiple known factors", "Known factors", "Knowns"]
        this.descriptions[MultifactorGainType.UNKNOWN]=["Multiple factors", "Unknown factors", "Unknowns"]
        this.optimizabilities[MultifactorGainType.UNKNOWN]=0
        this.optimizabilities[MultifactorGainType.KNOWN]=5

        this.initializeOptimizabilityClasses();
    }

    getColor(nodeName: string){
      return this.colors[nodeName];
    }

    getOptimizability(nodeName: string): number{
      if(nodeName in this.optimizabilities){
        return this.optimizabilities[nodeName];
      }
      console.error(`There is no optimizability for ${nodeName}).`)
      throw Error("A requested optimizability does not exist.")
    }

    initializeOptimizabilityClasses() {
      Object.keys(this.optimizabilities)
        .forEach((nodeName) => {
          let optimValue = this.optimizabilities[nodeName];
          if (!(optimValue in this.optimClasses)) {
            this.optimClasses[optimValue] = [];
          }
          this.optimClasses[optimValue].push(nodeName);
        });
    }

    getOptimizabilityClasses(nodeNames: string[]): OptimizabilityToNodes {
      let resAsLists=Object.entries(this.optimClasses)
        .map(([optimValue, nodes]) => {
          return [optimValue, nodes.filter( (node:string) => nodeNames.includes(node))]
        })
        .filter( ([optimValue, nodes]) => {
          return nodes.length>0;
        })
      return Object.fromEntries(resAsLists);
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