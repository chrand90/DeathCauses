
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

interface NodeToNumber {
  [nodeName:string]: number;
}

export default class Descriptions {
    descriptions: NodeDic={};
    colors: NodeToString={};
    optimizabilities: NodeToOptimizability={};
    optimClasses: OptimizabilityToNodes={};

    constructor(descriptionsJson: DescriptionsJson){
        this.colors["Unexplained"]="#FFFFFF";
        Object.entries(descriptionsJson).forEach(([nodeName, nodeDescriptions]) => {
            this.descriptions[nodeName]=nodeDescriptions.descriptions
            this.colors[nodeName]=nodeDescriptions.color;
            if(nodeDescriptions.optimizability){
              this.optimizabilities[nodeName]=nodeDescriptions.optimizability;
            }
        })
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

    getDescription(nodeName: string, maxSize:number=20): string{
        let candidateLength=0;
        let candidate=null;
        this.descriptions[nodeName].forEach(desc => {
          if(desc.length>= candidateLength && desc.length<=maxSize){
            candidate=desc;
            candidateLength=desc.length;
          }
        })
        if(candidate){
          console.log(nodeName+" -> "+ candidate)
          return candidate
        }
        console.error(`No sufficiently short description(length<${maxSize}) was found for ${nodeName}`)
        return nodeName;
    }

}