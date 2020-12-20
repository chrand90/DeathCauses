export const INPUT = "Input factor";
export const COMPUTED_FACTOR = "Computed factor";
export const CONDITION = "Condition";
export const CAUSE_CATEGORY = "Death cause category";
export const CAUSE = "Death cause";

const NODE_ORDER = [INPUT, COMPUTED_FACTOR, CONDITION, CAUSE_CATEGORY, CAUSE];

interface ReverseNodeOrder {
  [key: string]: number;
}

interface NodeValue {
  type: string;
  ancestors: string[];
}

export interface RelationLinkJson {
  [nodeName: string]: NodeValue;
}

interface NumberOfDestinations {
  [nodeName: string]: number;
}

interface NodeDic {
  [nodeName: string]: string[];
}

interface NodeToType {
  [nodeName: string]: string;
}

interface UntransformedLabel {
  cat: string;
  x_relative: number;
  y: number;
  nodeName: string;
  key: string;
}

export interface Arrow {
  from: string;
  to: string;
  type: string;
}

export interface TransformedLabel {
  cat: string;
  x: number;
  y: number;
  nodeName: string;
  key: string;
}

interface DirectionInfo {
  arrows: Arrow[];
  untransformedlabels: UntransformedLabel[];
  usedKeys: string[];
}

interface XDivision {
  x0: number;
  width: number;
}

interface AdjustXReturn {
  transformedLabels: TransformedLabel[];
  xDivisions: XDivision[];
}

export interface PlottingInfo extends AdjustXReturn {
  arrows: Arrow[];
}

const INPUT_FACTORS_LENGTH = 1;
const COMPUTED_FACTORS_LENGTH = 1;
const CONDITIONS_LENGTH = 1;
const DEATHCAUSE_CATEGORY_LENGH = 1;
const DEATHCAUSE_LENGTH = 1;
const MARGIN = 0.3;
const TOTAL_WIDTH =
  INPUT_FACTORS_LENGTH +
  COMPUTED_FACTORS_LENGTH +
  CONDITIONS_LENGTH +
  DEATHCAUSE_CATEGORY_LENGH +
  DEATHCAUSE_LENGTH +
  4 * MARGIN;

{
  /* 
This class handles the relation link database - that is which factors implies which death causes. 
The language used is that of ancestors and descendants. Ancestors came before the descendentants,
so when we talk about the ancestors we mean the risk factors, and descendants are the diseases. 
For computed factors, their ancestors are the input factors and so on. The hierarchy is
super-ancestor=Input factor -> Computed factor -> Condition -> Death cause category -> Death cause = super-descendant.
We assume a tree-like structure in both directions which is enforced in each direction.
*/
}
export default class RelationLinks {
  superDescendantCount: NumberOfDestinations = {};
  superAncestorCount: NumberOfDestinations = {};
  ancestorList: NodeDic = {};
  descendantList: NodeDic = {};
  nodeTypes: NodeToType = {};
  superAncestorList: NodeDic = {};
  superDescendantList: NodeDic = {};
  nodeOrderReversed: ReverseNodeOrder={};

  constructor(jsonObject: RelationLinkJson) {

    NODE_ORDER.forEach((d:string,i:number) => {
      this.nodeOrderReversed[d]=i;
    });
    //initializing  nodetypes, ancestorList, and computing the reverse descendantList.
    Object.keys(jsonObject).forEach((nodeName: string) => {
      this.descendantList[nodeName] = [];
    });
    Object.entries(jsonObject).forEach(([nodeName, node]) => {
      this.nodeTypes[nodeName] = node.type;
      this.ancestorList[nodeName] = node.ancestors;
      
      this.ancestorList[nodeName].forEach((ancestor: string) => {
        try {
          return this.descendantList[ancestor].push(nodeName);
        } catch (e) {
          throw `Error when trying to put ${nodeName} into the descendants of ${ancestor}`;
        }
      });
    });
    Object.keys(jsonObject).forEach((nodeName: string) => {
      this.superDescendantList[nodeName] = this.findDescendants(nodeName);
      this.superDescendantCount[nodeName] = this.superDescendantList[
        nodeName
      ].length;
      this.superAncestorList[nodeName] = this.findAncestors(nodeName);
      this.superAncestorCount[nodeName] = this.superAncestorList[
        nodeName
      ].length;
    });
  }

