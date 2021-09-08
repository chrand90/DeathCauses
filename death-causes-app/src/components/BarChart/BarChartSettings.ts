import * as d3 from "d3";
import Descriptions from "../../models/Descriptions";
import { KnowledgeableOptimizabilities } from "../../models/Optimizabilities";
import { CauseGrouping } from "../../models/RelationLinks";
import { InnerCause } from "../../models/updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy";
import BarChartStore from "../../stores/BarChartOptionsStore";
import RootStore from "../../stores/rootStore";
import { ConditionVizFlavor, Visualization } from "../../stores/UIStore";
import { DataRow, DataSet } from "../PlottingData";
import make_squares, { SquareSection } from "./ComputationEngine";

export interface ExpandCatsData {
    dataSquares: SquareSection[], 
    totalProbs: DataSet, 
    noMergeSquares: SquareSection[], 
    noMergeTotals: DataSet, 
    preSquares: SquareSection[], 
    preTotals: DataRow[]
}

export interface CollapseCatsData {
    dataSquares: SquareSection[], 
    totalProbs: DataSet, 
    noMergeSquares: SquareSection[], 
    finalSquares: SquareSection[], 
    finalTotals: DataRow[]
}

export default abstract class BarChartSettings {

    simpleVersion: boolean;
    makeExpandButtons: boolean;
    descriptions: Descriptions;

    constructor(simpleVersion: boolean, makeExpandButtons: boolean, descriptions: Descriptions){
        this.simpleVersion=simpleVersion;
        this.makeExpandButtons=makeExpandButtons;
        this.descriptions=descriptions;
    }
    
    abstract getElementToWidth(store: RootStore): string | null;

    abstract setElementToWidth(store: RootStore): (newElementToWidth: string | null)=> void

    abstract getGrouping(store: RootStore): CauseGrouping;

    abstract getHeader(): string;

    abstract getUseLifeExpectancy(): boolean;

    abstract getConditionVizFlavor(): ConditionVizFlavor | null;

    abstract computeExpandSquares(
        dataset: DataSet | InnerCause,
        removed: string[],
        added: string[],
        diseaseToWidth: string | null,
        oldCollectedGroups: CauseGrouping,
        newCollectedGroups: CauseGrouping,
        optimizabilities: KnowledgeableOptimizabilities
      ): ExpandCatsData;

    abstract computeCollapseSquares(
        dataset: DataSet | InnerCause,
        removed: string[],
        added: string[],
        diseaseToWidth: string | null,
        oldCollectedGroups: CauseGrouping,
        newCollectedGroups: CauseGrouping,
        optimizabilities: KnowledgeableOptimizabilities
      ): CollapseCatsData; 

    computeRankAndSquares(
        data: DataRow[] | InnerCause,
        diseaseToWidth: string | null,
        optimizabilities: KnowledgeableOptimizabilities,
        grouping: CauseGrouping,
      ): {
        dataSortedTotal: DataRow[];
        dataSquares: SquareSection[];
        dataIds: number[];
      }{
        let totalProbs: DataRow[];
        let dataSquares: SquareSection[];
        if(this.getUseLifeExpectancy()){
          let dataset= Object.entries(data as InnerCause).filter(
            ([causeOrCategoryName, dataRow]) => {
              return causeOrCategoryName in grouping.parentToCauses
            }
          ).map(  ([causeOrCategoryName, dataRow]) => { 
            return dataRow;
          }); 
          ({ allSquares: dataSquares, totalProbs } = make_squares(
            dataset,
            diseaseToWidth,
            undefined,
            optimizabilities,
            this
          ));
        }
        else{
          ({ allSquares: dataSquares, totalProbs } = make_squares(
            Object.values(data as InnerCause),
            diseaseToWidth,
            grouping,
            optimizabilities,
            this
          ));
        }
        const dataSortedTotal = copyOfSortedDataset(totalProbs, "totalProb");
        const dataIds = dataSortedTotal.map((v: any, index: number) => {
          return index;
        });
        return { dataSortedTotal, dataSquares, dataIds };
      }

    // abstract makeSquares(
    //     data: DataSet, 
    //     elementToWidth: string | null, 
    //     grouping: CauseGrouping, 
    //     optimizabilities: KnowledgeableOptimizabilities,
    //     noMergeSquares?: CauseGrouping): SquareSection[];

}

function copyOfSortedDataset(
    dataset: DataSet,
    sorter: "totalProb" | "name" = "totalProb"
  ): DataSet {
    return dataset.slice().sort(function (a: DataRow, b: DataRow) {
      return d3.descending(a[sorter], b[sorter]);
    });
  }