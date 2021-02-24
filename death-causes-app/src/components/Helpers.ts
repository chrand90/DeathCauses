import * as d3 from 'd3';

export const ALTERNATING_COLORS=["#CFCFCF","#E4E4E4"];

export enum Visualization {
  RELATION_GRAPH="relation-graph",
  BAR_GRAPH="bar-graph",
  NO_GRAPH="no-graph"
}

export interface OrderVisualization {
  orderVisualization: (elementInFocus: string, vizType: Visualization) => void;
}


export function getDivWidth(div: HTMLElement | null): number {
	console.log(div);
	if(div === null){
		return 0;
	}
    var width = d3.select(div)
      // get the width of div element
      .style('width')
      // take of 'px'
      .slice(0, -2)
    // return as an integer
    return Math.round(Number(width))
  }