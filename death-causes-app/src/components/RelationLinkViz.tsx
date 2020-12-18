import * as d3 from "d3";
import RelationLinks, { TransformedLabel, CAUSE, INPUT } from "../models/RelationLinks";

export default class RelationLinkViz {
  constructor(
    canvas: HTMLElement | null,
    rdat: RelationLinks,
    elementInFocus: string
  ) {
    const pdat: TransformedLabel[] = rdat.makePlottingInstructions(
      elementInFocus
    );
    console.log(pdat);
    const svg = d3
      .select(canvas)
      .append("svg")
      .attr("width", 900)
      .attr("height", 800);

    const maxX = getMax(pdat, "x");
    const maxY = getMax(pdat, "y");

    const x = d3
      .scaleLinear()
      .domain([-0.5, Math.max(maxX * 1.1)])
      .range([0, 900]);

    const y = d3
      .scaleLinear()
      .domain([-0.5, Math.max(10, maxY)])
      .range([0, 800]);

    const stext=svg
      .selectAll("text")
      .data(pdat, function (d: any) {
        return d.nodeName;
      })
      .enter()
      .append("text")
      .attr("y", (d: any) => y(d.y) as number)
      .attr("x", (d: any) => x(d.x) as number)
      .text((d: any) => d.nodeName)
      .attr("text-anchor", (d: any) => {
        if (d.cat === INPUT) {
          return "start";
        }
        if (d.cat === CAUSE) {
          return "end";
        } else {
          return "middle";
        }
      })
      .attr("alignment-baseline", "center")
    stext.each(function(d:any,i:number){
        console.log(this.getBBox());
      })
  }

  clear() {
    d3.select("svg").remove();
  }
}

function getMax(dataset: TransformedLabel[], v: string): number {
  let a: number | undefined;
  if (v === "x") {
    a = d3.max(dataset, (d: TransformedLabel) => d.x);
  } else if (v === "y") {
    a = d3.max(dataset, (d: TransformedLabel) => d.y);
  } else {
    a = 1.0;
  }

  if (a === undefined) {
    a = 1.0;
  }
  return a;
}