  findDescendants(nodeName: string): string[] {
    if (this.descendantList[nodeName].length === 0) {
      return [nodeName];
    } else {
      let tmp = this.descendantList[nodeName].map((d: string) => {
        return this.findDescendants(d);
      });
      let a: string[] = []; //This would ideally not be necessary but [].concat() is not allowed since [] is of type never[].
      return a.concat(...tmp);
    }
  }

  findAncestors(nodeName: string): string[] {
    if (this.ancestorList[nodeName].length === 0) {
      return [nodeName];
    } else {
      let tmp = this.ancestorList[nodeName].map((d: string) => {
        return this.findAncestors(d);
      });
      let a: string[] = []; //This would ideally not be necessary but [].concat() is not allowed since [] is of type never[].
      return a.concat(...tmp);
    }
  }

  makePlottingInstructions(nodeName: string): PlottingInfo {
    let untransformed: UntransformedLabel[] = [];
    const totalHeight = Math.max(
      this.superAncestorCount[nodeName],
      this.superDescendantCount[nodeName]
    );

    //Taking care of the node we are currently in.
    let currentCategory = this.nodeTypes[nodeName];
    let upstreamElements = this.followGraph(
      nodeName,
      this.ancestorList,
      (d: string) => this.nodeTypes[d] === currentCategory
    );
    let downStreamElements = this.followGraph(
      nodeName,
      this.descendantList,
      (d: string) => this.nodeTypes[d] === currentCategory
    );
    const xval =
      (1 + upstreamElements) / (2 + downStreamElements + upstreamElements);
    if (downStreamElements !== 0) {
      console.log(downStreamElements);
    }
    const yval = 0.5;
    untransformed.push({
      cat: currentCategory,
      x_relative: xval,
      y: yval,
      nodeName: nodeName,
      key: nodeName,
    });

    //Dealing with the rest of the nodes in the tree.
    let usedKeys: string[] = [nodeName];
    let arrows: Arrow[] = [];
    let descendantInfo = this.makePlottingInNodeDicDirection(
      nodeName,
      upstreamElements,
      this.descendantList,
      this.superDescendantCount,
      0,
      this.superDescendantCount[nodeName],
      (x: number) => x,
      (s: string[]) => [s[0], s[1]],
      usedKeys
    );
    usedKeys = descendantInfo.usedKeys;
    arrows = descendantInfo.arrows;
    untransformed = untransformed.concat(descendantInfo.untransformedlabels);
    let ancestorInfo = this.makePlottingInNodeDicDirection(
      nodeName,
      downStreamElements,
      this.ancestorList,
      this.superAncestorCount,
      0,
      this.superAncestorCount[nodeName],
      (x: number) => 1 - x,
      (s: string[]) => [s[1], s[0]],
      usedKeys
    );
    usedKeys = ancestorInfo.usedKeys;
    arrows = arrows.concat(ancestorInfo.arrows);
    untransformed = untransformed.concat(ancestorInfo.untransformedlabels);
    const adjXReturn: AdjustXReturn = this.adjustXCoordinates(untransformed);
    return { ...adjXReturn, arrows: arrows };
  }

  adjustXCoordinates(dat: UntransformedLabel[]): AdjustXReturn {
    //calculates the relative space used by each of categories.
    const weights = NODE_ORDER.map((cat: string, index: number) => {
      const xvals = dat
        .filter((ut: UntransformedLabel) => ut.cat === cat)
        .map((ut: UntransformedLabel) => ut.x_relative);
      if (xvals.length === 0) {
        return 0;
      }
      const mv = Math.min(...xvals);
      if (mv === 0 || mv === 1) {
        return 2;
      } else {
        return 1 / Math.min(...xvals);
      }
    });
    const cumWeights: number[] = [];
    weights.reduce(function (a, b, i) {
      cumWeights.push(a + b);
      return a + b;
    }, 0);
    cumWeights.unshift(0); //inserting a 0, because the visualization should start at 0.

    const resDat = dat.map((d: UntransformedLabel) => {
      const catOrder = NODE_ORDER.indexOf(d.cat);
      const newX =
        cumWeights[catOrder] +
        (cumWeights[catOrder + 1] - cumWeights[catOrder]) * d.x_relative;
      return { ...d, x: newX };
    });
    let xDivisions: XDivision[] = [];
    for (let index = 0; index < cumWeights.length - 1; index++) {
      xDivisions.push({ x0: cumWeights[index], width: weights[index] });
    }

    console.log("resDat");
    console.log(resDat);

    return { transformedLabels: resDat, xDivisions: xDivisions };
  }

