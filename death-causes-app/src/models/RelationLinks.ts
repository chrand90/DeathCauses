import { tree } from "d3-hierarchy";
import kahnSort from "./KahnSort";

// export const INPUT = "Input factor";
// export const COMPUTED_FACTOR = "Computed factor";
// export const CONDITION = "Condition";
// export const CAUSE_CATEGORY = "Death cause category";
// export const CAUSE = "Death cause";

export enum NodeType {
  INPUT = "Input factor",
  COMPUTED_FACTOR = "Computed factor",
  CONDITION = "Condition",
  CAUSE_CATEGORY = "Death cause category",
  CAUSE = "Death cause",
}

export const NODE_ORDER = [
  NodeType.INPUT,
  NodeType.COMPUTED_FACTOR,
  NodeType.CONDITION,
  NodeType.CAUSE_CATEGORY,
  NodeType.CAUSE,
];

interface ReverseNodeOrder {
  [key: string]: number;
}

interface NodeValue {
  type: NodeType;
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
  [nodeName: string]: NodeType;
}

export interface NodeToColor {
  [nodeName: string]: string;
}

interface UntransformedLabel {
  cat: NodeType;
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
  cat: NodeType;
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

export interface XDivision {
  x0: number;
  width: number;
  cat: NodeType;
}

interface AdjustXReturn {
  transformedLabels: TransformedLabel[];
  xDivisions: XDivision[];
}

export interface NodeExtremas {
  min: NodeType;
  max: NodeType;
  nodeCategories: NodeType[];
}

export interface CauseToParentMapping {
  [childCause: string]: string;
}

export interface ParentToCausesMapping {
  [parentCause: string]: string[];
}

export interface CauseGrouping {
  causeToParent: CauseToParentMapping;
  parentToCauses: ParentToCausesMapping;
}

interface StratifiedTopologicalSorting {
  [key: string]: string[];
}
export interface PlottingInfo extends AdjustXReturn {
  arrows: Arrow[];
  nodeExtremas: NodeExtremas;
}

const INPUT_FACTORS_LENGTH = 1;
const COMPUTED_FACTORS_LENGTH = 1;
const CONDITIONS_LENGTH = 1;
const DEATHCAUSE_CATEGORY_LENGTH = 1;
const DEATHCAUSE_LENGTH = 1;
const MARGIN = 0.3;
const TOTAL_WIDTH =
  INPUT_FACTORS_LENGTH +
  COMPUTED_FACTORS_LENGTH +
  CONDITIONS_LENGTH +
  DEATHCAUSE_CATEGORY_LENGTH +
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
  nodeType: NodeToType = {};
  superAncestorList: NodeDic = {};
  superDescendantList: NodeDic = {};
  nodeOrderReversed: ReverseNodeOrder = {};
  deathCauseDescendants: NodeDic = {};
  sortedNodes: StratifiedTopologicalSorting = {};

  constructor(jsonObject: RelationLinkJson) {
    this.initializeReverseNodeTypeOrder();
    this.initializeInheritanceListsAndType(jsonObject);
    this.initializeSuperInheritanceLists();
    this.initializeSortedNodes();
  }

  initializeReverseNodeTypeOrder() {
    NODE_ORDER.forEach((d: NodeType, i: number) => {
      this.nodeOrderReversed[d] = i;
    });
  }

  initializeInheritanceListsAndType(jsonObject: RelationLinkJson) {
    //initializing  NodeType, ancestorList
    Object.keys(jsonObject).forEach((nodeName: string) => {
      this.descendantList[nodeName] = [];
    });
    
    Object.entries(jsonObject).forEach(([nodeName, node]) => {
      this.nodeType[nodeName] = node.type;
      this.ancestorList[nodeName] = node.ancestors;
      this.ancestorList[nodeName].forEach((ancestor: string) => {
        try {
          return this.descendantList[ancestor].push(nodeName);
        } catch (e) {
          throw `Error when trying to put ${nodeName} into the descendants of ${ancestor}`;
        }
      });
    });
  }

