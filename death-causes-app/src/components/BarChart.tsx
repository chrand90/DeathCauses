import * as d3 from 'd3';
import d3Tip from "d3-tip";
import make_squares from './ComputationEngine';
import './BarChart.css';
import { ReactInstance } from 'react';

const MARGIN = { TOP: 2, BOTTOM: 2, LEFT: 10, RIGHT: 10 }
const WIDTH = 1200;
const DESIGN= "LONG";
const BARHEIGHT = 50;
const XBARHEIGHT= 50;
const PADDING = 0.3;
const TEXT_COLUMN_SIZE=100;
const ALTERNATING_COLORS=["#CFCFCF","#E4E4E4"];
const TEST_DATA= [{name: 'Corona',total_prob:0.15, inner_causes:{partying:0.45}},
{name:'Old age', total_prob:0.75, inner_causes:{}}, {name: 'Accidents', total_prob:0.10, inner_causes:{partying:0.1}}];
const CAUSE_COLORS={'Unexplained':"#FFFFFF",
'partying':'#FF6C00'};

function getDivWidth(div: HTMLElement | null): number {
    var width = d3.select(div)
      // get the width of div element
      .style('width')
      // take of 'px'
      .slice(0, -2)
    // return as an integer
    return Math.round(Number(width))
  }

function longDesignConstants(n: number, width:number){
	return {
		barheight: 1.5*BARHEIGHT,
		totalheight: n*1.5*BARHEIGHT,
		totalheightWithXBar: n*1.5*BARHEIGHT+XBARHEIGHT,
		startXScale: 10,
		yListStart: XBARHEIGHT,
		yListInnerPadding: 0.48,
		yListOuterPadding: 0.24,
		yListAlign:0.8,
		middleOfChart: width/2,
		width: width,
		textTranslation: "translate(" + 10 +
		 "," + -BARHEIGHT/8 + ")",
		textAnchor: 'start'
	}
}

function wideDesignConstants(n: number, width: number){
	return {
		barheight: BARHEIGHT,
		totalheight: n*BARHEIGHT,
		totalheightWithXBar: n*BARHEIGHT+XBARHEIGHT,
		startXScale: TEXT_COLUMN_SIZE,
		yListStart: XBARHEIGHT,
		yListInnerPadding: PADDING,
		yListOuterPadding: PADDING/2,
		yListAlign: 0.5,
		middleOfChart: TEXT_COLUMN_SIZE+(width-TEXT_COLUMN_SIZE)/2,
		width: width,
		textTranslation: "translate(" + -10 + "," + (BARHEIGHT/2) + ")",
		textAnchor: 'end'
	}
}

export default class BarChart {
    element: HTMLElement | null =null;
    width: number=0;
    svg: d3.Selection<HTMLElement> | null=null;

	constructor(element: HTMLElement | null, database: any) {
        const vis = this
		vis.element=element;
		vis.width=getDivWidth(element)*0.9;  //getDivWidth(element)*0.9;
		console.log("vis width " + vis.width);
		//width="100%" viewBox="0 0 10 1.5" preserveAspectRatio="xMinYMin">
		vis.svg = d3.select(element)
			.append("svg")
				.attr("width", vis.width)
				.attr("height", BARHEIGHT+XBARHEIGHT)
		

		vis.xAxisGroup = vis.svg.append("g")
							.attr('transform',`translate(0,${XBARHEIGHT})`)
		let designConstants = (DESIGN==='WIDE') ? wideDesignConstants(1,vis.width) : longDesignConstants(1, vis.width);

		vis.svg.append('text')
			.attr("x", designConstants.middleOfChart)
			.attr("y", XBARHEIGHT/2)
			.attr("font-size", 20)
			.attr("text-anchor", "middle")
			.text("Probability of dying of cause")
		
		vis.update();
	}

	clear(){
		d3.select('svg').remove();
	}

	update() {
		const vis = this;
		vis.data = TEST_DATA; //(gender === "men") ? vis.menData : vis.womenData;
		const n=vis.data.length;
		let designConstants = (DESIGN==='WIDE') ? wideDesignConstants(n,vis.width) : longDesignConstants(n, vis.width);

		vis.svg.attr("height", designConstants.totalheightWithXBar)
		vis.data.sort(function(a, b) {
			return d3.descending(a.total_prob, b.total_prob)
		})
		vis.data2=make_squares(vis.data);

		const x = d3.scaleLinear()
			.domain([
				0, 
				d3.max(vis.data2, d =>  d.x)*1.15
			])
			.range([designConstants.startXScale,designConstants.width])

		const yBars = d3.scaleBand()
			.domain(vis.data.map(d => d.name))
			.range([designConstants.yListStart, designConstants.totalheightWithXBar])
			.paddingInner(designConstants.yListInnerPadding)
			.paddingOuter(designConstants.yListOuterPadding)
			.align(designConstants.yListAlign)

		const yRects = d3.scaleLinear()
			.domain([0,designConstants.totalheight])
			.range([XBARHEIGHT, designConstants.totalheightWithXBar])


		const xAxisCall = d3.axisTop(x)
		vis.xAxisGroup.call(xAxisCall)

		vis.stip = d3Tip().attr('class', 'd3-tip').html(function(d) { return d.cause; })
						.direction('s')
						.offset([10,0])
						
		vis.svg.call(vis.stip);
		
		//DATA JOIN
		const diseases = vis.svg.selectAll(".rect.shell")
			.data(vis.data)

		// EXIT
		diseases.exit().remove()
			//.transition().duration(500)
			//	.attr("height", 0)
			//	.attr("y", HEIGHT)
				

		// UPDATE
		diseases.transition().duration(500)
			.attr("y", (d,i) => BARHEIGHT*i)
			.attr('fill', function(d,i) { return ALTERNATING_COLORS[i%2]})

		// ENTER
		const g_components= diseases.enter().append('g').attr('class','rect.shell')

		g_components.append('rect').attr('class','disease.rect')
				.attr("y", (d,i) => yRects(designConstants.barheight*i))
				.attr("x", 0)
				.attr("width", designConstants.width)
				.attr("height", designConstants.barheight)
				.attr('fill', function(d,i) { return ALTERNATING_COLORS[i%2]})
				.style("opacity", 0.5)
		g_components.append('text').attr('class','disease.text')
				.attr("y", d => yBars(d.name))
				.attr("x", x(0))
				.text(d => d.name)
				.style('text-anchor',designConstants.textAnchor)
				.attr("transform",designConstants.textTranslation)
		
		const gs= vis.svg.selectAll(".causebar")
					.data(vis.data2)
		
		gs.exit().remove()

		gs.enter().append('rect')
			.attr('class','causebar')
			.attr("y", d => yBars(d.name))
			.attr("x", d => x(d.x0))
			.attr('height', yBars.bandwidth)
			.attr("width", d => x(d.x)-x(d.x0))
			.attr("fill", d => CAUSE_COLORS[d.cause])
			.attr('stroke', '#2378ae' )
			.on("mouseover", function(d){
				d3.selectAll(".d3-tip").style("background-color", CAUSE_COLORS[d.cause])
				vis.stip.show(d,this);
				d3.select(this)
					.raise()
					.style("stroke-width",3)
					.style('stroke','#000000')
				})
			.on("mouseout",  function(d){
				vis.stip.hide(d,this);
				d3.select(this)
					.style("stroke-width",1)
					.style('stroke','#2378ae')
				})
			
			//
			//});
			//.transition().duration(500)
				//.attr("height", d => HEIGHT - y(d.total_prob))
				//.attr("y", d => y(d.height)) */
			
		
		

		
			
	}
}