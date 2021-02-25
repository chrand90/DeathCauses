import * as d3 from 'd3';
import d3Tip from "d3-tip";
import './BarChart.css';
import { DataRow, DataSet, AugmentedDataSet, AugmentedDataRow } from './PlottingData';
import  make_squares, {SquareSection}  from './ComptutationEngine';
import { ScaleBand } from 'd3';
import {ALTERNATING_COLORS} from './Helpers';


const MARGIN = { TOP: 2, BOTTOM: 2, LEFT: 10, RIGHT: 10 }
const WIDTH = 1200;
let DESIGN= "LONG";
const BARHEIGHT = 50;
const XBARHEIGHT= 50;
const PADDING = 0.3;
const TEXT_COLUMN_SIZE=100;

interface ColorDic {
	[key: string]: string
}

const CAUSE_COLORS: ColorDic={'Unexplained':"#FFFFFF",
'partying':'#FF6C00'};

function getDivWidth(div: HTMLElement | null): number {
	console.log(div);
	if(div === null){
		return 0;
	}
    var width = d3.select(div)
      // get the width of div element
      .style('width')
      // take of 'px'
      .slice(0, -2)
    // return as an integer
    return Math.round(Number(width))
  }

interface DesignConstants {
	barheight: number,
	totalheight: number,
	totalheightWithXBar: number,
	startXScale: number,
	yListStart: number,
	yListInnerPadding: number,
	yListOuterPadding: number,
	yListAlign: number,
	middleOfChart: number,
	width: number,
	textTranslation: string,
	textAnchor: 'start' | 'middle' | 'end'
}

