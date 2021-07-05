import * as d3 from "d3";

export const ALTERNATING_COLORS = ["#CFCFCF", "#E4E4E4"];
export const CLICKED_COLOR = "#551A8B";
export const LINK_COLOR = "#0000EE";
export const SAVE_FILE_NAME ="personalData.json"
export const QUERY_STRING_START = "?inputData="

const toolTipNamesShowHide=['.stip','.clicktip','.d3-tip','buttontip']
const toolTipsOpacity=['.arrowexplanation']




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
