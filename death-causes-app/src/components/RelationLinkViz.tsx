import * as d3 from "d3";
import d3Tip from "d3-tip";
import RelationLinks, {
  Arrow,
  NodeType,
  NODE_ORDER,
  PlottingInfo,
  TransformedLabel,
  NodeExtremas,
  XDivision,
} from "../models/RelationLinks";
import { ALTERNATING_COLORS, getDivWidth } from "./Helpers";
import "./RelationLinkViz.css";

const SLIGHTLY_DARKER_GRAY="#aaaaaa"
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
  rdat: RelationLinks;
  changeElementInFocus: (d: string) => void;
  width: number = 0;
  svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;

  constructor(
    canvas: HTMLElement | null,
    rdat: RelationLinks,
    elementInFocus: string,
    changeElementInFocus: (d: string) => void
  ) {
    this.width = getDivWidth(canvas);
    console.log("wdth");
    console.log(this.width);
    this.rdat = rdat;
    this.changeElementInFocus = changeElementInFocus;

    this.svg = d3
      .select(canvas)
      .append("svg")
      .attr("width", Math.max(this.width - 10, 800))
      .attr("height", 1000);
    const vis = this;

    const {
      transformedLabels,
      arrows,
      nodeExtremas,
      xDivisions,
    } = this.computeDataTransformations(elementInFocus);

    const { x, y, yfromDomain, ytoDomain } = this.computeAxes(
      transformedLabels
    );

    const backgroundBoxes = this.svg
      .selectAll(".darkrect")
      .data(xDivisions, function (d: any) {
        return d.cat;
      })
      .enter()
      .append("rect")
      .call((selection) => {
        insertColor(selection, xDivisions);
      })
      .attr("class", "darkrect")
      .attr("x", (d: any) => x(d.x0))
      .attr("width", (d: any) => x(d.x0 + d.width) - x(d.x0))
      .attr("y", y(yfromDomain))
      .attr("height", y(ytoDomain) - y(yfromDomain))
      .style("fill", (d: any) => d.color)
      .style("opacity", 0.8);

    const categoryText = this.svg.selectAll(".cattext")
      .data(xDivisions, function (d: any) {
        return d.cat;
      })
      .enter()
      .append("text")
      .attr("class","cattext")
      .attr("x", (d:any) => x(d.x0))
      .attr("y", y(yfromDomain))
      .text( function(d:any){
        if(d.width>0){
          return d.cat;
        }
        return undefined;
      })
      .style("fill", SLIGHTLY_DARKER_GRAY)
      .style("font-size","12px")
      .attr("text-anchor", "start")
      .attr("alignment-baseline", "hanging")
      .style("opacity", function(d:any){
        if(d.width>0){
          return 1;
        }
        return 0;
      })



    const stext = this.svg
      .selectAll(".linktext")
      .data(transformedLabels, function (d: any) {
        return d.nodeName;
      })
      .enter()
      .append("text")
      .attr("class", "linktext")
      .attr("y", (d: any) => y(d.y) as number)
      .attr("x", (d: any) => x(d.x) as number)
      .text((d: any) => d.nodeName);

    this.addTextProperties(stext, elementInFocus, nodeExtremas);

    let nodeDic: PlottingNodeDic = {};

    transformedLabels.forEach((ut: any) => {
      nodeDic[ut.key] = ut;
    });

    let adjustedArrows = arrows.map((a: Arrow) => {
      return {
        ...a,
        ...computeArrowEndPoints(
          nodeDic[a.from],
          nodeDic[a.to],
          x,
          y,
          nodeExtremas
        ),
      };
    });

    //taken from https://stackoverflow.com/questions/36579339/how-to-draw-line-with-arrow-using-d3-js
    this.svg
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

    d3.select(".arrowexplanation").remove(); //removes any old visible tooltips that was perhaps not removed by a mouseout event (for example because the mouse teleported instantanously by entering/exiting a full-screen).

    var tooltipdiv = d3
      .select("body")
      .append("div")
      .attr("class", "arrowexplanation")
      .style("opacity", 0);

    const underlines = this.svg
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

    const overlines = this.svg
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
      .call((select) => {
        this.addFunctionalityToOverLines(select);
      });

    vis.svg.on("click", () => {
      tooltipdiv.style("opacity", 0);
    });
    vis.svg.on("mouseleave", () => {
      tooltipdiv.style("opacity", 0);
    });
  }

  addFunctionalityToOverLines(overlines: d3.Selection<any, any, any, any>) {
    const vis = this;
    const tooltipdiv = d3.select(".arrowexplanation");
    overlines
      .on("mouseover", function (e: Event, d: ArrowPlottingObject) {
        vis.svg
          .selectAll(".underlines")
          .filter(function (ud: any) {
            {
              return d.from + " - " + d.to === ud.from + " - " + ud.to;
            }
          })
          .attr("stroke-width", 3);
      })
      .on("mouseout", function (e: Event, d: ArrowPlottingObject) {
        vis.svg
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
        var y = e.pageY; //y position within the element.
        tooltipdiv
          .style("opacity", 1)
          .html(`${vis.rdat.arrowInterpretation(d.from, d.to)}`)
          .style("left", x + "px")
          .style("top", y + "px");
        e.stopPropagation();
      });
  }

  addTextProperties(
    stexts: d3.Selection<any, any, any, any>,
    elementInFocus: string,
    nodeExtremas: NodeExtremas
  ) {
    const vis = this;
    stexts
      .attr("text-anchor", (d: any) => {
        if (d.cat === nodeExtremas.min) {
          return "start";
        }
        if (d.cat === nodeExtremas.max) {
          return "end";
        } else {
          return "middle";
        }
      })
      .style("fill", function (d: any) {
        return d.nodeName === elementInFocus
          ? "#551A8B"
          : "#0000EE";
      })
      .style("text-decoration", function (d: any) {
        return  "underline";
      })
      .style("font-weight", function (d: any) {
        return d.nodeName === elementInFocus ? 700 : null;
      })
      .style("cursor", function (d: any) {
        return  "pointer";
      })
      .attr("alignment-baseline", "central")
      .on("click", function (e: Event, d: TransformedLabel) {
        vis.changeElementInFocus(d.nodeName);
      })
      .call(insertBB);
  }

  computeAxes(transformedLabels: TransformedLabel[]) {
    const maxX = Math.max(getMax(transformedLabels, "x"), 0.01); //making sure that x is positive to handle the case where there are only one variable.
    const maxY = getMax(transformedLabels, "y");

    const x = d3
      .scaleLinear()
      .domain([-maxX * 0.05, maxX * 1.05])
      .range([0.1, Math.max(this.width - 10, 800) * 0.9]);

    const yfromDomain = -0.5;
    const ytoDomain = Math.max(10, maxY);
    const y = d3.scaleLinear().domain([yfromDomain, ytoDomain]).range([0, 800]);
    return { x, y, yfromDomain, ytoDomain, maxX };
  }

  clear() {
    console.log("inside clear");
    d3.select(".arrowexplanation").remove();
    d3.select("svg").remove();
  }

  computeDataTransformations(elementInFocus: string) {
    const pdat: PlottingInfo = this.rdat.makePlottingInstructions(
      elementInFocus
    );
    const transformedLabels = pdat.transformedLabels;
    const arrows = pdat.arrows;
    let nodeExtremas = pdat.nodeExtremas;
    if (nodeExtremas.min === nodeExtremas.max) {
      nodeExtremas.min = NODE_ORDER[0];
      nodeExtremas.max = NODE_ORDER[NODE_ORDER.length - 1];
    }
    const xDivisions = pdat.xDivisions;
    return { transformedLabels, arrows, nodeExtremas, xDivisions };
  }

  update(newElementInFocus: string) {
    const {
      transformedLabels,
      arrows,
      nodeExtremas,
      xDivisions,
    } = this.computeDataTransformations(newElementInFocus);
    const { x, y, yfromDomain, ytoDomain, maxX } = this.computeAxes(
      transformedLabels
    );

    const backgroundBoxes = this.svg
      .selectAll(".darkrect")
      .data(xDivisions, function (d: any) {
        return d.cat;
      });
    backgroundBoxes
      .call((selection) => {
        insertColor(selection, xDivisions);
      })
      .lower()
      .transition("appearNewBackgrounds")
      .duration(500)
      .attr("x", (d: any) => x(d.x0))
      .attr("width", (d: any) => x(d.x0 + d.width) - x(d.x0))
      .style("fill", (d: any) => d.color)
      .style("opacity", 0.8);


    const categoryText = this.svg.selectAll(".cattext")
      .data(xDivisions, function (d: any) {
        return d.cat;
      })
      .transition("adjuse_top_labels")
      .duration(500)
      .attr("x", (d:any) => x(d.x0))
      .text( function(d:any){
        if(d.width>0){
          return d.cat;
        }
        return undefined;
      })
      .style("opacity", function(d:any){
        if(d.width>0){
          return 1;
        }
        return 0;
      })


    const stext = this.svg
      .selectAll(".linktext")
      .data(transformedLabels, function (d: any) {
        return d.nodeName;
      });

    stext
      .join(
        (enter: any) => {
          return enter
            .append("text")
            .attr("class", "linktext")
            .attr("y", (d: any) => y(d.y) as number)
            .attr("x", (d: any) => x(d.x) as number)
            .text((d: any) => d.nodeName)
            .style("opacity", 0);
        },
        (exit) => {
          return exit;
        },
        (update) => {
          return update;
        }
      )
      .call((select) => {
        this.addTextProperties(select, newElementInFocus, nodeExtremas);
      })
      .transition("move_labels")
      .duration(500)
      .attr("y", (d: any) => y(d.y) as number)
      .attr("x", (d: any) => x(d.x) as number)
      .text((d: any) => d.nodeName)
      .style("opacity", 1);

    stext
      .exit()
      .transition("fadeout_labels")
      .duration(250)
      .style("opacity", 0)
      .remove();

    let nodeDic: PlottingNodeDic = {};

    transformedLabels.forEach((ut: any) => {
      nodeDic[ut.key] = ut;
    });

    let adjustedArrows = arrows.map((a: Arrow) => {
      return {
        ...a,
        ...computeArrowEndPoints(
          nodeDic[a.from],
          nodeDic[a.to],
          x,
          y,
          nodeExtremas
        ),
      };
    });

    const underlines = this.svg
      .selectAll(".underlines")
      .data(adjustedArrows, function (d: any) {
        return d.from + " - " + d.to;
      });
    underlines
      .join((enter) => {
        return enter
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
          })
          .style("opacity", 0);
      })
      .transition("lines_move")
      .duration(500)
      .attr("x1", (d: any) => d.x1)
      .attr("y1", (d: any) => d.y1)
      .attr("x2", (d: any) => d.x2)
      .attr("y2", (d: any) => d.y2)
      .transition()
      .duration(250)
      .style("opacity", 1);

    const overlines = this.svg
      .selectAll(".overlines")
      .data(adjustedArrows, function (d: any) {
        return d.from + " - " + d.to;
      });

    overlines
      .join((enter) => {
        return enter
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
          .call((select) => {
            this.addFunctionalityToOverLines(select);
          });
      })
      .transition("overlines_move")
      .duration(500)
      .attr("x1", (d: any) => d.x1)
      .attr("y1", (d: any) => d.y1)
      .attr("x2", (d: any) => d.x2)
      .attr("y2", (d: any) => d.y2);

    overlines.exit().remove();
  }
}

