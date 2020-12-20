import * as d3 from "d3";
import RelationLinks, {
  CAUSE,
  INPUT,
  PlottingInfo,
  TransformedLabel,
} from "../models/RelationLinks";
import { ALTERNATING_COLORS } from "./Helpers";

interface PlottingNodeDicValue {
  bbox: SVGRect;
  x: number;
  y: number;
  x_relative: number;
  cat: string;
  nodeName: string;
}

interface PlottingNodeDic {
  [key: string]: PlottingNodeDicValue;
}

export default class RelationLinkViz {
  constructor(
    canvas: HTMLElement | null,
    rdat: RelationLinks,
    elementInFocus: string,
    changeElementInFocus:  (d:string) => void,
  ) {
    const pdat: PlottingInfo = rdat.makePlottingInstructions(elementInFocus);
    const transformedLabels = pdat.transformedLabels;
    const arrows = pdat.arrows;

    const xDivisions = pdat.xDivisions;
    const svg = d3
      .select(canvas)
      .append("svg")
      .attr("width", 900)
      .attr("height", 800);

    const maxX = getMax(transformedLabels, "x");
    const maxY = getMax(transformedLabels, "y");

    const x = d3
      .scaleLinear()
      .domain([-0.5, Math.max(maxX * 1.1)])
      .range([0, 900]);

    const yfromDomain = -0.5;
    const ytoDomain = Math.max(10, maxY);
    const y = d3.scaleLinear().domain([yfromDomain, ytoDomain]).range([0, 800]);

    const backgroundBoxes = svg
      .selectAll("rect")
      .data(xDivisions)
      .enter()
      .append("rect")
      .attr("x", (d: any) => x(d.x0))
      .attr("width", (d: any) => x(d.x0 + d.width) - x(d.x0))
      .attr("y", y(yfromDomain))
      .attr("height", y(ytoDomain) - y(yfromDomain))
      .attr("fill", function (d: any, i: number) {
        return ALTERNATING_COLORS[i % 2];
      })
      .attr("opacity", 0.5);

    const stext = svg
      .selectAll("text")
      .data(transformedLabels, function (d: any) {
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
      .attr("alignment-baseline", "central")
      .on("click", function(e: Event, d: TransformedLabel){
        changeElementInFocus(d.nodeName)})
      .call(insertBB);
    stext.each(function (d: any, i: number) {
      console.log(this.getBBox());
    });

    console.log(transformedLabels);

    let nodeDic: PlottingNodeDic = {};

    transformedLabels.forEach((ut: any) => {
      console.log(ut.key);
      nodeDic[ut.key] = shiftTarget(ut, x);
    });
    console.log("newNodeDic");
    console.log(nodeDic);

    const slines = svg
      .selectAll("line")
      .data(arrows)
      .enter()
      .append("line")
      .attr("x1", function (d: any) {
        console.log(d.from);
        console.log(nodeDic[d.from]);
        return x(nodeDic[d.from].x);
      })
      .attr("y1", function (d: any) {
        return y(nodeDic[d.from].y);
      })
      .attr("x2", function (d: any) {
        return x(nodeDic[d.to].x);
      })
      .attr("y2", function (d: any) {
        return y(nodeDic[d.to].y);
      })
      .attr("stroke-width", "1px")
      .attr("stroke", "black");
  }

  clear() {
    d3.select("svg").remove();
  }
}

function insertBB(selection: d3.Selection<any, any, any, any>) {
  selection.each(function (d: any) {
    d.bbox = this.getBBox();
  });
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

function shiftTarget(
  node: PlottingNodeDicValue,
  scale: d3.ScaleLinear<number, number, never>
): PlottingNodeDicValue {
  if (node.cat === INPUT) {
    return { ...node, x: node.x + scale.invert(node.bbox.width)-scale.invert(0) };
  } else if (node.cat === CAUSE) {
    return { ...node, x: node.x - scale.invert(node.bbox.width)+scale.invert(0) };
  }
  return node;
}
