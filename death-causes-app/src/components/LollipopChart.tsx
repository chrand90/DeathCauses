import * as d3 from "d3";
import { extent } from "d3";
import React from "react";
import { useEffect, useRef } from "react";
import { DataPoint } from "../models/updateFormNodes/FinalSummary/SummaryView";

export interface PieChartProps {
    data: DataPoint[]
}

const LollipopChart = (props: PieChartProps) => {
    const chartArea = useRef(null);
    const margin = { top: 40, right: 10, bottom: 40, left: 120 },
        width = 500 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;


    const colors = { barFill: "#69b3a2", barHighlight: "#9e1986" };


    useEffect(() => {
        createChart();
    }, []);

    const createChart = () => {
        const formatter = d3.format(".2")

        const svg = d3
            .select(chartArea.current)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        const data = props.data.filter(d => d.value>0).sort((a,b) => (b.value - a.value))
        console.log(data)

        var x = d3.scaleLinear()
            .range([0, width])
            .domain([0, d3.max(data.map(d => d.value)) as number]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        var y = d3.scaleBand()
            .range([0, height])
            .domain(data.map(x=> x.name))
            .padding(1);
        svg.append("g")
            .call(d3.axisLeft(y))

        svg.selectAll("myline")
            .data(data)
            .enter()
            .append("line")
            .attr("x1", x(0))
            .attr("x2", x(0))
            .attr("y1", function (d: any) { return y(d.name) as number; })
            .attr("y2", function (d: any) { return y(d.name) as number; })
            .attr("stroke", "grey")

        // Circles -> start at X=0
        svg.selectAll("mycircle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", x(0))
            .attr("cy", function (d: any) { return y(d.name) as number; })
            .attr("r", "7")
            .attr("stroke", "black")

        svg.selectAll("circle")
            .transition()
            .duration(2000)
            .attr("cx", function (d: any) { return x(d.value); })

        svg.selectAll("line")
            .transition()
            .duration(2000)
            .attr("x1", function (d: any) { return x(d.value) as number; })
    }

    return <svg ref={chartArea} />;
}

export default LollipopChart