  initializeSuperInheritanceLists() {
    Object.keys(this.nodeType).forEach((nodeName: string) => {
      this.superDescendantList[nodeName] = this.findDescendants(nodeName);
      this.superDescendantCount[nodeName] = this.superDescendantList[
        nodeName
      ].length;
      this.superAncestorList[nodeName] = this.findAncestors(nodeName);
      this.superAncestorCount[nodeName] = this.superAncestorList[
        nodeName
      ].length+ this.superAncestorList[nodeName].filter(ancestorNode => this.nodeType[ancestorNode]===NodeType.CAUSE_CATEGORY).length*2;
      this.deathCauseDescendants[nodeName] = this.findDeathCauseDescendants(
        nodeName
      );
    });
  }

  initializeSortedNodes(): void {
    //Kahns algorithm(1962) puts nodes from an acyclicdirected graph in a order that puts ancestors before descendants.
    NODE_ORDER.forEach((nodeType) => {
      let nodesToBeSorted = Object.keys(this.nodeType).filter((nodename) => {
        return this.nodeType[nodename] === nodeType;
      });
      this.sortedNodes[nodeType] = kahnSort(
        nodesToBeSorted,
        this.ancestorList,
        this.descendantList
      );
    });
  }


  getParentCategory(nodeName: string) {
    let candidates = this.ancestorList[nodeName].filter(
      (candidateNode: string) => {
        if (this.nodeType[candidateNode] === NodeType.CAUSE_CATEGORY) {
          return true;
        }
        return false;
      }
    );
    if (candidates.length === 0) {
      return null;
    }
    if (candidates.length > 1) {
      throw Error(
        "A node had two category parent categories, which should not be possible"
      );
    }
    return candidates[0];
  }

  findCauseCategoryDescendants(nodeName: string): string[] {
    if (this.nodeType[nodeName] === NodeType.CAUSE) {
      return [];
    } else {
      let categoryDescendants = this.descendantList[nodeName].map(
        (d: string) => {
          return this.findCauseCategoryDescendants(d);
        }
      );
      if (this.nodeType[nodeName] === NodeType.CAUSE_CATEGORY) {
        return [nodeName].concat(...categoryDescendants);
      }
      return ([] as string[]).concat(...categoryDescendants);
    }
  }

  findImmediateCauseCategoryDescendants(nodeName: string): string[] {
    return this.descendantList[nodeName].filter(
      (d) => this.nodeType[d] === NodeType.CAUSE_CATEGORY
    );
  }

  getPossibleExpansions() {
    const collapsables: NodeDic = {};
    const expandables: NodeDic={};
    this.sortedNodes[NodeType.CAUSE]
      .concat(this.sortedNodes[NodeType.CAUSE_CATEGORY])
      .forEach((nodeName: string) => {
        this.ancestorList[nodeName].forEach(ancestorName => {
          if(this.nodeType[ancestorName] === NodeType.CAUSE_CATEGORY){
            collapsables[nodeName]=[ancestorName];
          }
        });
        if(nodeName in this.descendantList && this.descendantList[nodeName].length>0){
          expandables[nodeName]=this.descendantList[nodeName];
        }
      });
    return {
      collapsables,
      expandables
    }; //this.sortedNodes[NodeType.CAUSE_CATEGORY]}
  }

  

  makeCollectedGroups(groupCats: string[]): CauseGrouping {
    let causeToParent: CauseToParentMapping = {};
    let parentToCauses: ParentToCausesMapping = {};
    //initialize
    this.sortedNodes[NodeType.CAUSE].forEach((d) => {
      causeToParent[d] = d;
    });
    let notOrphans: string[] = [];
    groupCats.forEach((parentNode) => {
      parentToCauses[parentNode] = this.superDescendantList[parentNode];
      this.superDescendantList[parentNode].forEach((childNode) => {
        causeToParent[childNode] = parentNode;
        notOrphans.push(childNode);
      });
    });
    this.sortedNodes[NodeType.CAUSE]
      .filter((d) => !notOrphans.includes(d))
      .forEach((d) => {
        parentToCauses[d] = [d];
        causeToParent[d] = d;
      });
    return { causeToParent, parentToCauses };
  }

