import Descriptions from "../../models/Descriptions";
import { KnowledgeableOptimizabilities } from "../../models/Optimizabilities";
import { CauseGrouping, CauseToParentMapping, ParentToCausesMapping } from "../../models/RelationLinks";
import { InnerCause } from "../../models/updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy";
import RootStore from "../../stores/rootStore";
import { DataSet } from "../PlottingData";
import BarChartSettings, { ExpandCatsData } from "./BarChartSettings";
import make_squares from "./ComputationEngine";

export default class DeathCauseBarChartSettings extends BarChartSettings{


    

    useLifeExpectancy: boolean;

    constructor(simpleVersion: boolean, useLifeExpectancy: boolean, descriptions: Descriptions){
        super(simpleVersion, false, descriptions);
        this.useLifeExpectancy=useLifeExpectancy;
    }

    getElementToWidth(store: RootStore): string | null{
        return store.barChartStore.diseaseToWidth;
    }

    setElementToWidth(store: RootStore){
        return store.barChartStore.setDiseaseToWidth;
    }

    getGrouping(store: RootStore): CauseGrouping{
        return store.barChartStore.explicitCollectedGroups;
    }

    getHeader(): string{
        return this.useLifeExpectancy ? "Years lost to cause" : "Probability of dying from cause"
    }

    getUseLifeExpectancy(){
        return this.useLifeExpectancy;
    }

    getConditionVizFlavor(){
        return null;
    }

    computeExpandSquares(
        dataset: DataSet | InnerCause, 
        removed: string[], 
        added: string[], 
        diseaseToWidth: string | null, 
        oldCollectedGroups: CauseGrouping, 
        newCollectedGroups: CauseGrouping,
        optimizabilities: KnowledgeableOptimizabilities
    ): ExpandCatsData {
        if(this.useLifeExpectancy){
            const showingInheritanceCauseToParent: CauseToParentMapping={};
            const directCauseToParent: CauseToParentMapping = {}
            Object.keys(oldCollectedGroups.parentToCauses).forEach( nodeName => { 
              if(!removed.includes(nodeName)){
                showingInheritanceCauseToParent[nodeName]=nodeName
                directCauseToParent[nodeName]=nodeName
              }        
            })
            added.forEach( addedNode => {
              showingInheritanceCauseToParent[addedNode]=removed[0]
              directCauseToParent[addedNode]=addedNode
            })
            const showInheritanceGrouping: CauseGrouping= {
              causeToParent: showingInheritanceCauseToParent,
              parentToCauses: {}
            }
            const directGrouping: CauseGrouping = {
              causeToParent: directCauseToParent,
              parentToCauses: {}
            }
            const data=Object.entries(dataset as InnerCause).filter(
              ([causeName, datrow]) => {
                return causeName in newCollectedGroups.parentToCauses
              }
            ).map(([causeName, datrow])=> {
              return datrow
            })
            const structureIfNotMerged:{[key:string]: CauseGrouping}={};
            structureIfNotMerged[removed[0]]=directGrouping;
            const { allSquares: dataSquares, totalProbs } = make_squares(
              data,
              diseaseToWidth,
              directGrouping,
              optimizabilities,
              this
            );
            const {allSquares: noMergeSquares, totalProbs: noMergeTotals} = make_squares(
              data,
              diseaseToWidth,
              showInheritanceGrouping,
              optimizabilities,
              this,
              structureIfNotMerged
            )
            const {allSquares: preSquares, totalProbs: preTotals} = make_squares(
              data,
              diseaseToWidth,
              showInheritanceGrouping,
              optimizabilities,
              this
            )
            return {dataSquares, totalProbs, noMergeSquares, noMergeTotals, preSquares, preTotals}
          }
          else{
            const { allSquares: dataSquares, totalProbs } = make_squares(
              dataset as DataSet,
              diseaseToWidth,
              newCollectedGroups,
              optimizabilities,
              this
            );
            const notToBeMerged = getSubCollectGroup(newCollectedGroups, added, removed[0]);
            const {
              allSquares: noMergeSquares,
              totalProbs: noMergeTotals,
            } = make_squares(
              dataset as DataSet,
              diseaseToWidth,
              oldCollectedGroups,
              optimizabilities,
              this,
              notToBeMerged
            );
            return {dataSquares, totalProbs, noMergeSquares, noMergeTotals, preSquares: [], preTotals: []}
        }
    }

