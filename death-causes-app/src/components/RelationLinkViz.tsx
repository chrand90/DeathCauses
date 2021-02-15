import * as d3 from "d3";
import d3Tip from "d3-tip";
import RelationLinks, {
  Arrow,
  CAUSE,
  INPUT,
  CAUSE_CATEGORY,
  PlottingInfo,
  TransformedLabel,
} from "../models/RelationLinks";
import { ALTERNATING_COLORS, getDivWidth } from "./Helpers";
import "./RelationLinkViz.css";

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

interface ArrowExtender {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

interface ArrowPlottingObject extends Arrow, ArrowExtender {}



export default class RelationLinkViz {
  constructor(
    canvas: HTMLElement | null,
    rdat: RelationLinks,
    elementInFocus: string,
    changeElementInFocus: (d: string) => void
  ) {
    const width = getDivWidth(canvas);
    console.log("wdth");
    console.log(width);
    const pdat: PlottingInfo = rdat.makePlottingInstructions(elementInFocus);
    const transformedLabels = pdat.transformedLabels;
    const arrows = pdat.arrows;

    const xDivisions = pdat.xDivisions;
    const svg = d3
      .select(canvas)
      .append("svg")
      .attr("width", Math.max(width - 10, 800))
      .attr("height", 800);

    const maxX = getMax(transformedLabels, "x");
    const maxY = getMax(transformedLabels, "y");

    const x = d3
      .scaleLinear()
      .domain([-maxX * 0.05, maxX * 1.05])
      .range([0.1, Math.max(width - 10, 800) * 0.9]);

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
      .style("fill", function (d: any) {
        return d.cat === CAUSE_CATEGORY
          ? null
          : d.nodeName === elementInFocus
          ? "#551A8B"
          : "#0000EE";
      })
      .style("text-decoration", function (d: any) {
        return d.cat === CAUSE_CATEGORY ? null : "underline";
      })
      .style("font-weight", function (d: any) {
        return d.nodeName === elementInFocus ? 700 : null;
      })
      .style("cursor", function (d: any) {
        return d.cat === CAUSE_CATEGORY ? null : "pointer";
      })
      .attr("alignment-baseline", "central")
      .on("click", function (e: Event, d: TransformedLabel) {
        changeElementInFocus(d.nodeName);
      })
      .call(insertBB);
    stext.each(function (d: any, i: number) {
      console.log(this.getBBox());
    });

    console.log(transformedLabels);

    let nodeDic: PlottingNodeDic = {};

    transformedLabels.forEach((ut: any) => {
      nodeDic[ut.key] = ut;
    });

    let adjustedArrows = arrows.map((a: Arrow) => {
      return {
        ...a,
        ...computeArrowEndPoints(nodeDic[a.from], nodeDic[a.to], x, y),
      };
    });
    console.log(adjustedArrows);
    console.log(nodeDic);

    //taken from https://stackoverflow.com/questions/36579339/how-to-draw-line-with-arrow-using-d3-js
    svg
      .append("svg:defs")
      .append("svg:marker")
      .attr("id", "triangle")
      .attr("refX", 3)
      .attr("refY", 3)
      .attr("markerWidth", 30)
      .attr("markerHeight", 30)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 6 3 0 6 1.5 3")
      .style("fill", "black");

    d3.select(".d3-tip").remove(); //removes any old visible tooltips that was perhaps not removed by a mouseout event (for example because the mouse teleported instantanously by entering/exiting a full-screen).

    var tooltipdiv = d3.select('body')
      .append("div")
      .attr("class", "arrowexplanation")
      .style("opacity", 0);

    const underlines = svg
      .selectAll(".underlines")
      .data(adjustedArrows, function (d: any) {
        return d.from + " - " + d.to;
      })
      .enter()
      .append("line")
      .attr("class", "underlines")
      .attr("x1", (d: any) => d.x1)
      .attr("y1", (d: any) => d.y1)
      .attr("x2", (d: any) => d.x2)
      .attr("y2", (d: any) => d.y2)
      .attr("stroke-width", "1")
      .attr("stroke", "black")
      .attr("marker-end", (d: any) => {
        return d.type === "arrow" ? "url(#triangle)" : null;
      });

    const overlines = svg
      .selectAll(".overlines")
      .data(adjustedArrows, function (d: any) {
        return d.from + " - " + d.to;
      })
      .enter()
      .append("line")
      .attr("class", "overlines")
      .attr("x1", (d: any) => d.x1)
      .attr("y1", (d: any) => d.y1)
      .attr("x2", (d: any) => d.x2)
      .attr("y2", (d: any) => d.y2)
      .attr("stroke-width", "15")
      .attr("stroke", "black")
      .attr("opacity", 0)
      .attr("cursor", "pointer")
      .on("mouseover", function (e: Event, d: ArrowPlottingObject) {
        svg
          .selectAll(".underlines")
          .filter(function (ud: any) {
            {
              return d.from + " - " + d.to === ud.from + " - " + ud.to;
            }
          })
          .attr("stroke-width", 3);
      })
      .on("mouseout", function (e: Event, d: ArrowPlottingObject) {
        svg
          .selectAll(".underlines")
          .filter(function (ud: any) {
            {
              return d.from + " - " + d.to === ud.from + " - " + ud.to;
            }
          })
          .attr("stroke-width", 1);
      })
      .on("click", function (e: MouseEvent, d: ArrowPlottingObject) {
        var x = e.pageX; //x position within the element.
        var y = e.pageY;  //y position within the element.
        tooltipdiv
          .style("opacity", 1)
          .html(`<small>${rdat.formulation(d.from, d.to)}</small>`)
          .style("left", x + "px")
          .style("top", y + "px");
        e.stopPropagation();
      });
    svg.on("click", () => {
      tooltipdiv.style("opacity", 0);
    });
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
    return {
      ...node,
      x: node.x + scale.invert(node.bbox.width) - scale.invert(0),
    };
  } else if (node.cat === CAUSE) {
    return {
      ...node,
      x: node.x - scale.invert(node.bbox.width) + scale.invert(0),
    };
  }
  return node;
}

function computeArrowEndPoints(
  fromNode: PlottingNodeDicValue,
  toNode: PlottingNodeDicValue,
  xscale: d3.ScaleLinear<number, number, never>,
  yscale: d3.ScaleLinear<number, number, never>
) {
  const x1org = xscale(fromNode.x);
  const y1org = yscale(fromNode.y);
  const x2org = xscale(toNode.x);
  const y2org = yscale(toNode.y);
  const aorg = (y2org - y1org) / (x2org - x1org);
  let percentage = (Math.atan(aorg) * 2) / Math.PI;
  let arrowExtender: ArrowExtender = { x1: 0, x2: 0, y1: 0, y2: 0 };

  //Leftbox
  let h1 = fromNode.bbox.height / 2;
  let w1 = fromNode.bbox.width / 2;
  let wOrg1 = fromNode.bbox.width / 2;
  let R1 = h1 / (h1 + w1);
  let xAdd1 = 0;
  if (fromNode.cat === INPUT) {
    w1 = h1;
    xAdd1 = wOrg1;
  }
  //Rightbox
  let h2 = toNode.bbox.height / 2;
  let w2 = toNode.bbox.width / 2;
  let wOrg2 = toNode.bbox.width / 2;
  let R2 = h2 / (h2 + w2);
  let xAdd2 = 0;
  if (toNode.cat === CAUSE) {
    w2 = h2;
    xAdd2 = -wOrg2;
  }

  // if (x1org + wOrg1 + xAdd1 > x2org - wOrg2 + xAdd2) {
  //   //The two labels overlap in the y-direction, which means that we should increase the percentage to make sure that no arrows go backwards
  //   percentage = Math.sign(percentage);
  //   if (fromNode.cat === INPUT) {
  //     w1 = fromNode.bbox.width / 5;
  //   }
  //   if (toNode.cat === CAUSE) {
  //     w2 = toNode.bbox.width / 5;
  //   }
  // }

  if (Math.abs(percentage) > R1) {
    arrowExtender.y1 = y1org + Math.sign(percentage) * h1;
    arrowExtender.x1 =
      x1org - ((Math.abs(percentage) - R1) / (1 - R1)) * w1 + wOrg1 + xAdd1;
  } else {
    arrowExtender.y1 = y1org + percentage * h1;
    arrowExtender.x1 = x1org + wOrg1 + xAdd1;
  }

  if (Math.abs(percentage) > R2) {
    arrowExtender.y2 = y2org - Math.sign(percentage) * h2;
    arrowExtender.x2 =
      x2org + ((Math.abs(percentage) - R2) / (1 - R2)) * w2 - wOrg2 + xAdd2;
  } else {
    arrowExtender.y2 = y2org - percentage * h2;
    arrowExtender.x2 = x2org - wOrg2 + xAdd2;
  }

  if (arrowExtender.x1 > arrowExtender.x2) {
    let tmp = arrowExtender.x2;
    arrowExtender.x2 = arrowExtender.x1;
    arrowExtender.x1 = tmp;
  }

  return shortenArrow(arrowExtender, 10);
}

function shortenArrow(ae: ArrowExtender, pixels: number): ArrowExtender {
  let a = (ae.y2 - ae.y1) / (ae.x2 - ae.x1);
  let xchange = Math.floor(pixels / Math.sqrt(1 + a ** 2));
  if (xchange > (ae.x2 - ae.x1) * 0.33) {
    return ae;
  }
  return {
    y1: ae.y1 + a * xchange,
    x1: ae.x1 + xchange,
    y2: ae.y2 - a * xchange,
    x2: ae.x2 - xchange,
  };
}
