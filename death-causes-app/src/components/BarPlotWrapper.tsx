import * as d3 from "d3";
import React, { useEffect, useRef } from "react";
import { SurvivalCurveData } from "./Calculations/SurvivalCurveData";
import d3Tip from "d3-tip";
import "./BarPlotWrapper.css";

interface BarPlotWrapperProps {
  data: SurvivalCurveData[];
}

const BarPlotWrapper = (props: BarPlotWrapperProps) => {
  const chartArea = useRef(null);
  const margin = { top: 50, right: 20, bottom: 50, left: 70 },
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

  const colors = { barFill: "#69b3a2", barHighlight: "#9e1986" };
    const formatter = d3.format(".3p")
  // const [chart, setChart] = useState<BarPlot | null>(null);
  // const { width } = useWindowSize();

  useEffect(() => {
    console.log("dataset changed");
    if (props.data && chartArea.current) {
      updateChart();
    }
  }, [props.data]);

  useEffect(() => {
    createChart();
  }, []);

  const createChart = () => {
    const svg = d3
      .select(chartArea.current)
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

    var xAxis = svg
      .append("g")
      .attr("class", "xAxis")
      .attr("transform", "translate(0," + height + ")")
      .style("font-size", "14px")
      .call(
        d3.axisBottom(x).tickValues(
          x.domain().filter(function (d: any, i: any) {
            return !(+d % 5);
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
      .data(props.data);

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
        console.log(i);
        return i * 5;
      });

    setMouseOverTips();
  };

  const updateChart = function () {
    var svg = d3.select("g");

    var u = svg
      .selectAll<SVGRectElement, SurvivalCurveData[]>("rect")
      .data(props.data);

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
            return width;
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
        return exit.remove().selection();
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
    d3.select(".d3-tip").remove();

    let tip = d3Tip()
      .attr("class", "d3-tip")
      .offset([-10, 0])
      .html(function (d: SurvivalCurveData) {
        return (
          "Probability: <strong>" + formatter(d.prob) +  "</strong><br/>" +
          "of surviving past: <strong>" + d.age + "</strong>"
        );
      });

    d3.select("g").call(tip);

    d3.selectAll("rect")
      .data(props.data)
      .on("mouseenter", function (e: Event, d: SurvivalCurveData) {
        d3.selectAll(".d3-tip")
          .style("background-color", "9cc986")
          .style("opacity", 1);
        tip.show(d, this);
        d3.select(this).raise().style("fill", colors.barHighlight);
      })
      .on("mouseleave", function (e: Event, d: SurvivalCurveData) {
        tip.hide(d, this);
        d3.select(this).style("fill", colors.barFill);
      });
  };

  const setTitleAndLabels = () => {
    let svg = d3.select(chartArea.current).select("g");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .text("Probability of surviving each year")
      .style("font-size", "20px")
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

  return <svg ref={chartArea} />;
};
export default BarPlotWrapper;
