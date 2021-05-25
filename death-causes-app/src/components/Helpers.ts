import * as d3 from "d3";

export const ALTERNATING_COLORS = ["#CFCFCF", "#E4E4E4"];
export const CLICKED_COLOR = "#551A8B";
export const LINK_COLOR = "#0000EE";

const toolTipNamesShowHide=['.stip','.clicktip','.d3-tip']
const toolTipsOpacity=['.arrowexplanation']

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


export function hideAllToolTips(){
  return 
  toolTipNamesShowHide.forEach((className) => {
    d3.selectAll(className).remove();
  })
  toolTipsOpacity.forEach((className) => {
    d3.selectAll(className).style('opacity',0);
  })
}

//thanks to Tim Down https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
export function hexToRgb(hex:string) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}
