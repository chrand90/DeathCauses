import * as d3 from "d3";
import { ScaleBand, ScaleLinear } from "d3";
import d3Tip from "d3-tip";
import Descriptions from "../models/Descriptions";
import {
  CauseGrouping,
  CauseToParentMapping,
  ParentToCausesMapping
} from "../models/RelationLinks";
import "./BarChart.css";
import make_squares, { SquareSection } from "./ComputationEngine";
import { ALTERNATING_COLORS, LINK_COLOR } from "./Helpers";
import { DataRow, DataSet } from "./PlottingData";

const MARGIN = { TOP: 2, BOTTOM: 2, LEFT: 10, RIGHT: 10 };
const WIDTH = 1200;
let DESIGN = "LONG";
const BARHEIGHT = 50;
const XBARHEIGHT = 80;
const PADDING = 0.3;
const TEXT_COLUMN_SIZE = 100;
const TEXT_GRAY = "#666666";
const NOT_CLICKABLE_GRAY = "#b8b8b8";
const SELECTED_DISEASE_COLOR = "#a3e3f0";
const WIDTH_PROPORTION= 0.95
const STIP_MAX_WIDTH=150;
const CLICKTIP_MAX_WIDTH=250;
const CAUSE_HEADER_LENGTH=35;


function getDivWidth(div: HTMLElement | null): number {
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

interface DesignConstants {
  barheight: number;
  totalheight: number;
  totalheightWithXBar: number;
  startXScale: number;
  yListStart: number;
  yListInnerPadding: number;
  yListOuterPadding: number;
  yListAlign: number;
  middleOfChart: number;
  width: number;
  textTranslation: string;
  collectButtonTranslation: string;
  textAnchor: "start" | "middle" | "end";
  expandButtonTranslation: string;
  collapseButtonsWidth: number;
  collapseButtonsHeight: number;
  airToTheRight: number;
}

const buttonSize = 18;
const sameConstants = {
  collectButtonTranslation:
    "translate(" + 10 + "," + (-BARHEIGHT / 16 - buttonSize) + ")",
  expandButtonTranslation:
    "translate(" + 10 + "," + (-BARHEIGHT / 16 - buttonSize) + ")",
  collapseButtonsWidth: buttonSize,
  collapseButtonsHeight: buttonSize,
  airToTheRight: 80,
};

function longDesignConstants(
  n: number,
  width: number,
  simplifiedVersion: boolean
): DesignConstants {
  const heightScale = simplifiedVersion ? 1.25 : 1;
  const xbarheightScale = simplifiedVersion ? 0 : 1;
  return {
    ...sameConstants,
    barheight: 1.5 * BARHEIGHT * heightScale,
    totalheight: n * 1.5 * BARHEIGHT * heightScale,
    totalheightWithXBar:
      (n * 1.5 * BARHEIGHT * heightScale + XBARHEIGHT * xbarheightScale) * (simplifiedVersion ? 1 : 1),
    startXScale: 10,
    yListStart: XBARHEIGHT * xbarheightScale,
    yListInnerPadding: 0.48 * (simplifiedVersion ? 0.3 : 1),
    yListOuterPadding: 0.24 * (simplifiedVersion ? 0.3 : 1),
    yListAlign: 0.8,
    middleOfChart: width / 2,
    width: width,
    textTranslation: "translate(" + 10 + "," + -BARHEIGHT / 8 + ")",
    textAnchor: "start",
    airToTheRight: simplifiedVersion ? 1 : 80,
  };
}

function wideDesignConstants(n: number, width: number): DesignConstants {
  return {
    ...sameConstants,
    barheight: BARHEIGHT,
    totalheight: n * BARHEIGHT,
    totalheightWithXBar: n * BARHEIGHT + XBARHEIGHT,
    startXScale: TEXT_COLUMN_SIZE,
    yListStart: XBARHEIGHT,
    yListInnerPadding: PADDING,
    yListOuterPadding: PADDING / 2,
    yListAlign: 0.5,
    middleOfChart: TEXT_COLUMN_SIZE + (width - TEXT_COLUMN_SIZE) / 2,
    width: width,
    textTranslation: "translate(" + -10 + "," + BARHEIGHT / 2 + ")",
    textAnchor: "end",
  };
}

export default class BarChart {
  element: HTMLElement | null = null;
  width: number = 0;
  svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>; // the exclamation point is necessary because the compiler does not realize that it is initialized in the constructor
  xAxisGroup: any | null;
  stip: any;
  stiparrow: any;
  clicktip: any;
  clicktiparrow: any;
  buttontip: any;
  widthbuttontip: any;
  yBars: ScaleBand<string>;
  xscale: ScaleLinear<number, number>;
  descriptions: Descriptions;
  setDiseaseToWidth: (newDiseaseToWidth: string | null) => void;
  expandCollectedGroup: (causecategory: string) => void;
  collectGroup: (causecategory: string) => void;
  redirectPage: (target: string) => void;
  grouping: CauseGrouping;
  currentMax: number;
  expandables: { [key: string]: string[] };
  collapsables: { [key: string]: string[] };
  chainedTransitionInProgress: boolean;
  transitionsOrdered: number;
  transitionsFinished: number;
  simpleVersion: boolean;
  clickedSquareSection: SquareSection | null = null;
  buttonTipTimeOut: NodeJS.Timeout | undefined = undefined;
  widthButtonTipTimeOut: NodeJS.Timeout | undefined = undefined;

  constructor(
    element: HTMLElement | null,
    database: DataSet,
    descriptions: Descriptions,
    diseaseToWidth: string | null,
    setDiseaseToWidth: (newDiseaseToWidth: string | null) => void,
    collectedGroups: CauseGrouping,
    expandCollectedGroup: (causecategory: string) => void,
    collectGroup: (causecategory: string) => void,
    redirectPage: (target: string) => void,
    collapseAndExpandables: {
      collapsables: { [key: string]: string[] };
      expandables: { [key: string]: string[] };
    },
    simpleVersion: boolean = false
  ) {
    //Initializers
    this.yBars = d3.scaleBand();
    this.xscale = d3.scaleLinear();
    this.descriptions = descriptions;
    this.setDiseaseToWidth = setDiseaseToWidth;
    this.expandCollectedGroup = expandCollectedGroup;
    this.collectGroup = collectGroup;
    this.currentMax = 0;
    this.collapsables = collapseAndExpandables.collapsables;
    this.expandables = collapseAndExpandables.expandables;
    this.chainedTransitionInProgress = false;
    this.transitionsFinished = 0;
    this.transitionsOrdered = 0;
    this.simpleVersion = simpleVersion;
    this.hideAllToolTips = this.hideAllToolTips.bind(this);
    this.redirectPage = redirectPage;
    if (simpleVersion) {
      this.grouping = simplifyGrouping(collectedGroups);
    } else {
      this.grouping = collectedGroups;
    }
    this.buttonTipText = this.buttonTipText.bind(this);

    const vis = this;
    vis.element = element;
    vis.width = getDivWidth(element) * WIDTH_PROPORTION;

    //width="100%" viewBox="0 0 10 1.5" preserveAspectRatio="xMinYMin">
    vis.svg = d3
      .select(element)
      .append("svg")
      .style("display","block")
      .attr("width", vis.width)
      .attr("height", BARHEIGHT + XBARHEIGHT);

    let designConstants =
      DESIGN === "WIDE"
        ? wideDesignConstants(1, vis.width)
        : longDesignConstants(1, vis.width, vis.simpleVersion);
    if (!this.simpleVersion) {
      vis.svg
        .append("text")
        .attr("x", designConstants.middleOfChart)
        .attr("y", XBARHEIGHT / 2)
        .attr("font-size", 20)
        .attr("text-anchor", "middle")
        .text("Probability of dying of cause");
      vis.xAxisGroup = vis.svg
        .append("g")
        .attr("transform", `translate(0,${XBARHEIGHT})`);
    }

    vis.make(database, diseaseToWidth);
  }

  hideAllToolTips() {
    this.widthbuttontip.hide();
    this.buttontip.hide();
    this.clicktip.style("display","none")
    this.clicktiparrow.style("display","none")
    this.stip.style("display","none")
    this.stiparrow.style("display","none")
  }

  clear() {
    d3.select("svg").remove();
    d3.select(".stip").remove();
    d3.select(".stiparrow").remove();
    d3.select(".clicktip").remove();
    d3.select(".clicktiparrow").remove();
  }

  async waitForTransitionsToBeFree(
    durationIfNoWait: number,
    threshold: number = 1.5
  ) {
    return new Promise<number>((resolve) => {
      const ticket = this.transitionsOrdered;
      let counter = 0;
      const checkerFunction = () => {
        if (ticket - this.transitionsFinished < threshold) {
          resolve(durationIfNoWait / (counter / 5 + 1));
        } else {
          counter += 1;
          setTimeout(checkerFunction, 100);
        }
      };
      checkerFunction();
    });
  }

  recalibrate_ybars(sort_data: DataSet, designConstants: DesignConstants) {
    this.yBars = d3
      .scaleBand()
      .domain(sort_data.map((d: any) => d.name))
      .range([designConstants.yListStart, designConstants.totalheightWithXBar])
      .paddingInner(designConstants.yListInnerPadding)
      .paddingOuter(designConstants.yListOuterPadding)
      .align(designConstants.yListAlign);
  }

  makeButtons(
    dtextGroups: d3.Selection<any, any, any, any>,
    designConstants: DesignConstants
  ) {
    const vis = this;
    dtextGroups
      .append("text")
      .attr("class", "dtext")
      .attr("y", 0)
      .attr("x", 0)
      .text(function (d: any) {
        return vis.descriptions.getDescription(d.name, CAUSE_HEADER_LENGTH);
      })
      .style("text-anchor", designConstants.textAnchor)
      .attr("transform", designConstants.textTranslation)
      .call(insertBB);

    const collectButtons = dtextGroups
      .append("g")
      .attr("class", "dtextGroupCollect")
      .attr("transform", (d: any) => {
        return (
          "translate(" +
          (d.bbox.width + designConstants.collapseButtonsWidth * 2.25) +
          ", " +
          -3 +
          ")"
        );
      })
      .style("cursor", function (d) {
        if (d.name in vis.collapsables) {
          return "pointer";
        }
        return "";
      })
      .each(function (d: any) {
        d.collapsable = (d.name in vis.collapsables);
      });

    collectButtons
      .append("text")
      .attr("class", "ctext")
      .text("-")
      .style("font-weight", 800)
      .style("font-size", "32px")
      .style("fill", function (d) {
        if (d.collapsable) {
          return TEXT_GRAY;
        } else {
          return NOT_CLICKABLE_GRAY;
        }
      })
      .on("mouseenter", function (e: Event, d: any) {
        if (d.collapsable) {
          d3.select(this).style("fill", LINK_COLOR);
          vis.buttonTipTimeOut = setTimeout(() =>
            vis.buttontip.show({ d: d.name, buttonType: "collapse" }, this)
            , 300);
          vis.buttontip.offset([5, 0])
        }
      })
      .on("mouseleave", function (e: Event, d: any) {
        if (d.collapsable) {
          d3.select(this).style("fill", TEXT_GRAY);
          if (vis.buttonTipTimeOut) {
            clearTimeout(vis.buttonTipTimeOut)
          }
          vis.buttontip.hide();
        }
      })
      .on("click", (e: Event, d: any) => {
        e.stopPropagation();
        if (d.collapsable) {
          this.collectGroup(d.name);
        }
      });

    const expandButtons = dtextGroups
      .append("g")
      .attr("class", "dtextGroupCollect")
      .attr("transform", (d: any) => {
        return (
          "translate(" +
          (d.bbox.width + designConstants.collapseButtonsWidth * 1) +
          ", " +
          -3 +
          ")"
        );
      })
      .style("cursor", function (d) {
        if (d.name in vis.expandables) {
          return "pointer";
        }
        return "";
      })
      .each(function (d: any) {
        d.expandable = d.name in vis.expandables;
      });

    expandButtons
      .append("text")
      .attr("class", "ctext")
      .text("+")
      .style("font-weight", 800)
      .style("font-size", "32px")
      .style("fill", function (d) {
        if (d.expandable) {
          return TEXT_GRAY;
        } else {
          return NOT_CLICKABLE_GRAY;
        }
      })
      .on("mouseenter", function (e: Event, d: DataRow) {
        if ((d as any).expandable) {
          vis.buttonTipTimeOut = setTimeout(() =>
            vis.buttontip.show({ d: d.name, buttonType: "expand" }, this)
            , 300);
          vis.buttontip.offset([5, 0])
          d3.select(this).style("fill", LINK_COLOR);
        }
      })
      .on("mouseleave", function (e: Event, d: DataRow) {
        if ((d as any).expandable) {
          if (vis.buttonTipTimeOut) {
            clearTimeout(vis.buttonTipTimeOut)
          }
          vis.buttontip.hide()
          d3.select(this).style("fill", TEXT_GRAY);
        }
      })
      .on("click", (e: Event, d: DataRow) => {
        e.stopPropagation()
        if ((d as any).expandable) {
          this.expandCollectedGroup(d.name);
        }
      });
  }

  disableExpandCollectButtons(subjects: string[]) {
    this.svg
      .selectAll(".ctext")
      .filter(function (d: any) {
        return subjects.includes(d.name);
      })
      .on("click", null);
  }

  insertPercentageText(dataSortedTotal: DataRow[]) {
    this.svg
      .selectAll(".ptext")
      .data(dataSortedTotal, function (d: any) {
        return d.name;
      })
      .enter()
      .append("text")
      .attr("class", "ptext")
      .attr("y", (d: any) => this.yBars(d.name) as number)
      .attr("x", (d: any) =>
        this.xscale(Math.min(this.currentMax, d.totalProb))
      )
      .text(function (d: any) {
        return (d.totalProb * 100).toPrecision(3) + "%";
      })
      .style("text-anchor", "start")
      .attr("transform", "translate(" + 5 + "," + BARHEIGHT / 2 + ")")
      .style("fill", NOT_CLICKABLE_GRAY);
  }

  make(dataset: DataSet, diseaseToWidth: string | null) {
    const vis = this;

    const {
      dataSortedTotal,
      dataSquares,
      dataIds,
    } = this.computeRankAndSquares(dataset, diseaseToWidth);

    const n = dataSortedTotal.length;
    let designConstants =
      DESIGN === "WIDE"
        ? wideDesignConstants(n, vis.width)
        : longDesignConstants(n, vis.width, vis.simpleVersion);
    vis.svg.attr("height", designConstants.totalheightWithXBar);

    //Setting the mapping disease -> y value
    this.recalibrate_ybars(dataSortedTotal, designConstants);

    //Setting X-axis
    this.currentMax = getMaxX(dataSquares);
    const xAxisCall = this.createXAxisCall(this.currentMax, designConstants);
    if (!this.simpleVersion) {
      vis.xAxisGroup.call(xAxisCall);

      this.instantUpdateOfRects(
        dataSortedTotal,
        designConstants,
        diseaseToWidth
      );

      const dtextGroups = vis.svg
        .selectAll("dtextGroups")
        .data(dataSortedTotal, function (d: any) {
          return d.name;
        })
        .enter()
        .append("g")
        .attr("class", "dtextGroups")
        .attr("transform", (d: any) => {
          return (
            "translate(" +
            this.xscale(0) +
            "," +
            (this.yBars(d.name) as number).toString() +
            ")"
          );
        });
      this.makeButtons(dtextGroups, designConstants);

      this.insertPercentageText(dataSortedTotal);

      this.makeFitScreenButtons(
        dataIds,
        dataSortedTotal,
        diseaseToWidth,
        designConstants
      );
    }


    //The causes themselves are plotted by this.
    const gs = vis.svg
      .selectAll(".causebar")
      .data(dataSquares, function (d: any) {
        return d.name + "." + d.cause;
      });

    d3.select(".stip").remove(); //removes any old visible tooltips that was perhaps not removed by a mouseout event (for example because the mouse teleported instantanously by entering/exiting a full-screen).
    d3.select(".stiparrow").remove(); //removes any old visible tooltips that was perhaps not removed by a mouseout event (for example because the mouse teleported instantanously by entering/exiting a full-screen).
    d3.select(".clicktip").remove(); //removes any old visible tooltips that was perhaps not removed by a mouseout event (for example because the mouse teleported instantanously by entering/exiting a full-screen).
    d3.select(".clicktiparrow").remove(); //removes any old visible tooltips that was perhaps not removed by a mouseout event (for example because the mouse teleported instantanously by entering/exiting a full-screen).
    d3.selectAll(".buttontip").remove(); //removes any old visible tooltips that was perhaps not removed by a mouseout event (for example because the mouse teleported instantanously by entering/exiting a full-screen).


    vis.stip= d3
      .select("#barchartcontainer")
      .append("div")
      .attr("class", "stip")
      .style("display", "none");
    vis.stiparrow= d3
      .select("#barchartcontainer")
      .append("div")
      .attr("class", "stiparrow")
      .style("display", "none");
    vis.clicktip= d3
      .select("#barchartcontainer")
      .append("div")
      .attr("class", "clicktip")
      .style("display", "none")
    vis.clicktiparrow= d3
      .select("#barchartcontainer")
      .append("div")
      .attr("class", "clicktiparrow")
      .style("display", "none");
    if (vis.width < 501) {
      vis.buttontip = d3Tip()
        .attr("class", "buttontip small")
        .html(({ d, buttonType }: { d: string, buttonType: "expand" | "collapse" | "width" }) => {
          return this.buttonTipText(d, buttonType);
        })
        .direction("n")
        .offset([-2, 0])
      vis.widthbuttontip = d3Tip()
        .attr("class", "buttontip small")
        .html(({ d, buttonType }: { d: string, buttonType: "expand" | "collapse" | "width" }) => {
          return this.buttonTipText(d, buttonType);
        })
        .direction("n")
        .offset([-2, 0])
    }
    else {
      vis.buttontip = d3Tip()
        .attr("class", "buttontip")
        .attr("id","buttontip")
        .html(({ d, buttonType }: { d: string, buttonType: "expand" | "collapse" | "width" }) => {
          return this.buttonTipText(d, buttonType);
        })
        .direction("n")
        .offset([-2, 0])
      vis.widthbuttontip = d3Tip()
        .attr("class", "buttontip")
        .attr("id","widthbuttontip")
        .html(({ d, buttonType }: { d: string, buttonType: "expand" | "collapse" | "width" }) => {
          return this.buttonTipText(d, buttonType);
        })
        .direction("n")
        .offset([-2, 0])
    }

    vis.svg.call(vis.buttontip);
    vis.svg.call(vis.widthbuttontip);


    vis.svg.on("click", (e: Event) => {
      console.log("closing on outside click")
      e.stopPropagation();
      vis.clickedSquareSection = null
      vis.clicktip.style("display","none");
      vis.clicktiparrow.style("display","none");
    });

    const addedBars = gs.enter().append("rect").attr("class", "causebar");

    this.addAttributesToCauseBars(addedBars);
  }

  makeFitScreenButtons(
    dataIds: number[],
    dataSortedTotal: DataRow[],
    diseaseToWidth: string | null,
    designConstants: DesignConstants
  ) {
    const vis = this;
    const rectButtons = vis.svg
      .selectAll("fitscreenButtons")
      .data(dataIds, function (i: any) {
        return i;
      })
      .enter()
      .append("g")
      .attr("class", "fitscreenButtons")
      .attr("transform", (i: any) => {
        return (
          "translate(" +
          (designConstants.width - 30).toString() +
          "," +
          (this.yBars(dataSortedTotal[i].name) as number).toString() +
          ")"
        );
      })
      .style("cursor", "pointer")
      .on("click", (e: Event, i: number) => {
        e.stopPropagation();
        const clickedDisease = dataSortedTotal[i].name;
        if (clickedDisease === diseaseToWidth) {
          this.setDiseaseToWidth(null);
        } else {
          this.setDiseaseToWidth(clickedDisease);
        }
      });


    rectButtons
      .append("text")
      .style("font-size", "20px")
      .style("font-weight", "800")
      .attr("x", (d: any) => 0)
      .attr("y", (d: any) => BARHEIGHT / 2)
      .attr("text-anchor", "central")
      .style("fill", TEXT_GRAY)
      .text(function (d: any, index: number) {
        return "\u27F7";
      })
      .on("mouseenter", function (d) {
        vis.widthButtonTipTimeOut = setTimeout(() =>
          vis.widthbuttontip.show({ d: d.name, buttonType: "width" }, this),
          500
        );
        d3.select(this).style("fill", LINK_COLOR);
      })
      .on("mouseleave", function (d) {
        if (vis.widthButtonTipTimeOut) {
          clearTimeout(vis.widthButtonTipTimeOut)
          vis.widthButtonTipTimeOut = undefined;
          vis.widthbuttontip.hide({ d: d.name, buttonType: "width" }, this)
        }
        else {
          vis.widthbuttontip.hide({ d: d.name, buttonType: "width" }, this)
        }
        d3.select(this).style("fill", TEXT_GRAY);
      });
  }

  buttonTipText(d: string, buttonType: "expand" | "collapse" | "width") {
    if (buttonType === "expand") {
      if (d in this.expandables) {
        return "Expand into " + this.expandables[d].length.toString() + " subcategories";
      }
    }
    if (buttonType === "collapse") {
      if (d in this.collapsables) {
        return "Merge all " + this.descriptions.getDescription(this.collapsables[d][0], 20)
      }
    }
    if (buttonType === "width") {
      return "adjust to width"
    }
    throw Error("The text for element " + d + " - " + buttonType + " was not found.")
  }

  addAttributesToCauseBars(
    causeBars: d3.Selection<any, any, any, any>,
    yReMapper: (node: string) => string = (x) => x
  ) {
    const vis = this;
    causeBars
      .attr("y", (d) => this.yBars(yReMapper(d.name)) as number)
      .attr("x", (d) => this.xscale(d.x0))
      .attr("height", this.yBars.bandwidth)
      .attr("width", (d) => Math.max(0, this.xscale(d.x) - this.xscale(d.x0)))
      .attr("fill", (d) => this.descriptions.getColor(d.cause))
      .attr("stroke", "#2378ae")
      .style("cursor", "pointer")
      .on("mouseenter", function (e: Event, d: SquareSection) {
        d3.select(".stip").style("background-color", vis.descriptions.getColor(d.cause));
        const bbox=this.getBBox();

        let middlePoint=bbox.x+bbox.width/2
        const overflowLeft= middlePoint-STIP_MAX_WIDTH/2;
        const overflowRight= vis.width-(middlePoint+STIP_MAX_WIDTH/2);
        if(overflowLeft<0){
          middlePoint=middlePoint-overflowLeft
        }
        if(overflowRight<0){
          middlePoint+=overflowRight
        }
        vis.stip
          .style("display", "block")
          .html(d.comparison ? d.comparison : d.cause)
          .style("left", (middlePoint).toString() + "px")
          .style("top", (bbox.y+bbox.height+12).toString() + "px");
        vis.stiparrow
          .style("display", "block")
          .html("\u25B2")
          .style("left", (bbox.x+bbox.width/2-6).toString() + "px")
          .style("top", (bbox.y+bbox.height-4).toString() + "px");
        d3.select(this)
          .raise()
          .style("stroke-width", 3)
          .style("stroke", "#000000");
      })
      .on("mouseleave", function (e: Event, d: SquareSection) {
        vis.stip.style("display","none")
        vis.stiparrow.style("display","none")
        d3.select(this).style("stroke-width", 1).style("stroke", "#2378ae");
      })
      .on("resize", function (e: Event, d: SquareSection) {
        vis.stip.style("display","none")
        vis.stiparrow.style("display","none")
        d3.select(this).style("stroke-width", 1).style("stroke", "#2378ae");
      })
      .on("click", function (e: Event, d: SquareSection) { 
        d3.select(".clicktip").style("background-color", vis.descriptions.getColor(d.cause));
        const bbox=this.getBBox();
        let middlePoint=bbox.x+bbox.width/2
        const overflowLeft= middlePoint-CLICKTIP_MAX_WIDTH/2;
        const overflowRight= vis.width-(middlePoint+CLICKTIP_MAX_WIDTH/2);
        if(overflowLeft<0){
          middlePoint=middlePoint-overflowLeft
        }
        if(overflowRight<0){
          middlePoint+=overflowRight
        }
        vis.clicktip
          .style("display", "block")
          .html(`${d.longComparison ? d.longComparison.textWithButtons : d.cause}`)
          .style("left", (middlePoint).toString() + "px")
          .style("top", (bbox.y+bbox.height+12).toString() + "px")
        if(d.longComparison){
          vis.addButtonActions(d.longComparison.buttonCodes)
        }
        vis.clicktiparrow
          .style("display", "block")
          .html("\u25B2")
          .style("left", (bbox.x+bbox.width/2-6).toString() + "px")
          .style("top", (bbox.y+bbox.height-4).toString() + "px")
        vis.clickedSquareSection = d;
        vis.stip.style("display","none")
        vis.stiparrow.style("display","none")
        e.stopPropagation();
      });
  }

  addButtonActions(buttonCodes: string[]){
    buttonCodes.forEach((nodeName, index) => {
      d3.select("#but"+(index+1).toString())
        .on("click", (e)=> { 
          this.redirectPage(nodeName)  
        });
    })
  }

  createXAxisCall(newMax: number, designConstants: DesignConstants) {
    const x = d3
      .scaleLinear()
      .domain([0, newMax])
      .range([
        designConstants.startXScale, 
        designConstants.width-designConstants.airToTheRight
        ]);
    this.xscale = x;
    return d3.axisTop(x).ticks(4);
  }

  instantUpdateOfRects(
    totalProbs: DataRow[],
    designConstants: DesignConstants,
    diseaseToWidth: string | null
  ) {
    const vis = this;
    const yRects = d3
      .scaleBand()
      .domain(totalProbs.map((d: any) => d.name))
      .align(designConstants.yListAlign)
      .range([designConstants.yListStart, designConstants.totalheightWithXBar]);

    const diseases = vis.svg
      .selectAll(".drect")
      .data(totalProbs, function (d: any) {
        return d.name;
      });

    diseases
      .join("rect")
      .attr("class", "drect")
      .attr("y", (d: any, i: number) => yRects(d.name) as number)
      .attr("x", this.xscale(0))
      .attr("width", designConstants.width)
      .attr("height", designConstants.barheight)
      .attr("fill", function (d: any, i: number) {
        if (diseaseToWidth && d.name === diseaseToWidth) {
          return SELECTED_DISEASE_COLOR;
        }
        return ALTERNATING_COLORS[i % 2];
      })
      .style("opacity", 0.5)
      .lower();
  }

  collapseCats(
    dataset: DataSet,
    diseaseToWidth: string | null,
    oldCollectedGroups: CauseGrouping,
    removed: string[],
    added: string[],
    durationPerTransition: number = 1000
  ) {
    this.disableExpandCollectButtons(removed);
    const { allSquares: dataSquares, totalProbs } = make_squares(
      dataset,
      diseaseToWidth,
      this.grouping,
      this.descriptions,
    );
    const notToBeMerged = getSubCollectGroup(
      oldCollectedGroups,
      removed,
      added[0]
    );
    const { allSquares: noMergeSquares, totalProbs: notUsed } = make_squares(
      dataset,
      diseaseToWidth,
      this.grouping,
      this.descriptions,
      notToBeMerged
    );
    const sortedTotalsWithRemovedCats = insertRemovedCatsInCopy(
      totalProbs,
      removed,
      added[0],
      this.yBars
    );
    const sortedTotalsFinal = copyOfSortedDataset(totalProbs, "totalProb");

    const vis = this;
    let designConstants = this.setHeightAndGetDesignConstants(
      sortedTotalsWithRemovedCats
    );

    this.recalibrate_ybars(sortedTotalsWithRemovedCats, designConstants);

    this.instantUpdateOfRects(
      sortedTotalsWithRemovedCats,
      designConstants,
      null
    );
    this.reArrangeBars(
      sortedTotalsWithRemovedCats,
      durationPerTransition,
      designConstants,
      diseaseToWidth,
      () => {
        this.removePercentageText();
        const newMaxX = this.transitionXAxis(
          dataSquares,
          designConstants,
          durationPerTransition
        );
        const gsWitExpandedData = vis.svg
          .selectAll(".causebar")
          .data(noMergeSquares, function (d: any) {
            return d.name + "." + d.cause;
          });
        gsWitExpandedData
          .transition("bars_x_change")
          .duration(durationPerTransition)
          .attr("x", (d: any) => this.xscale(d.x0))
          .attr("width", (d: any) =>
            Math.max(0, this.xscale(d.x) - this.xscale(d.x0))
          )
          .end()
          .then(() => {
            gsWitExpandedData
              .transition("bars_y_move")
              .duration(durationPerTransition)
              .attr("y", (d: any) => {
                let mapTo = removed.includes(d.name) ? added[0] : d.name;
                return this.yBars(mapTo) as number;
              })
              .end()
              .then(() => {
                this.currentMax = newMaxX;
                let newN = sortedTotalsFinal.length;
                designConstants =
                  DESIGN === "WIDE"
                    ? wideDesignConstants(newN, vis.width)
                    : longDesignConstants(newN, vis.width, vis.simpleVersion);
                this.recalibrate_ybars(sortedTotalsFinal, designConstants);
                const gsWithFinalData = vis.svg
                  .selectAll(".causebar")
                  .data(dataSquares, function (d: any) {
                    return d.name + "." + d.cause;
                  });
                gsWithFinalData.exit().remove();
                this.hideAllToolTips();

                const enteredBars = gsWithFinalData
                  .enter()
                  .append("rect")
                  .attr("class", "causebar");
                this.addAttributesToCauseBars(enteredBars);
                this.reArrangeBars(
                  sortedTotalsFinal,
                  durationPerTransition,
                  designConstants,
                  diseaseToWidth,
                  () => {
                    vis.svg.attr("height", designConstants.totalheightWithXBar);
                    this.instantUpdateOfRects(
                      sortedTotalsFinal,
                      designConstants,
                      diseaseToWidth
                    );
                    this.insertPercentageText(sortedTotalsFinal);
                    this.reMapFitScreenButtons(
                      sortedTotalsFinal,
                      sortedTotalsFinal.map((d, i) => i),
                      diseaseToWidth
                    );
                    this.transitionsFinished += 1;
                  }
                );
              });
          });
      }
    );
  }

  reArrangeBars(
    dataSortedTotal: DataRow[],
    durationPerTransition: number,
    designConstants: DesignConstants,
    diseaseToWidth: string | null,
    callback: () => void = () => { },
    delayBeforeTransition: number = 0
  ) {
    const vis = this;
    const gs = vis.svg.selectAll<SVGRectElement, SquareSection[]>(".causebar");

    gs.transition("bars_y_move")
      .duration(durationPerTransition)
      .delay(delayBeforeTransition)
      .attr("y", (d: any) => this.yBars(d.name) as number)
      .style("opacity", (d: any) => {
        if (diseaseToWidth) {
          const heightOfDiseaseToWidth = this.yBars(diseaseToWidth) as number;
          const heightOfThisGroup = this.yBars(d.name) as number;
          if (heightOfDiseaseToWidth > heightOfThisGroup + 1e-8) {
            return 0.2;
          } else {
            return 1;
          }
        } else {
          return 1;
        }
      });

    const dtexts = vis.svg
      .selectAll<any, any>(".dtextGroups")
      .data(dataSortedTotal, function (d: any) {
        return d.name;
      });

    vis.svg
      .selectAll<any, any>(".ptext")
      .transition("percentage_y_change")
      .duration(durationPerTransition)
      .delay(delayBeforeTransition)
      .attr("y", (d: any) => this.yBars(d.name) as number);

    dtexts.exit().remove();
    this.hideAllToolTips();

    if (dtexts.enter().size() > 0) {
      dtexts
        .transition("labels_move")
        .duration(durationPerTransition)
        .delay(delayBeforeTransition)
        .attr("transform", (d) => {
          return "translate(" + 10 + ", " + this.yBars(d.name) + ")";
        })
        .end()
        .then(() => {
          const addedDtextGroups = dtexts
            .enter()
            .append("g")
            .attr("class", "dtextGroups")
            .attr("transform", (d: any) => {
              return (
                "translate(" +
                this.xscale(0) +
                "," +
                (this.yBars(d.name) as number).toString() +
                ")"
              );
            });
          this.makeButtons(addedDtextGroups, designConstants);
          callback();
        });
    } else {
      dtexts
        .transition("labels_move")
        .duration(durationPerTransition)
        .delay(delayBeforeTransition)
        .attr("transform", (d) => {
          return "translate(" + 10 + ", " + this.yBars(d.name) + ")";
        });
      setTimeout(callback, durationPerTransition + delayBeforeTransition);
    }
  }

  setHeightAndGetDesignConstants(sortedTotals: DataRow[]) {
    const n = sortedTotals.length;
    let designConstants =
      DESIGN === "WIDE"
        ? wideDesignConstants(n, this.width)
        : longDesignConstants(n, this.width, this.simpleVersion);
    this.svg.attr("height", designConstants.totalheightWithXBar);
    return designConstants;
  }

  removePercentageText() {
    this.svg.selectAll<any, any>(".ptext").remove();
  }

  transitionXAxis(
    dataSquares: SquareSection[],
    designConstants: DesignConstants,
    durationPerTransition: number
  ) {
    const newMaxX = getMaxX(dataSquares);
    const xAxisCall = this.createXAxisCall(newMaxX, designConstants);
    if (!this.simpleVersion) {
      this.xAxisGroup
        .transition("x_axis_change")
        .duration(durationPerTransition)
        .call(xAxisCall)
    }
    return newMaxX;
  }

  expandCats(
    dataset: DataSet,
    diseaseToWidth: string | null,
    oldCollectedGroups: CauseGrouping,
    removed: string[],
    added: string[],
    durationPerTransition: number = 1000
  ) {
    this.chainedTransitionInProgress = true;
    this.disableExpandCollectButtons(removed);
    const { allSquares: dataSquares, totalProbs } = make_squares(
      dataset,
      diseaseToWidth,
      this.grouping,
      this.descriptions
    );
    const notToBeMerged = getSubCollectGroup(this.grouping, added, removed[0]);
    const {
      allSquares: noMergeSquares,
      totalProbs: noMergeTotals,
    } = make_squares(
      dataset,
      diseaseToWidth,
      oldCollectedGroups,
      this.descriptions,
      notToBeMerged
    );
    const sortedTotalsFinal = copyOfSortedDataset(totalProbs, "totalProb");
    let tmpComparator = d3
      .scaleBand()
      .domain(sortedTotalsFinal.map((d: any) => d.name))
      .range([0, 1]);
    const sortedTotalsWithRemovedCat = insertRemovedCatsInCopy(
      noMergeTotals,
      added,
      removed[0],
      tmpComparator
    );
    const yReMapper = (nodeName: string) => {
      if (added.includes(nodeName)) {
        return removed[0];
      }
      return nodeName;
    };

    const vis = this;
    let designConstants = this.setHeightAndGetDesignConstants(
      sortedTotalsWithRemovedCat
    );

    this.recalibrate_ybars(sortedTotalsWithRemovedCat, designConstants);

    this.instantUpdateOfRects(
      sortedTotalsWithRemovedCat,
      designConstants,
      null
    );

    this.reArrangeBars(
      sortedTotalsWithRemovedCat,
      durationPerTransition,
      designConstants,
      diseaseToWidth,
      () => {
        this.removePercentageText();

        const gsWithSplitData = vis.svg
          .selectAll(".causebar")
          .data(noMergeSquares, function (d: any) {
            return d.name + "." + d.cause;
          });
        gsWithSplitData.exit().remove();
        this.hideAllToolTips();

        const enteredBars = gsWithSplitData
          .enter()
          .append("rect")
          .attr("class", "causebar");
        vis.addAttributesToCauseBars(enteredBars, yReMapper);

        const finalCauseBars = vis.svg
          .selectAll<SVGRectElement, SquareSection[]>(".causebar")
          .data(dataSquares, function (d: any) {
            return d.name + "." + d.cause;
          });

        finalCauseBars
          .transition("bars_y_move2")
          .duration(durationPerTransition)
          .attr("y", (d: any) => vis.yBars(d.name) as number)
          .end()
          .then(() => {
            this.transitionXAxis(
              dataSquares,
              designConstants,
              durationPerTransition
            );
            finalCauseBars
              .transition("bars_x_move")
              .duration(durationPerTransition)
              .attr("x", (d: any) => vis.xscale(d.x0))
              .attr("width", (d: any) =>
                Math.max(0, vis.xscale(d.x) - vis.xscale(d.x0))
              )
              .end()
              .then(() => {
                designConstants = this.setHeightAndGetDesignConstants(
                  sortedTotalsFinal
                );
                vis.recalibrate_ybars(sortedTotalsFinal, designConstants);
                vis.reArrangeBars(
                  sortedTotalsFinal,
                  durationPerTransition,
                  designConstants,
                  diseaseToWidth,
                  () => {
                    vis.insertPercentageText(sortedTotalsFinal);
                    vis.instantUpdateOfRects(
                      sortedTotalsFinal,
                      designConstants,
                      diseaseToWidth
                    );
                    vis.reMapFitScreenButtons(
                      sortedTotalsFinal,
                      sortedTotalsFinal.map((d, i) => i),
                      diseaseToWidth
                    );
                    vis.transitionsFinished += 1;
                  }
                );
              });
          });
      }
    );
  }

  async changeCats(
    dataset: DataSet,
    diseaseToWidth: string | null,
    newCollectedGroups: CauseGrouping,
    durationIfNoWait: number = 700
  ) {
    this.transitionsOrdered += 1;
    const duration = Math.max(
      await this.waitForTransitionsToBeFree(durationIfNoWait),
      10
    );
    const { removed, added } = getBooleanSet(this.grouping, newCollectedGroups);
    const oldCollectedGroups = this.grouping;
    this.grouping = newCollectedGroups;
    if (removed.length > added.length) {
      this.collapseCats(
        dataset,
        diseaseToWidth,
        oldCollectedGroups,
        removed,
        added,
        duration
      );
    } else {
      this.expandCats(
        dataset,
        diseaseToWidth,
        oldCollectedGroups,
        removed,
        added,
        duration
      );
    }
  }

  computeRankAndSquares(
    data: DataRow[],
    diseaseToWidth: string | null
  ): {
    dataSortedTotal: DataRow[];
    dataSquares: SquareSection[];
    dataIds: number[];
  } {
    const { allSquares: dataSquares, totalProbs } = make_squares(
      data,
      diseaseToWidth,
      this.grouping,
      this.descriptions
    );
    const dataSortedTotal = copyOfSortedDataset(totalProbs, "totalProb");
    const dataIds = dataSortedTotal.map((v: any, index: number) => {
      return index;
    });
    return { dataSortedTotal, dataSquares, dataIds };
  }

  async update(
    dataset: DataSet,
    diseaseToWidth: string | null,
    instantDiseaseToWidthColoring: boolean = false,
    durationPerTransition: number = 500
  ) {
    this.stip.style("display","none")
    this.stiparrow.style("display","none")
    this.clicktip.style("display","none");
    this.clicktiparrow.style("display","none")
    await this.waitForTransitionsToBeFree(0, 0.5);
    const vis = this;

    const {
      dataSortedTotal,
      dataSquares,
      dataIds,
    } = this.computeRankAndSquares(dataset, diseaseToWidth);

    const n = dataSortedTotal.length;
    const designConstants =
      DESIGN === "WIDE"
        ? wideDesignConstants(n, vis.width)
        : longDesignConstants(n, vis.width, vis.simpleVersion);

    //Updating the disease-to-y mapping (this.yBars)
    if (!this.simpleVersion) {
      this.recalibrate_ybars(dataSortedTotal, designConstants);

      this.instantUpdateOfRects(
        dataSortedTotal,
        designConstants,
        instantDiseaseToWidthColoring ? diseaseToWidth : null
      );
    }

    const gs = vis.svg
      .selectAll<SVGRectElement, SquareSection[]>(".causebar")
      .data(dataSquares, function (d: any) {
        return d.name + "." + d.cause;
      });

    this.currentMax = this.transitionXAxis(
      dataSquares,
      designConstants,
      durationPerTransition
    );

    if (!this.simpleVersion) {
      //Updating X-axis

      vis.svg
        .selectAll<any, any>(".ptext")
        .data(dataSortedTotal, function (d: any) {
          return d.name;
        })
        .transition("percentage_x_change_and_move")
        .duration(durationPerTransition)
        .attr(
          "x",
          (d: any) =>
            this.xscale(Math.min(d.totalProb, this.currentMax)) as number
        )
        .text(function (d: any) {
          return (d.totalProb * 100).toPrecision(3) + "%";
        });
    }

    gs.transition("bars_x_change")
      .duration(durationPerTransition)
      .attr("x", (d) => this.xscale(d.x0))
      .attr("width", (d) => Math.max(0, this.xscale(d.x) - this.xscale(d.x0)));
    if (!this.simpleVersion) {
      this.reArrangeBars(
        dataSortedTotal,
        durationPerTransition,
        designConstants,
        diseaseToWidth,
        () => {
          this.reMapFitScreenButtons(dataSortedTotal, dataIds, diseaseToWidth);
          this.instantUpdateOfRects(
            dataSortedTotal,
            designConstants,
            diseaseToWidth
          );
        },
        durationPerTransition
      );
    }
  }

  reMapFitScreenButtons(
    dataSortedTotal: DataRow[],
    dataIds: number[],
    diseaseToWidth: string | null
  ) {
    this.svg
      .selectAll<any, any>(".fitscreenButtons")
      .data(dataIds, function (i: any) {
        return i;
      })
      .on("click", (e: Event, i: number) => {
        e.stopPropagation();
        const clickedDisease = dataSortedTotal[i].name;
        if (clickedDisease === diseaseToWidth) {
          this.setDiseaseToWidth(null);
        } else {
          this.setDiseaseToWidth(clickedDisease);
        }
      });
  }
}

function copyOfSortedDataset(
  dataset: DataSet,
  sorter: "totalProb" | "name" = "totalProb"
): DataSet {
  return dataset.slice().sort(function (a: DataRow, b: DataRow) {
    return d3.descending(a[sorter], b[sorter]);
  });
}

function insertRemovedCatsInCopy(
  dataset: DataSet,
  insertedValues: string[],
  belowValue: string,
  compareInsertedValues: d3.ScaleBand<string>
): DataSet {
  let copy = dataset.slice().sort(function (a: DataRow, b: DataRow) {
    return d3.descending(a["totalProb"], b["totalProb"]);
  });
  let indexOfAdded = -1;
  copy.forEach((d: DataRow, i: number) => {
    if (d.name === belowValue) {
      indexOfAdded = i;
    }
  });
  insertedValues
    .sort(function (a, b) {
      return (
        (compareInsertedValues(b) as number) -
        (compareInsertedValues(a) as number)
      );
    })
    .forEach((insertedValue) => {
      copy.splice(indexOfAdded + 1, 0, {
        name: insertedValue,
        totalProb: -1,
        innerCauses: {},
      });
    });
  return copy;
}

function getMaxX(dataset: SquareSection[]): number {
  let a = d3.max(dataset, (d) => d.x);
  if (a === undefined) {
    a = 1.0;
  }
  return a;
}

function insertBB(selection: d3.Selection<any, any, any, any>) {
  selection.each(function (d: any) {
    d.bbox = this.getBBox();
  });
}

function getBooleanSet(oldGrouping: CauseGrouping, newGrouping: CauseGrouping) {
  const listOne = Object.keys(oldGrouping.parentToCauses);
  const listTwo = Object.keys(newGrouping.parentToCauses);
  let removed: string[] = listOne.filter((d) => !listTwo.includes(d));
  let added: string[] = listTwo.filter((d) => !listOne.includes(d));
  return { removed, added };
}

function getSubCollectGroup(
  groupingWithSubGroups: CauseGrouping,
  subGroupNames: string[],
  bigGroupName: string
): { [key: string]: CauseGrouping } {
  let parentToCauses: ParentToCausesMapping = {};
  let causeToParent: CauseToParentMapping = {};
  subGroupNames.forEach((subGroupName: string) => {
    let children = groupingWithSubGroups.parentToCauses[subGroupName];
    parentToCauses[subGroupName] = children;
    children.forEach((child: string) => {
      causeToParent[child] = subGroupName;
    });
  });
  let res: { [key: string]: CauseGrouping } = {};
  res[bigGroupName] = { parentToCauses, causeToParent };
  return res;
}

function simplifyGrouping(grouping: CauseGrouping): CauseGrouping {
  let parentToCauses: ParentToCausesMapping = {};
  let causeToParent: CauseToParentMapping = {};
  const allCauses = Object.keys(grouping.causeToParent);
  parentToCauses["any cause"] = allCauses;
  allCauses.forEach((d) => {
    causeToParent[d] = "any cause";
  });
  return { parentToCauses, causeToParent };
}