function longDesignConstants(n: number, width:number): DesignConstants{
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

function wideDesignConstants(n: number, width: number): DesignConstants{
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
    element: HTMLElement|null=null ;
    width: number=0;
    svg!: d3.Selection<SVGSVGElement,unknown,null,undefined>; // the exclamation point is necessary because the compiler does not realize that it is initialized in the constructor
    xAxisGroup: any| null;
	data: DataRow[] ;
	data2: SquareSection[]=[];
	stip: any;
	drect_order: string[];
	yBars: ScaleBand<string>;

	constructor(element: HTMLElement | null, database: DataSet) {
		console.log(database);

		//Initializers
		this.drect_order=[];
		this.yBars=d3.scaleBand();


		this.data=database;
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
		
		vis.make();
	}

	clear(){
		d3.select('svg').remove();
	}

	recalibrate_ybars(sort_data: DataSet, designConstants: DesignConstants){
		this.yBars = d3.scaleBand()
		.domain(sort_data.map((d:any) => d.name))
		.range([designConstants.yListStart, designConstants.totalheightWithXBar])
		.paddingInner(designConstants.yListInnerPadding)
		.paddingOuter(designConstants.yListOuterPadding)
		.align(designConstants.yListAlign)
	}

	make() {
		const vis = this;
		const n=vis.data.length;
		let designConstants = (DESIGN==='WIDE') ? wideDesignConstants(n,vis.width) : longDesignConstants(n, vis.width);

		vis.svg.attr("height", designConstants.totalheightWithXBar)
		const dataSortedName= copyOfSortedDataset(vis.data, 'name');
		const dataSortedTotal= copyOfSortedDataset(vis.data, 'totalProb');

		const augmented_data: AugmentedDataSet=dataSortedTotal.map((d: DataRow, index: number): AugmentedDataRow=> {
			let res: any= d;
			res["id"]=index;
			return res;
		})

		this.drect_order=dataSortedTotal.map((d) => d.name);
		const dataSquares=make_squares(dataSortedName);

		//Setting X-axis
		const newMaxX=getMaxX(dataSquares);
		const {xAxisCall, xscale} = this.createXAxisCall(newMaxX, designConstants)
		vis.xAxisGroup.call(xAxisCall)

		//Setting the mapping disease -> y value
		this.recalibrate_ybars(dataSortedTotal, designConstants);

		const yRects = d3.scaleBand()
			.domain(dataSortedTotal.map((d:any) => d.name))
			.align(designConstants.yListAlign)
			.range([designConstants.yListStart, designConstants.totalheightWithXBar])
		
		//DATA JOIN
		const diseases = vis.svg.selectAll("rect.shell").data(augmented_data, function(d: any){ return d.name })

		// EXIT
		diseases.exit().remove()

		// ENTER
		const g_components= diseases.enter().append('g').attr('class','rect.shell')

		/*  One disadvantage of this structure is that it is important that the text is never inserted before the 
			rectangle. Therefore it is important that they are inserted in the same order. 
		*/
		g_components.append('rect').attr('class','drect')
				.attr("y", (d:any,i:number) => (yRects(d.name) as number))
				.attr("x", xscale(0))
				.attr("width", designConstants.width)
				.attr("height", designConstants.barheight)
				.attr('fill', function(d:any,i:number) { return ALTERNATING_COLORS[d.id%2]})
				.style("opacity", 0.5)

		g_components.insert('text').attr('class','dtext')
				.attr("y", (d:any) => (this.yBars(d.name) as number))
				.attr("x", xscale(0))
				.text( (d:any) => d.name)
				.style('text-anchor',designConstants.textAnchor)
				.attr("transform",designConstants.textTranslation)

		
		//The causes themselves are plotted by this.
        const gs= vis.svg.selectAll(".causebar")
					.data(dataSquares, function(d: any) {return d.name+'.'+d.cause})


		d3.select(".d3-tip").remove(); //removes any old visible tooltips that was perhaps not removed by a mouseout event (for example because the mouse teleported instantanously by entering/exiting a full-screen). 


		vis.stip = d3Tip().attr('class', 'd3-tip').html( (d: SquareSection) => {
			return d.cause;
			} )
							.direction('s')
							.offset([10,0])
						
		vis.svg.call(vis.stip);
		
		gs.exit().remove()

		gs.enter().append('rect')
			.attr('class','causebar')
			.attr("y", d => (this.yBars(d.name) as number))
			.attr("x", d => xscale(d.x0))
			.attr('height', this.yBars.bandwidth)
			.attr("width", d => xscale(d.x)-xscale(d.x0))
			.attr("fill", d => CAUSE_COLORS[d.cause])
			.attr('stroke', '#2378ae' )
			.on("mouseenter", function(e: Event, d: SquareSection){
				d3.selectAll(".d3-tip").style("background-color", CAUSE_COLORS[d.cause])
				vis.stip.show(d,this);
				d3.select(this)
					.raise()
					.style("stroke-width",3)
					.style('stroke','#000000')
				})
			.on("mouseleave",  function(e: Event, d: SquareSection){
				vis.stip.hide(d,this);
				d3.select(this)
					.style("stroke-width",1)
					.style('stroke','#2378ae')
				})
			.on("resize",  function(e: Event, d: SquareSection){
				console.log('fullscreenchange');
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

	createXAxisCall(newMax: number, designConstants: DesignConstants){
		const x = d3.scaleLinear()
		.domain([
			0, 
			newMax*1.15
		])
		.range([designConstants.startXScale,designConstants.width])
		
		return {xAxisCall: d3.axisTop(x), xscale:x}
	}

	update(dataset: DataSet){

		const vis = this;
		
		const dataSortedTotal = copyOfSortedDataset(dataset, "totalProb"); 
		const dataSortedName = copyOfSortedDataset(dataset, 'name'); 

		//dataset that connects the original disease order (drect_order) with the new label.
		//In theory, it would be possible to rearrange the labels, but some of them will almost always end up
		//"below" a drect-object. Therefore it is easier to rename them.
		const rename_object= this.drect_order.map((d,i) => {
			return {new_name: dataSortedTotal[i].name, name: d}
		})

		const dataSquares=make_squares(dataSortedName);

		const n=dataSortedName.length;
		const designConstants = (DESIGN==='WIDE') ? wideDesignConstants(n,vis.width) : longDesignConstants(n, vis.width);

		//Updating X-axis
		const newMaxX=getMaxX(dataSquares);
		const {xAxisCall, xscale} = this.createXAxisCall(newMaxX, designConstants)
		vis.xAxisGroup.call(xAxisCall)

		//Updating the disease-to-y mapping (this.yBars)
		this.recalibrate_ybars(dataSortedTotal, designConstants); 

		const gs= vis.svg.selectAll(".causebar")
			.data(dataSquares, function(d: any) {return d.name+'.'+d.cause})

		const duration_per_transition=500;

		gs.transition()
			 .duration(duration_per_transition)
			.attr("x", d => xscale(d.x0))
			.attr("width", d => xscale(d.x)-xscale(d.x0))
		gs.transition()
			.delay(duration_per_transition)
			.duration(duration_per_transition)
			.attr("y", d => (this.yBars(d.name) as number))

		vis.svg.selectAll('.dtext')
			.data(rename_object, function(d:any){ return d.name})
			.transition()
			.delay(duration_per_transition*2)
			.text( (d:any) => d.new_name)


	};
}

function copyOfSortedDataset(dataset: DataSet, sorter: 'totalProb' | 'name' ='totalProb'): DataSet{
	return dataset.slice().sort(function(a: DataRow, b: DataRow) { return d3.descending(a[sorter], b[sorter]) });
}

function getMaxX(dataset: SquareSection[]):number{
	let a= d3.max(dataset, d => d.x);
	if(a === undefined){
		a=1.0
	}
	return a;
}