    computeCollapseSquares(
        dataset: DataSet | InnerCause, 
        removed: string[], 
        added: string[],
        diseaseToWidth: string | null, 
        oldCollectedGroups: CauseGrouping, 
        newCollectedGroups: CauseGrouping, 
        optimizabilities: KnowledgeableOptimizabilities
    ) {
        if(this.useLifeExpectancy){
            const replacementCauseToParent: CauseToParentMapping= {}
            const replacementCauseToParentNoMerge: CauseToParentMapping = {}
            const finalCauseToParent: CauseToParentMapping = {}
            Object.keys(newCollectedGroups.parentToCauses).filter(
              nodeName => !added.includes(nodeName)
            ).forEach(nodeName => {
              replacementCauseToParent[nodeName]=nodeName;
              replacementCauseToParentNoMerge[nodeName]=nodeName;
              finalCauseToParent[nodeName]=nodeName;
            })
            removed.forEach(removedNode => {
              replacementCauseToParent[removedNode]=added[0]
              replacementCauseToParentNoMerge[removedNode]=removedNode
            })
            finalCauseToParent[added[0]]=added[0];  
            const replacementGrouping:CauseGrouping = {
              parentToCauses: {}, 
              causeToParent: replacementCauseToParent
            }
            const replacementGroupingNoMerge = {
              parentToCauses: {}, 
              causeToParent: replacementCauseToParentNoMerge
            }
            const finalGrouping = {
              parentToCauses: {},
              causeToParent: finalCauseToParent
            }
            const structureIfNotMerged: {[key:string]: CauseGrouping}={}
            structureIfNotMerged[added[0]]=replacementGroupingNoMerge
            let data= Object.entries(dataset as InnerCause).filter(
              ([causeOrCategoryName, dataRow]) => {
                const notHidden= causeOrCategoryName in newCollectedGroups.parentToCauses 
                const aboutToBeHidden= removed.includes(causeOrCategoryName)
                const aboutToBeUnhidden = added.includes(causeOrCategoryName)
                return (notHidden || aboutToBeHidden) && !aboutToBeUnhidden
              }
            ).map(  ([causeOrCategoryName, dataRow]) => { 
              return dataRow;
            }); 
            let { allSquares: dataSquares, totalProbs } = make_squares(
              data,
              diseaseToWidth,
              replacementGrouping,
              optimizabilities,
              this
            );
            let { allSquares: noMergeSquares} = make_squares(
              data,
              diseaseToWidth,
              replacementGrouping,
              optimizabilities,
              this,
              structureIfNotMerged
            );
            let finalData= Object.entries(dataset as InnerCause).filter(
              ([causeOrCategoryName, dataRow]) => {
                return causeOrCategoryName in newCollectedGroups.parentToCauses 
              }
            ).map( ([causeOrCategoryName, dataRow]) => { 
              return dataRow;
            }); 
            let { allSquares: finalSquares, totalProbs: finalTotals} = make_squares(
              finalData,
              diseaseToWidth,
              finalGrouping,
              optimizabilities,
              this
            );
            return {noMergeSquares, dataSquares, totalProbs, finalSquares, finalTotals}
          }
          else{
            const notToBeMerged = getSubCollectGroup(
              oldCollectedGroups,
              removed,
              added[0]
            );
            let { allSquares: dataSquares, totalProbs } = make_squares(
              dataset as DataSet,
              diseaseToWidth,
              newCollectedGroups,
              optimizabilities,
              this
            );
            let { allSquares: noMergeSquares} = make_squares(
              dataset as DataSet,
              diseaseToWidth,
              newCollectedGroups,
              optimizabilities,
              this,
              notToBeMerged
            );
            return {noMergeSquares, dataSquares, totalProbs, finalSquares: [], finalTotals: []}
          } 
    }

}


function getSubCollectGroup(
    groupingWithSubGroups: CauseGrouping,
    subGroupNames: string[],
    bigGroupName: string
  ): { [key: string]: CauseGrouping } {
    let parentToCauses: ParentToCausesMapping = {};
    let causeToParent: CauseToParentMapping = {};
    subGroupNames.forEach((subGroupName: string) => {
      let children = groupingWithSubGroups.parentToCauses[subGroupName];
      parentToCauses[subGroupName] = children;
      children.forEach((child: string) => {
        causeToParent[child] = subGroupName;
      });
    });
    let res: { [key: string]: CauseGrouping } = {};
    res[bigGroupName] = { parentToCauses, causeToParent };
    return res;
  }