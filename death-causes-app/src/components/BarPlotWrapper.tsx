import * as d3 from 'd3';
import { axisLeft } from 'd3';
import React, { useEffect, useRef } from 'react';
import { SurvivalCurveData } from './Calculations/SurvivalCurveData';

interface BarPlotWrapperProps {
    data: SurvivalCurveData[]
}

const BarPlotWrapper = (props: BarPlotWrapperProps) => { //class ChartWrapper extends React.PureComponent<any,any> {
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
            .padding(0.2);


        var xAxis = svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))


        var y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, 1]);
        var yAxis = svg.append("g").attr("class", "yXxis").call(d3.axisLeft(y));

        createNewChart()

    }, []);

    const createNewChart = function () {
        // var margin = { top: 50, right: 50, bottom: 50, left: 50 },
        //     width = 800 - margin.left - margin.right,
        //     height = 600 - margin.top - margin.bottom;

        // const svg = d3.select(chartArea.current)
        //     .attr("width", width + margin.left + margin.right)
        //     .attr("height", height + margin.top + margin.bottom)
        //     .append("g")
        //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // var x = d3.scaleBand()
        //     .range([0, width])
        //     .domain(props.data.map(element => element.age.toString()))
        //     .padding(0.2);

        // var y = d3.scaleLinear()
        //     .domain([0, 1])
        //     .range([height, 0]);
        // // X axis

        // x.domain(props.data.map(element => element.age.toString()))

        var svg = d3.select("g")

        var x = d3.scaleBand()
            .range([0, width])
            .padding(0.2)
            .domain(props.data.map(element => element.age.toString()))

        var y = d3.scaleLinear()
            .domain([0, 1])
            .range([height, 0]);
        // var xAxis = svg.append("g").attr("transform", "translate(0," + height + ")")
        // xAxis.call(d3.axisBottom(x))

        // y.domain([0, 1]);
        // yAxis.transition().duration(1000).call(d3.axisLeft(y));
        // xAxis.call(d3.axisBottom(x).tickValues(
        //     x.domain().filter(function (d, i) {
        //         return !(+d % 5);
        //     })
        // ))

        // svg.append("g").attr("transform", "translate(0," + height + ")")
        //     .call(xAxis)
        //     .selectAll("text")
        //     // .attr("transform", "translate(-10,0)rotate(-45)")
        //     .style("text-anchor", "middle");

        // // Add Y axis

        let tmp = d3.select<any, any>("g.Xaxis")
        d3.select<any, any>("g.xAxis").call(d3.axisBottom(x).tickValues(
            x.domain().filter(function (d, i) {
                return !(+d % 5);
            })
        ));

        var u = svg.selectAll<SVGRectElement, SurvivalCurveData[]>("rect").data(props.data)

        // // Bars

        u.enter()
            .append("rect")
            .merge(u)
            .transition()
            .duration(800)
            .attr("x", function (d, i) { return (x(d.age.toString()) as number) })
            .attr("y", function (d, i) { return y(d.prob) })
            .attr("width", x.bandwidth())
            .attr("height", function (d: any) { return height - y(d.prob) })
            .attr("fill", "#9e1986");

        // svg.selectAll("rect")
        //     .data(props.data)
        //     .join("rect")


        // svg.selectAll("rect")
        //     .attr("y", y(0))
        //     .attr("height", 0)

        //     .delay(function (d, i) { return (i * 1) })
        //     .attr("y", function (d: any) { return (y(d.prob)); })
        //     .attr("height", function (d: any) { return height - y(d.prob) });


        u
            .exit()
            .remove()
        // }


        // useEffect(() => {
        // 	console.log('width changed');
        // 	if (chart) {
        // 		chart.clear();
        // 		createNewChart();
        // 	}
        // }, [width])
    }

    // function useWindowSize() {
    //     const [windowSize, setWindowSize] = useState({
    //         width: window.innerWidth,
    //     });

    //     let resize_graphic = true;
    //     function changeWindowSize() {
    //         if (resize_graphic) {
    //             resize_graphic = false;
    //             setTimeout(() => {
    //                 setWindowSize({ width: window.innerWidth });
    //                 resize_graphic = true;
    //             }, 400);
    //         }
    //     }

    //     useEffect(() => {
    //         window.addEventListener("resize", changeWindowSize);

    //         return () => {
    //             window.removeEventListener("resize", changeWindowSize);
    //         };
    //     }, []);

    //     return windowSize;
    // }
    return <svg
        ref={chartArea}
    />;
}
export default BarPlotWrapper;