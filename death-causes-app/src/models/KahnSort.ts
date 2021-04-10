interface NodeDic {
    [nodeName: string]: string[];
  }

export default function kahnSort(nodesToBeSorted: string[], backwardEdges: NodeDic, forwardEdge: NodeDic){
    let removableNodes: string[]=[];
    let nonRemovableNodes: string[]=[];
    let res: string[]=[];
    nodesToBeSorted.forEach((factorname) => {
        if(backwardEdges[factorname].every( (ancestor) => {  return !nodesToBeSorted.includes(ancestor)})){
            removableNodes.push(factorname);
        }
        else{
            nonRemovableNodes.push(factorname);
        }
    })
    let count=0
    while(nonRemovableNodes.length>0 && count<1000){
        let candidate=nonRemovableNodes.shift()
        let candidateAncestors=backwardEdges[candidate!].filter(d => nodesToBeSorted.includes(d))
        let accept= candidateAncestors.every((d:string) => {
            return removableNodes.includes(d)
        });
        if(accept){
            removableNodes.push(candidate!)
        }
        else{
            nonRemovableNodes.push(candidate!)
        }
        count++;
    }
    if(count===1000){
        throw "Could not fit the nodes "+nonRemovableNodes.toString() + " into the graph"
    }
    res=res.concat(removableNodes)
    return res

}