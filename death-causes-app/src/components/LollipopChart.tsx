import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import {observer} from 'mobx-react';
import React, {useEffect, useRef} from 'react';
import {DataPoint} from '../models/updateFormNodes/FinalSummary/SummaryView';
import {useStore} from '../stores/rootStore';
import { CLICKED_COLOR, DEATHCAUSES_DARK } from './Helpers';
import {LollipopChartFormatting} from './LollipopChartFormatters';

export interface LollipopChartProps {
  data: DataPoint[];
  formatting: LollipopChartFormatting;
} 

const LollipopChart = observer((props: LollipopChartProps) => { 
  const store = useStore();
  const chartArea = useRef<any>(null);
  const margin = {top: 20, right: 20, bottom: 40, left: 120};
  var width: number;
  var height: number=320-margin.top-margin.bottom;

  const colors = {barFill: DEATHCAUSES_DARK, barHighlight: CLICKED_COLOR};
  const data = props.data;

  useEffect(() => {
    createChart();
  }, []);

  useEffect(() => {
    if (data && chartArea.current) {
      updateData();
    }
  }, [data]);

  useEffect(() => {
    if (chartArea.current !== null) {
      onWindowWidthUpdate();
      createChart();
    }
  }, [store.uIStore.windowWidth]);

  const updateDivWidth = () => {
    width = chartArea.current.offsetWidth - margin.left - margin.right;
  };

  const onWindowWidthUpdate = () => {
    const svg = d3.select(chartArea.current).selectAll('*').remove();
    if (chartArea !== null && chartArea.current !== null) {
      width = chartArea.current.offsetWidth  - margin.left - margin.right;
    }
  };

  const createChart = () => {
    updateDivWidth();
    const svg = d3
      .select(chartArea.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var x = d3
      .scaleLinear()
      .range([0, width])
      .domain([0, 1.2 * (d3.max(data.map(d => d.value)) as number)]);
    svg
      .append('g')
      .attr('class', 'xAxis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickFormat(d => props.formatting.xAxisFormatter(d.valueOf()))
      )
      .selectAll('text')
      .style('text-anchor', 'center')
      .style('font-size', '12px');

    var y = d3
      .scaleBand()
      .range([0, height])
      .domain(data.map(x => x.name))
      .padding(1);
    svg
      .append('g')
      .attr('class', 'yAxis')
      .call(
        d3
          .axisLeft(y)
          .tickFormat(x => getDescription(x))
          .tickSize(0)
      )
      .selectAll('text')
      // .attr("transform", "translate(-10)rotate(-45)")
      .style('text-anchor', 'end')
      .style('font-size', '12px')
      .attr('x', '-10');

    svg
      .selectAll('myline')
      .data(data, function (data: any, i: any) {
        return i;
      })
      .enter()
      .append('line')
      .attr('class', 'myLine')
      .attr('x1', x(0))
      .attr('x2', x(0))
      .attr('y1', function (d: any) {
        return y(d.name) as number;
      })
      .attr('y2', function (d: any) {
        return y(d.name) as number;
      })
      .attr('stroke', 'black')
      .attr('stroke-width', 2);

    // Circles -> start at X=0
    svg
      .selectAll('myCircle')
      .data(data, function (data: any, i: any) {
        return i;
      })
      .enter()
      .append('circle')
      .attr('class', 'myCircle')
      // .attr("id", function (d: any, i: any) { return i })
      .attr('cx', x(0))
      .attr('cy', function (d: any) {
        return y(d.name) as number;
      })
      .attr('r', '7')
      .style('fill', '#69b3a2')
      .attr('stroke', 'black');

    svg
      .selectAll('circle')
      .transition()
      .duration(2000)
      .attr('cx', function (d: any) {
        return x(d.value);
      });

    svg
      .selectAll('line')
      .transition()
      .duration(2000)
      .attr('x2', function (d: any) {
        return x(d.value) as number;
      });
    setMouseOverTips();
  };

  const updateData = () => {
    updateDivWidth();

    let svg = d3.select(chartArea.current).select('svg');

    let x = d3
      .scaleLinear()
      .domain([0, 1.1 * (d3.max(data.map(d => d.value)) as number)])
      .range([0, width]);

    d3.select<any, any>('g.xAxis')
      .transition()
      .duration(2000)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickFormat(d => props.formatting.xAxisFormatter(d.valueOf()))
      )
      .style('text-anchor', 'center')
      .style('font-size', '12px');

    var y = d3
      .scaleBand()
      .range([0, height])
      .domain(
        data.map(function (d) {
          return d.name;
        })
      )
      .padding(1);

    d3.select<any, any>('g.yAxis')
      .transition()
      .duration(2000)
      .call(
        d3
          .axisLeft(y)
          .tickFormat(x => getDescription(x))
          .tickSize(0)
      )
      .selectAll('text')
      .style('text-anchor', 'end')
      .style('font-size', '12px')
      .attr('x', '-10');

    var j = svg
      .select('g')
      .selectAll<any, DataPoint[]>('.myLine')
      .data(data, function (data: any, i: any) {
        return i;
      });
    // update lines
    j.join(
      (enter: any) => {
        return enter
          .append('line')
          .attr('class', 'myLine')
          .attr('x1', function (d: any) {
            return x(0);
          })
          .attr('x2', function (d: any) {
            return x(d.value);
          })
          .attr('y1', function (d: any) {
            return y(d.name);
          })
          .attr('y2', function (d: any) {
            return y(d.name) || '';
          });
      },
      (update: any) => {
        return update;
      },
      (exit: any) => {
        return exit.remove().selection();
      }
    )
      .transition()
      .duration(2000)
      .attr('x2', function (d: any) {
        return x(d.value);
      });

    var u = svg
      .select('g')
      .selectAll<any, DataPoint[]>('.myCircle')
      .sort((a: any, b: any) => d3.descending(a.value, b.value))
      .data(data, function (data: any, i: any) {
        return i;
      });
    // update bars

    u.join(
      (enter: any) => {
        return (
          enter
            .append('circle')
            .attr('class', 'myCircle')
            // .attr("id", function (d: any, i: any) { return i })
            .attr('cx', function (d: any) {
              return x(0);
            })
            .attr('cy', function (d: any) {
              return y(d.name) as number;
            })
            .attr('r', 8)
            .attr('fill', '#FFFFFF')
        );
      },
      (update: any) => {
        return update;
      },
      (exit: any) => {
        return exit.remove().selection();
      }
    )
      .transition()
      .duration(2000)
      .attr('cx', function (d: any) {
        return x(d.value);
      });

    setMouseOverTips();
  };

  const setMouseOverTips = () => {
    d3.select('.d3-tip').remove();

    let tip = d3
      .select(chartArea.current)
      .append('div')
      .attr('class', 'barplottip')
      .style('display', 'none');
//chartArea.current.offsetWidth * 0.1)/2 +
    d3.selectAll('.myCircle')
      .data(data)
      .on('mouseenter', function (e: Event, d: DataPoint) {
        const bbox=(this as any).getBBox();
        tip
          .html(props.formatting.getTooltipText(d.value, getDescription(d.name)))
          .style('display', 'block')
          .style("left",  margin.left+(+d3.select(this).attr("cx")) + "px")
          .style("top",  (margin.top+(+d3.select(this).attr("cy"))-16) + "px")
          .style("transform", "translate(-50%,-100%)")
        d3.select(this).raise().style('fill', colors.barHighlight);
      })
      .on('mouseleave', function (e: Event, d: DataPoint) {
        tip.style('display', 'none');
        d3.select(this).style('fill', colors.barFill);
      });
  };

  const getDescription = (causeName: string, length: number = 15): string => {
    return store.loadedDataStore.descriptions.getDescription(causeName, length);
  };

  return <div ref={chartArea} style={{position: "relative", width:"90%"}}/>
});

export default LollipopChart;