  arrowInterpretation(
    //TODO: when there are duplicate keys it doesn't give the right output
    fromNode: string,
    toNode: string
  ): string {
    let res: string = "";
    let fromType = this.nodeType[fromNode];
    let toType = this.nodeType[toNode];
    if (fromType === NodeType.INPUT || fromType === NodeType.COMPUTED_FACTOR) {
      res += fromNode + " is used ";
    } else if (fromType === NodeType.CONDITION) {
      res += "The status of " + fromNode + " is used ";
    } else if (fromType === NodeType.CAUSE_CATEGORY) {
      return toNode + " is a type of " + fromNode;
    }
    if (toType === NodeType.COMPUTED_FACTOR) {
      res += "to compute " + toNode;
    } else if (toType === NodeType.CONDITION) {
      res += "to estimate the status of " + toNode;
    } else if (toType === NodeType.CAUSE_CATEGORY) {
      res += "as a risk factor for all types of " + toNode;
    } else if (toType === NodeType.CAUSE) {
      res += "to compute the risk of dying from " + toNode;
    }
    return res;
  }

  findDescendants(nodeName: string): string[] {
    if (this.descendantList[nodeName].length === 0) {
      return [nodeName];
    } else {
      let descendantsListsOfDescendants = this.descendantList[nodeName].map(
        (d: string) => {
          return this.findDescendants(d);
        }
      );
      return ([] as string[]).concat(...descendantsListsOfDescendants);
    }
  }

  findDeathCauseDescendants(nodeName: string): string[] {
    if (
      this.descendantList[nodeName].length === 0 ||
      this.nodeType[nodeName] === NodeType.CAUSE_CATEGORY ||
      this.nodeType[nodeName] === NodeType.CAUSE
    ) {
      return [nodeName];
    } else {
      let descendantsListsOfCauseDescendants = this.descendantList[
        nodeName
      ].map((d: string) => {
        return this.findDeathCauseDescendants(d);
      });
      return ([] as string[]).concat(...descendantsListsOfCauseDescendants);
    }
  }

  findCauseCategoryAncestors(nodeName: string): string[]{
    if(!( this.nodeType[nodeName]=== NodeType.CAUSE || this.nodeType[nodeName]===NodeType.CAUSE_CATEGORY )){
      return [];
    }
    if (
      this.ancestorList[nodeName].length === 0
    ) {
      return [nodeName];
    } else {
      let causeCategoryAncestors = this.ancestorList[
        nodeName
      ].map((d: string) => {
        return this.findCauseCategoryAncestors(d);
      });
      return ([nodeName]).concat(...causeCategoryAncestors);
    }
  }

  findAncestors(nodeName: string): string[] {
    if (this.ancestorList[nodeName].length === 0) {
      return [nodeName];
    } else {
      let ancestorsListsOfAncestors = this.ancestorList[nodeName].map(
        (d: string) => {
          return this.findAncestors(d);
        }
      );
      return ([] as string[]).concat(...ancestorsListsOfAncestors);
    }
  }

  getNumberOfNodesInEitherDirection(nodeName: string) {
    let currentCategory = this.nodeType[nodeName];
    let upstreamElements = this.followGraph(
      nodeName,
      this.ancestorList,
      (d: string) => this.nodeType[d] === currentCategory
    );
    let downStreamElements = this.followGraph(
      nodeName,
      this.descendantList,
      (d: string) => this.nodeType[d] === currentCategory
    );
    return {
      upstreamElements: upstreamElements,
      downStreamElements: downStreamElements,
    };
  }

