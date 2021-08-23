import * as d3 from "d3";
import React, { useEffect, useRef, useState } from "react";
import { SurvivalCurveData } from "./Calculations/SurvivalCurveData";
import d3Tip from "d3-tip";
import "./BarPlotWrapper.css";
import { useStore } from "../stores/rootStore";
import { observer } from "mobx-react";

interface BarPlotWrapperProps {
  data: SurvivalCurveData[];
}

const BarPlotWrapper = observer((props: BarPlotWrapperProps) => {
  const store = useStore();
  const chartArea = useRef<any>(null);
  const margin = { top: 50, right: 20, bottom: 50, left: 70 }
  let width = 800
  let height = 600

  const colors = { barFill: "#69b3a2", barHighlight: "#9e1986" };
  const formatter = d3.format(".3p")
  // const [chart, setChart] = useState<BarPlot | null>(null);
  // const { width } = useWindowSize();

  useEffect(() => {
    if (props.data && chartArea.current) {
      updateChart()
    }
  }, [props.data]);

  useEffect(() => {
    createChart();
  }, []);

  useEffect(() => {
    updateWidth()
    createChart()
  }, [store.uIStore.windowWidth])

  const updateWidth = () => {
    const svg = d3.select(chartArea.current).selectAll("*").remove();
    if (chartArea.current !== null) {
      width = getDivWidth()
    }
  }

  const getDivWidth = () => {
    return chartArea.current.offsetWidth * 0.9 - margin.left - margin.right
  }

  const createChart = () => {
    width = getDivWidth()
    const svg = d3
      .select(chartArea.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    setTitleAndLabels();

    var x = d3
      .scaleBand()
      .range([0, width])
      .padding(0.2)
      .domain(props.data.map((element) => element.age.toString()));

    const filtering= width>700 ? 5 : (width>300 ? 10 : 20);
    var xAxis = svg
      .append("g")
      .attr("class", "xAxis")
      .attr("transform", "translate(0," + height + ")")
      .style("font-size", "14px")
      .call(
        d3.axisBottom(x).tickValues(
          x.domain().filter(function (d: any, i: any) {
            return !(+d % filtering);
          })
        )
      );

    var y = d3.scaleLinear().range([height, 0]).domain([0, 1]);
    var yAxis = svg
      .append("g")
      .attr("class", "yXxis")
      .style("font-size", "14px")
      .call(d3.axisLeft(y));

    var u = svg
      .selectAll<SVGRectElement, SurvivalCurveData[]>("rect")
      .data(props.data, function (survivalcurvedat: any) { return survivalcurvedat.age.toPrecision() });

    u.enter()
      .append("rect")
      .attr("x", function (d: SurvivalCurveData, i) {
        return x(d.age.toString()) as number;
      })
      .attr("width", x.bandwidth())
      .attr("height", function (d: any) {
        return height - y(0);
      })
      .attr("y", function (d, i) {
        return y(0);
      })
      .attr("fill", colors.barFill)
      .transition()
      .duration(700)
      .attr("y", function (d, i) {
        return y(d.prob);
      })
      .attr("height", function (d: any) {
        return height - y(d.prob);
      })
      .delay(function (d, i) {
        return i * 5;
      });

    setMouseOverTips();
  };

  const updateChart = function () {
    width = getDivWidth()
    var svg = d3.select("g");

    var u = svg
      .selectAll<SVGRectElement, SurvivalCurveData[]>("rect")
      .data(props.data, function (survivalcurvedat: any) { return survivalcurvedat.age.toPrecision() });

    var x = d3
      .scaleBand()
      .range([0, width])
      .padding(0.2)
      .domain(props.data.map((element) => element.age.toString()));

    var y = d3.scaleLinear().domain([0, 1]).range([height, 0]);

    updateXAxis(x);

    u.join(
      (enter: any) => {
        return enter
          .append("rect")
          .attr("x", function (d: any, i: any) {
            return 0;
          })
          .attr("width", x.bandwidth())
          .attr("height", function (d: any) {
            return height - y(0);
          })
          .attr("y", function (d: any, i: any) {
            return y(0);
          })
          .attr("fill", colors.barFill)
          .transition()
          .selection();
      },
      (update: any) => {
        return update;
      },
      (exit: any) => {
        return exit.transition()
          .duration(600)
          .attr("x", 0)
          .attr("y", function (d: any, i: any) { return y(0); })
          .attr("height", height - y(0))
          .remove()
          .selection();
      }
    )
      .transition()
      .duration(700)
      .attr("x", function (d, i) {
        return x(d.age.toString()) as number;
      })
      .attr("y", function (d, i) {
        return y(d.prob);
      })
      .attr("width", x.bandwidth())
      .attr("height", function (d: any) {
        return height - y(d.prob);
      });
    // .attr("fill", "#9e1986")

    setMouseOverTips();
  };

  const updateXAxis = (x: any) => {
    d3.select<any, any>("g.xAxis").call(
      d3.axisBottom(x).tickValues(
        x.domain().filter(function (d: any, i: any) {
          return !(+d % 5);
        })
      )
    );
  };

  const setMouseOverTips = () => {
    d3.select(".barplottip").remove();

    let tip = d3
      .select(chartArea.current)
      .append("div")
      .attr("class", "barplottip")
      .style("display", "none")

    d3.selectAll("rect")
      .data(props.data, function (survivalcurvedat: any) { return survivalcurvedat.age.toPrecision() })
      .on("mouseenter", function (e: Event, d: SurvivalCurveData) {
        const bbox=(this as any).getBBox();
        tip
          .html(
              "Probability: <strong>" + formatter(d.prob) + "</strong><br/>" +
              "of surviving past: <strong>" + d.age + "</strong>"
            )
          .style("display","block")
          .style("left", (bbox.x+margin.left+width/0.9*0.05+bbox.width/2-4).toString() + "px")
          .style("top", (bbox.y-1).toString() + "px")
        d3.select(this).raise().style("fill", colors.barHighlight);
      })
      .on("mouseleave", function (e: Event, d: SurvivalCurveData) {
        tip.style("display", "none")
        d3.select(this).style("fill", colors.barFill);
      });
  };

  const setTitleAndLabels = () => {

    let svg = d3.select(chartArea.current).select("g");

    const headersize= ( width>420 ? 20 : (width>300 ? 16 : 12) ).toString()+"px";
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .text("Probability of being alive each year")
      .style("font-size", headersize)
      .attr("font-weight", 700)
      .attr("text-anchor", "middle");

    svg
      .append("text")
      .attr("transform", "translate(" + width / 2 + " ," + (height + 40) + ")")
      .style("text-anchor", "middle")
      .text("Age")
      .style("font-size", "16px")
      .attr("font-weight", 700);

    svg
      .append("text")
      .attr("transform", "translate(" + -40 + "," + height / 2 + ")rotate(-90)")
      .style("text-anchor", "middle")
      .text("Probability")
      .style("font-size", "16px")
      .attr("font-weight", 700);
  };

  return <div ref={chartArea} style={{position:"relative"}}></div>;
});
export default BarPlotWrapper;