  compareChildNodesFunction(parentNode:string, superDestinations: NumberOfDestinations){
    const parentCat=this.nodeTypes[parentNode];
    const parentCatIndex=this.nodeOrderReversed[parentCat]
    const nrev=this.nodeOrderReversed;
    const ntyp=this.nodeTypes;
    function returner(a: string, b:string){
      const aIndex=nrev[ntyp[a]];
      const bIndex=nrev[ntyp[b]];;
      if(aIndex===bIndex){
        return superDestinations[a]-superDestinations[b]
      }
      else{
        return -Math.abs(aIndex-parentCatIndex)+Math.abs(bIndex-parentCatIndex);
      }
    }
    return returner;
  }

  makePlottingInNodeDicDirection(
    nodeName: string,
    prevElements: number,
    nodeDic: NodeDic,
    superDestinations: NumberOfDestinations,
    bottomY: number,
    topY: number,
    xDirection: (s: number) => number,
    arrowDirection: (twocats: string[]) => string[],
    usedKeys: string[]
  ): DirectionInfo {
    if (nodeDic[nodeName].length === 0) {
      let ut: UntransformedLabel[] = [];
      let newArrows: Arrow[] = [];
      let res: DirectionInfo = {
        untransformedlabels: ut,
        usedKeys: usedKeys,
        arrows: newArrows,
      };
      return res;
    } else {
      const children: string[] = nodeDic[nodeName];
      children.sort(this.compareChildNodesFunction(nodeName,superDestinations));
      const weights = children.map((d: string) => superDestinations[d]);
      let res: UntransformedLabel[] = [];
      let arrows: Arrow[] = [];
      let yfrom = bottomY;
      const sumweights = weights.reduce((a, b) => a + b, 0);
      const parentNodeType = this.nodeTypes[nodeName];
      children.forEach((cnodeName: string, index: number) => {
        const yto = yfrom + (weights[index] / sumweights) * (topY - bottomY);
        const yval = (yto + yfrom) / 2;

        const cat = this.nodeTypes[cnodeName];
        const remainingElements = this.followGraph(
          cnodeName,
          nodeDic,
          (d: string) => this.nodeTypes[d] === cat
        );
        let xval: number;
        let seenElements: number;
        if (cat === parentNodeType) {
          seenElements = prevElements + 1;

          xval = xDirection(
            (1 + seenElements) / (2 + seenElements + remainingElements)
          );
        } else {
          seenElements = 0;
          xval = xDirection(
            (1 + seenElements) / (2 + seenElements + remainingElements)
          );
        }

        let directionInfo: DirectionInfo = this.makePlottingInNodeDicDirection(
          cnodeName,
          seenElements,
          nodeDic,
          superDestinations,
          yfrom,
          yto,
          xDirection,
          arrowDirection,
          usedKeys
        );
        usedKeys = directionInfo.usedKeys;
        arrows = arrows.concat(directionInfo.arrows);
        res = res.concat(directionInfo.untransformedlabels);
        let key = cnodeName;
        while (key in usedKeys) {
          key += "*";
        }
        usedKeys.push(key);
        const arrowtype =
          parentNodeType === CAUSE_CATEGORY ? "no-arrow" : "arrow";
        const froto: string[] = arrowDirection([nodeName, cnodeName]); //depending on the direction a different number is
        arrows.push({ from: froto[0], to: froto[1], type: arrowtype });
        res.push({
          cat: cat,
          x_relative: xval,
          y: yval,
          nodeName: cnodeName,
          key: key,
        });
        yfrom = yto;
      });
      return { untransformedlabels: res, arrows: arrows, usedKeys: usedKeys };
    }
  }

  followGraph(
    nodeName: string,
    nodeDic: NodeDic,
    continueTest: (name: string) => boolean
  ): number {
    if (nodeDic[nodeName].length === 0 || !continueTest(nodeName)) {
      return -1;
    } else {
      let tmp = nodeDic[nodeName].map((d: string) => {
        return this.followGraph(d, nodeDic, continueTest);
      });
      return Math.max(...tmp) + 1;
    }
  }
}