  getImmediateCauseCategoryDescendants(nodeName: string): string[] {
    return this.descendantList[nodeName].filter((candidateNode: string) => {
      return this.nodeType[candidateNode] === NodeType.CAUSE_CATEGORY;
    });
  }

  computeXValueOfInitialNode(
    upstreamElements: number,
    downStreamElements: number,
    nodeType: string
  ) {
    let xval: number = 1;
    if (downStreamElements > -0.5 || upstreamElements > -0.5) {
      //all graphs with nodes in more than one node is included here.
      xval =
        (1 + upstreamElements) / (2 + downStreamElements + upstreamElements);
    } else if (nodeType === NODE_ORDER[0]) {
      //Only the one-node graph from an input factor should be shifted to the left.
      xval = 0;
    }
    return xval;
  }

  makePlottingInstructions(nodeName: string): PlottingInfo {
    let untransformed: UntransformedLabel[] = [];
    let outerNodes: string[] = this.superAncestorList[nodeName].concat(
      this.superDescendantList[nodeName]
    );
    let nodeExtremas = this.getLowestAndHighestCategory(outerNodes);
    let currentCategory = this.nodeType[nodeName];

    //Taking care of the node we are currently in.
    const {
      upstreamElements,
      downStreamElements,
    } = this.getNumberOfNodesInEitherDirection(nodeName);
    const xval = this.computeXValueOfInitialNode(
      upstreamElements,
      downStreamElements,
      currentCategory
    );
    const yval = 0.25;
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
      usedKeys,
      nodeExtremas
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
      usedKeys,
      nodeExtremas
    );
    usedKeys = ancestorInfo.usedKeys;
    arrows = arrows.concat(ancestorInfo.arrows);
    untransformed = untransformed.concat(ancestorInfo.untransformedlabels);
    const adjXReturn: AdjustXReturn = this.adjustXCoordinates(untransformed);
    return { ...adjXReturn, arrows: arrows, nodeExtremas: nodeExtremas };
  }

  computeCumulativeWeights(weights: number[]) {
    const cumWeights: number[] = [];
    weights.reduce(function (a, b, i) {
      cumWeights.push(a + b);
      return a + b;
    }, 0);
    cumWeights.unshift(0); //inserting a 0, because the visualization should start at 0.
    return cumWeights;
  }

  adjustXCoordinates(dat: UntransformedLabel[]): AdjustXReturn {
    //calculates the relative space used by each of categories.
    const weights = NODE_ORDER.map((cat: string, index: number) => {
      const xvals = dat
        .filter((ut: UntransformedLabel) => ut.cat === cat)
        .map((ut: UntransformedLabel) => {
          //this computes an estimated length of the labels connected to ut in the same category as ut.
          //It adds 10 for each label to account for space between labels.
          return this.followMaximumOfSummary(
            ut.nodeName,
            this.descendantList,
            (d: string) => this.nodeType[d] === cat,
            (d: string) => d.length + 10
          );
        });
      if (xvals.length === 0) {
        return 0;
      }
      return Math.max(...xvals);
    });
    const cumWeights = this.computeCumulativeWeights(weights);

    const resDat = dat.map((d: UntransformedLabel) => {
      const catOrder = NODE_ORDER.indexOf(d.cat);
      const newX =
        cumWeights[catOrder] +
        (cumWeights[catOrder + 1] - cumWeights[catOrder]) * d.x_relative;
      return { ...d, x: newX };
    });
    let xDivisions: XDivision[] = [];
    for (let index = 0; index < cumWeights.length - 1; index++) {
      xDivisions.push({
        x0: cumWeights[index],
        width: weights[index],
        cat: NODE_ORDER[index],
      });
    }

    return { transformedLabels: resDat, xDivisions: xDivisions };
  }


  getAllPossibleNodes(): string[] {
    return Object.keys(this.nodeType).sort();
  }

  getSuperDescendantCount(node: string) {
    return this.superDescendantCount[node];
  }

  getDeathCauseDescendants(node: string): string[] {
    return this.deathCauseDescendants[node];
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
    usedKeys: string[],
    nodeExtremas: NodeExtremas
  ): DirectionInfo {
    if (nodeDic[nodeName].length === 0) {
      return this.makeEmptyDirectionInfo(usedKeys);
    } else {
      const { children, weights, sumweights } = this.getChildrenAndWeight(
        nodeName,
        superDestinations,
        nodeDic
      );
      const parentNodeType = this.nodeType[nodeName];
      const parentYval = (topY + bottomY) / 2;

      let res: UntransformedLabel[] = [];
      let arrows: Arrow[] = [];
      let yfrom = bottomY;
      children.forEach((childNodeName: string, index: number) => {
        const childCategory = this.nodeType[childNodeName];
        const yto = yfrom + (weights[index] / sumweights) * (topY - bottomY);
        const yval = this.computeYPositionOfLabel(
          yfrom,
          yto,
          parentYval,
          childNodeName,
          childCategory === parentNodeType,
          nodeDic
        );

        const previousElementsInSameCategory =
          childCategory === parentNodeType ? prevElements + 1 : 0;

        const xval = this.computeXPositionOfLabel(
          childNodeName,
          childCategory,
          nodeDic,
          previousElementsInSameCategory,
          xDirection,
          nodeExtremas
        );

        let directionInfo: DirectionInfo = this.makePlottingInNodeDicDirection(
          childNodeName,
          previousElementsInSameCategory,
          nodeDic,
          superDestinations,
          yfrom,
          yto,
          xDirection,
          arrowDirection,
          usedKeys,
          nodeExtremas
        );
        usedKeys = directionInfo.usedKeys;
        arrows = arrows.concat(directionInfo.arrows);
        res = res.concat(directionInfo.untransformedlabels);

        const key = this.createUniqueKey(childNodeName, usedKeys);
        usedKeys.push(key);

        const arrowtype = this.getArrowType(
          parentNodeType,
          childCategory,
          xDirection
        );

        const froto: string[] = arrowDirection([nodeName, key]); //depending on the direction a different number is
        arrows.push({ from: froto[0], to: froto[1], type: arrowtype });
        res.push({
          cat: childCategory,
          x_relative: xval,
          y: yval,
          nodeName: childNodeName,
          key: key,
        });
        yfrom = yto;
      });
      return { untransformedlabels: res, arrows: arrows, usedKeys: usedKeys };
    }
  }

  compareChildNodesFunction(
    parentNode: string,
    superDestinations: NumberOfDestinations
  ) {
    const parentCat = this.nodeType[parentNode];
    const parentCatIndex = this.nodeOrderReversed[parentCat];
    const nrev = this.nodeOrderReversed;
    const ntyp = this.nodeType;
    function returner(a: string, b: string) {
      const aIndex = nrev[ntyp[a]];
      const bIndex = nrev[ntyp[b]];
      if (aIndex === bIndex) {
        if (a.length === b.length) {
          return superDestinations[a] - superDestinations[b];
        } else {
          return a.length - b.length;
        }
      } else {
        return (
          -Math.abs(aIndex - parentCatIndex) + Math.abs(bIndex - parentCatIndex)
        );
      }
    }
    return returner;
  }

  makeEmptyDirectionInfo(usedKeys: string[]): DirectionInfo {
    let ut: UntransformedLabel[] = [];
    let newArrows: Arrow[] = [];
    let res: DirectionInfo = {
      untransformedlabels: ut,
      usedKeys: usedKeys,
      arrows: newArrows,
    };
    return res;
  }

  getChildrenAndWeight(
    nodeName: string,
    superDestinations: NumberOfDestinations,
    descendantAncestorList: NodeDic
  ) {
    let children: string[] = descendantAncestorList[nodeName];
    children.sort(this.compareChildNodesFunction(nodeName, superDestinations));
    const weights = children.map((d: string) => superDestinations[d]);
    const sumweights = weights.reduce((a, b) => a + b, 0);
    return { children: children, weights: weights, sumweights: sumweights };
  }

  computeYPositionOfLabel(
    yfrom: number,
    yto: number,
    parentYval: number,
    nodeName: string,
    sameCategoryAsParent: boolean,
    descendantAncestorList: NodeDic
  ) {
    let yval = (yto + yfrom) / 2;
    if (sameCategoryAsParent && Math.abs(yval - parentYval) < 0.05) {
      let distanceToEnd = this.followGraph(
        nodeName,
        descendantAncestorList,
        (n: string) => true
      );
      yval += (yto-yfrom)/2 * (((distanceToEnd + 2) % 2) * 2 - 1); //adding 2 because distance to end could be -1
    }
    return yval;
  }

  computeXPositionOfLabel(
    childNodeName: string,
    childCategory: string,
    descendantAncestorList: NodeDic,
    previousElementsInSameCategory: number,
    xDirection: (x: number) => number,
    nodeExtremas: NodeExtremas
  ): number {
    let remainingElements = this.followGraph(
      childNodeName,
      descendantAncestorList,
      (d: string) => this.nodeType[d] === childCategory
    );
    if (
      //remainingElements===-1 means that the graph ends there but it should not be shifted to the left (or the right depending on xdirection) unless it is in left-most or right-most category
      remainingElements === -1 &&
      childCategory !== nodeExtremas.min &&
      childCategory !== nodeExtremas.max
    ) {
      remainingElements = 0;
    }
    const xval = xDirection(
      (1 + previousElementsInSameCategory) /
        (2 + previousElementsInSameCategory + remainingElements)
    );
    return xval;
  }

  createUniqueKey(nodeName: string, usedKeys: string[]) {
    let key = nodeName;
    while (usedKeys.includes(key)) {
      key += "*";
    }
    return key;
  }

  getArrowType(
    parentType: string,
    childType: string,
    xDirection: (x: number) => number
  ) {
    return "arrow";
    // if (xDirection(0.2) === 0.2) {
    //   return parentType === NodeType.CAUSE_CATEGORY ? "no-arrow" : "arrow";
    // }
    // return childType === NodeType.CAUSE_CATEGORY ? "no-arrow" : "arrow";
  }

  followMaximumOfSummary(
    nodeName: string,
    nodeDic: NodeDic,
    continueTest: (name: string) => boolean,
    summary: (name: string) => number,
    combineContributions: (
      fromFurtherDown: number[],
      thisNodeContribution: number
    ) => number = (nums: number[], num: number) => Math.max(...nums) + num
  ): number {
    if (!continueTest(nodeName)) {
      return 0;
    }
    if (nodeDic[nodeName].length === 0) {
      return summary(nodeName);
    }
    let tmp = nodeDic[nodeName].map((d: string) => {
      return this.followMaximumOfSummary(
        d,
        nodeDic,
        continueTest,
        summary,
        combineContributions
      );
    });
    return combineContributions(tmp, summary(nodeName));
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

  getAncestors(nodeName: string): string[] {
    return this.ancestorList[nodeName];
  }

  getDescendants(nodeName: string): string[] {
    return this.descendantList[nodeName];
  }

  getLowestAndHighestCategory(listOfNodes: string[]): NodeExtremas {
    let minindex = NODE_ORDER.length;
    let maxindex = 0;
    let categoriesPresent: NodeType[] = [];
    listOfNodes.forEach((d: string) => {
      categoriesPresent.push(this.nodeType[d]);
      let i = NODE_ORDER.indexOf(this.nodeType[d]);
      if (i > maxindex) {
        maxindex = i;
      }
      if (i < minindex) {
        minindex = i;
      }
    });
    let visitedNodesInOrder = NODE_ORDER.filter((d: NodeType) => {
      return categoriesPresent.includes(d);
    });
    let res = {
      min: NODE_ORDER[minindex],
      max: NODE_ORDER[maxindex],
      nodeCategories: visitedNodesInOrder,
    };
    return res;
  }

}
