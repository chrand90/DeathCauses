import * as d3 from "d3";

export const ALTERNATING_COLORS = ["#CFCFCF", "#E4E4E4"];
export const CLICKED_COLOR = "#551A8B";
export const LINK_COLOR = "#0000EE";
export const SAVE_FILE_NAME ="personalData.json"
export const QUERY_STRING_START = "?inputData="

const toolTipNamesShowHide=['.stip','.clicktip','.barplottip','buttontip']
const toolTipsOpacity=['.arrowexplanation']
export const DEATHCAUSES_COLOR= "#94c5b1"
export const DEATHCAUSES_LIGHT="#c5ded4"
export const DEATHCAUSES_DARK="#80b19d"



export function getDivWidth(div: HTMLElement | null): number {
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

export function formatYears(years: number, fullUnit: boolean=true){
  if(years>1){
    return +years.toFixed(1) + " years"
  }
  if(years>1/12){
    const unit = fullUnit ? "months" : "mths."
    return (years*12).toFixed(1)+" "+unit
  }
  if(years>1/365){
    return (years*365).toFixed(1)+" days"
  }
  if(years>1/365/24){
    return (years*24*365).toFixed(1)+ " hours"
  }
  if(years>1/365/24/60){
    const unit = fullUnit ? "minutes" : "min."
    return (years*24*365*60).toFixed(0)+ " "+unit
  }
  if(years>1/365/24/60/60*6){
    const unit = fullUnit ? "seconds" : "s"
    return parseFloat((years*24*365*60*60).toPrecision(1)).toFixed(0)+ " "+unit
  }
  return "0"
}

export function customPrecision(inputNumber: number | string, digits: number): string{
  let s: string;
  let n: number;
  if(typeof inputNumber==="number"){
    n=inputNumber
  }
  else{
    n=parseFloat(inputNumber)
  }
  if(n>(10**digits-1)){
    s=n.toFixed(0);
    return s;
  }
  else{
    s=n.toPrecision(digits)
  }
  const beforeAndAfterComma=s.split(".")
  if(beforeAndAfterComma.length===1){
    console.log("returning without comma")
    return beforeAndAfterComma[0]
  }
  const suffix=beforeAndAfterComma[1].replace(/0+$/,"")
  return beforeAndAfterComma[0]+ (suffix.length>0 ? '.'+suffix : "")
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