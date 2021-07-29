import * as d3 from "d3";
import React from "react";
import { useEffect, useRef } from "react";
import { DataPoint } from "../models/updateFormNodes/FinalSummary/SummaryView";

export interface PieChartProps {
    data: DataPoint[]
}

interface tmpData {
    name: string,
    value: number,
    parent: string
}

const Treemap = (props: PieChartProps) => {
    const chartArea = useRef(null);
    const margin = { top: 50, right: 20, bottom: 50, left: 70 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;


    const colors = { barFill: "#69b3a2", barHighlight: "#9e1986" };

    const newData: tmpData[] = props.data.filter(data => data.value > 0.1).map(dataPoint => { return { name: dataPoint.name, value: dataPoint.value, parent: "Origin" } })

    useEffect(() => {
        createChart(newData);
    }, []);

    const createChart = (data: tmpData[]) => {
    const formatter = d3.format(".2")

        const svg = d3
            .select(chartArea.current)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        const pie = d3.pie()
            .padAngle(0.005)
            .sort(null)

        console.log(data)

        const root = d3.hierarchy({ children: data })
            .sum(function (d: any) { return d.value })
            .sort(function(a: any,b: any) {
                return b.value - a.value;
            })
        console.log(root.descendants())

        d3.treemap()
            .size([width, height])
            .padding(3)(root)

        svg
            .selectAll("rect")
            .data(root.leaves())
            .enter()
            .append("rect")
            .attr('x', function (d: any) { return d.x0; })
            .attr('y', function (d: any) { return d.y0; })
            .attr('width', function (d: any) { return d.x1 - d.x0; })
            .attr('height', function (d: any) { return d.y1 - d.y0; })
            .style("stroke", "black")
            .style("fill", "slateblue")

        svg
            .selectAll("text")
            .data(root.leaves())
            .enter()
            .append("text")
            .attr("x", function (d: any) { return d.x0 + 5 })    // +10 to adjust position (more right)
            .attr("y", function (d: any) { return d.y0 + 20 })    // +20 to adjust position (lower)
            .text(function (d: any) { return d.data.name + formatter(d.data.value) })
            .attr("font-size", "15px")
            .attr("fill", "white")

    };


    return <svg ref={chartArea} />;

}

export default Treemap