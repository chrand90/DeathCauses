import d3 from "d3";
import React from "react";
import { useEffect, useRef } from "react";
import { DataPoint, SummaryViewData } from "../models/updateFormNodes/FinalSummary/SummaryView";

const PieChart = (data: DataPoint[]) => {
    const chartArea = useRef(null);
    const margin = { top: 50, right: 20, bottom: 50, left: 70 },
        width = 800 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;
        

    const colors = { barFill: "#69b3a2", barHighlight: "#9e1986" };
    const formatter = d3.format(".3p")

    useEffect(() => {
        createChart();
    }, []);

    const createChart = () => {
        const svg = d3
            .select(chartArea.current)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)

        const pie = d3.pie()
            .padAngle(0.005)
            .sort(null)

            data.map(d => d.value)
    };


    return <svg ref={chartArea} />;

}