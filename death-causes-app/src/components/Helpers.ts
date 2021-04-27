import * as d3 from "d3";

export const ALTERNATING_COLORS = ["#CFCFCF", "#E4E4E4"];
export const CLICKED_COLOR = "#551A8B";
export const LINK_COLOR = "#0000EE";

export enum Visualization {
  RELATION_GRAPH = "Relation graph",
  BAR_GRAPH = "Risk factor contributions",
  NO_GRAPH = "Nothing",
  SURVIVAL_GRAPH = "Survival curve",
}

export interface OrderVisualization {
  orderVisualization: (elementInFocus: string, vizType: Visualization) => void;
}

export function getDivWidth(div: HTMLElement | null): number {
  console.log(div);
  if (div === null) {
    return 0;
  }
  var width = d3
    .select(div)
    // get the width of div element
    .style("width")
    // take of 'px'
    .slice(0, -2);
  // return as an integer
  return Math.round(Number(width));
}

export enum ComputationState {
  CHANGED = "Changed",
  RUNNING = "Running",
  READY = "Ready",
}
