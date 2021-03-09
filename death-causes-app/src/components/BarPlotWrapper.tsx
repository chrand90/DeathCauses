import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';
import { SurvivalCurveData } from './Calculations/SurvivalCurveData';
import d3Tip from "d3-tip";
import './BarPlotWrapper.css'
import { unstable_batchedUpdates } from 'react-dom';

interface BarPlotWrapperProps {
    data: SurvivalCurveData[]
}

const BarPlotWrapper = (props: BarPlotWrapperProps) => {
    console.log(props.data);

    const chartArea = useRef(null);
    const margin = { top: 50, right: 50, bottom: 50, left: 50 },
        width = 800 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    // const [chart, setChart] = useState<BarPlot | null>(null);
    // const { width } = useWindowSize();


    useEffect(() => {
        console.log('dataset changed');
        if (props.data && chartArea.current) {
            createNewChart()
        }
    }, [props.data]);

    useEffect(() => {
        const svg = d3.select(chartArea.current)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        var x = d3.scaleBand()
            .range([0, width])
            .padding(0.2)
            .domain(props.data.map(element => element.age.toString()));


        var xAxis = svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))


        var y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, 1]);
        var yAxis = svg.append("g").attr("class", "yXxis").call(d3.axisLeft(y));

        // createNewChart()

        var u = svg.selectAll<SVGRectElement, SurvivalCurveData[]>("rect").data(props.data)
        u.enter()
            .append("rect")
            .attr("x", function (d, i) { return (x(d.age.toString()) as number) })
            .attr("width", x.bandwidth())
            .attr("height", function (d: any) { return height - y(0) })
            .attr("y", function (d, i) { return y(0) })
            .attr("fill", "#9e1986")

        svg.selectAll<SVGRectElement, SurvivalCurveData[]>("rect").data(props.data)
            .transition()
            .duration(700)
            .attr("y", function (d, i) { return y(d.prob) })
            .attr("height", function (d: any) { return height - y(d.prob) })
            .delay(function (d, i) { console.log(i); return (i * 5 ) })
    }, []);

    const createNewChart = function () {
        var svg = d3.select("g")

        var u = svg.selectAll<SVGRectElement, SurvivalCurveData[]>("rect").data(props.data)

        var x = d3.scaleBand()
            .range([0, width])
            .padding(0.2)
            .domain(props.data.map(element => element.age.toString()))

        var y = d3.scaleLinear()
            .domain([0, 1])
            .range([height, 0]);

        d3.select<any, any>("g.xAxis").call(d3.axisBottom(x).tickValues(
            x.domain().filter(function (d, i) {
                return !(+d % 5);
            })
        ));


        u.join((enter: any) => {
            return enter.append("rect")
                .attr("x", function (d: any, i: any) { return width })
                .attr("width", x.bandwidth())
                .attr("height", function (d: any) { return height - y(0) })
                .attr("y", function (d: any, i: any) { return y(0) })
                .attr("fill", "#9e19236").transition().selection()
        },
            (update: any) => { return update },
            (exit: any) => {
                return exit.remove().selection()
            })
            .transition()
            .duration(700)
            .attr("x", function (d, i) { return (x(d.age.toString()) as number) })
            .attr("y", function (d, i) { return y(d.prob) })
            .attr("width", x.bandwidth())
            .attr("height", function (d: any) { return height - y(d.prob) })
        // .attr("fill", "#9e1986")


        // // Bars
        // u.enter()
        //     .append("rect")
        //     .merge(u)
        //     .transition()
        //     .duration(800)
        //     .attr("x", function (d, i) { return (x(d.age.toString()) as number) })
        //     .attr("y", function (d, i) { return y(d.prob) })
        //     .attr("width", x.bandwidth())
        //     .attr("height", function (d: any) { return height - y(d.prob) })
        //     .attr("fill", "#9e1986")

        // u.exit().remove()

        d3.select(".d3-tip").remove();

        let tip = d3Tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function (d: SurvivalCurveData) {
                return "<strong>Frequency:</strong> <span style='color:red'>" + d.age + " " + d.prob + "</span>";
            })

        svg.call(tip);

        d3.selectAll("rect").data(props.data)
            .on("mouseenter", function (e: Event, d: SurvivalCurveData) {
                d3.selectAll(".d3-tip").style("background-color", "9cc986").style("opacity", 1)
                tip.show(d, this);
                d3.select(this)
                    .raise()
                    .style("fill", "#9ea286")
            })
            .on("mouseleave", function (e: Event, d: SurvivalCurveData) {
                tip.hide(d, this);
                d3.select(this)
                    .style('fill', '#9e1986')
            })

    }


    return <svg
        ref={chartArea}
    />;
}
export default BarPlotWrapper;