function insertColor(
  selection: d3.Selection<any, any, any, any>,
  xDivisions: XDivision[]
) {
  const nonZeroCats = xDivisions.filter((v: XDivision) => v.width > 0).map(v=>  v.cat);
  selection.each(function (d: any) {
    let i = nonZeroCats.indexOf(d.cat);
    if(i===-1){
      d.color=ALTERNATING_COLORS[1]
    }
    else{
      d.color = ALTERNATING_COLORS[i%2];
    }
    
  });
}

function insertBB(selection: d3.Selection<any, any, any, any>) {
  selection.each(function (d: any) {
    d.bbox = this.getBBox();
  });
}

function getMax(dataset: TransformedLabel[], coordinate: string): number {
  let maxval: number | undefined;
  if (coordinate === "x") {
    maxval = d3.max(dataset, (d: TransformedLabel) => d.x);
  } else if (coordinate === "y") {
    maxval = d3.max(dataset, (d: TransformedLabel) => d.y);
  } else {
    maxval = 1.0;
  }

  if (maxval === undefined) {
    maxval = 1.0;
  }
  return maxval;
}

function shiftTarget(
  node: PlottingNodeDicValue,
  scale: d3.ScaleLinear<number, number, never>
): PlottingNodeDicValue {
  if (node.cat === NodeType.INPUT) {
    return {
      ...node,
      x: node.x + scale.invert(node.bbox.width) - scale.invert(0),
    };
  } else if (node.cat === NodeType.CAUSE) {
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
  yscale: d3.ScaleLinear<number, number, never>,
  nodes: NodeExtremas
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
  if (fromNode.cat === nodes.min) {
    w1 = h1;
    xAdd1 = wOrg1;
  }
  //Rightbox
  let h2 = toNode.bbox.height / 2;
  let w2 = toNode.bbox.width / 2;
  let wOrg2 = toNode.bbox.width / 2;
  let R2 = h2 / (h2 + w2);
  let xAdd2 = 0;
  if (toNode.cat === nodes.max) {
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
