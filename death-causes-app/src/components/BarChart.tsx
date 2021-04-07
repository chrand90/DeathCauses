import * as d3 from 'd3';
import d3Tip from "d3-tip";
import './BarChart.css';
import { DataRow, DataSet } from './PlottingData';
import  make_squares, {SquareSection}  from './ComptutationEngine';
import { ScaleBand, ScaleLinear } from 'd3';
import {ALTERNATING_COLORS, LINK_COLOR } from './Helpers';
import { CauseGrouping, NodeToColor } from '../models/RelationLinks';
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript';
import { rejects } from 'assert';


const MARGIN = { TOP: 2, BOTTOM: 2, LEFT: 10, RIGHT: 10 }
const WIDTH = 1200;
let DESIGN= "LONG";
const BARHEIGHT = 50;
const XBARHEIGHT= 50;
const PADDING = 0.3;
const TEXT_COLUMN_SIZE=100;
const TEXT_GRAY="#666666"
const NOT_CLICKABLE_GRAY="#b8b8b8"

const BASE_COLORS: NodeToColor={'Unexplained':"#FFFFFF",
'partying':'#FF6C00'};

function getDivWidth(div: HTMLElement | null): number {
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
	collectButtonTranslation: string,
	textAnchor: 'start' | 'middle' | 'end',
	expandButtonTranslation: string,
	collapseButtonsWidth: number,
	collapseButtonsHeight: number,
}

const buttonSize=18
const sameConstants={
	collectButtonTranslation: "translate(" + 10 + "," + (-BARHEIGHT/16-buttonSize) + ")",
	expandButtonTranslation: "translate(" + 10 + "," + (-BARHEIGHT/16-buttonSize) + ")",
	collapseButtonsWidth: buttonSize,
	collapseButtonsHeight: buttonSize,
}

function longDesignConstants(n: number, width:number): DesignConstants{
	return {
		...sameConstants,
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
		...sameConstants,
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
	stip: any;
	yBars: ScaleBand<string>;
	xscale: ScaleLinear<number, number>;
	colorDic: NodeToColor;
	setDiseaseToWidth: (newDiseaseToWidth: string | null)=> void;
	expandCollectedGroup: (causecategory:string) => void;
	collectGroup: (causecategory: string) => void;
	grouping: CauseGrouping;
	currentMax: number;

	constructor(
		element: HTMLElement | null, 
		database: DataSet, 
		colorDic: NodeToColor, 
		diseaseToWidth:string | null, 
		setDiseaseToWidth: (newDiseaseToWidth: string | null)=> void,
		collectedGroups: CauseGrouping,
		expandCollectedGroup: (causecategory:string) => void,
		collectGroup: (causecategory: string) => void,
		) {
		console.log(database);

		//Initializers
		this.yBars=d3.scaleBand();
		this.xscale=d3.scaleLinear();
		this.colorDic=Object.assign({}, colorDic, BASE_COLORS);
		this.setDiseaseToWidth=setDiseaseToWidth
		this.expandCollectedGroup=expandCollectedGroup
		this.collectGroup=collectGroup
		this.grouping=collectedGroups;
		this.currentMax=0;


		this.data=database;
		const vis = this
		vis.element=element;
		vis.width=getDivWidth(element)*0.9;  //getDivWidth(element)*0.9;

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
		
		vis.make(diseaseToWidth);
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

	makeButtons(
		dtextGroups: d3.Selection<any,any,any,any>, 
		designConstants:DesignConstants,
		grouping: CauseGrouping){
		const vis=this;
		dtextGroups.append('text')
				.attr('class','dtext')
				.attr("y", 0)
				.attr("x", 0)
				.text( function(d:any) {
					return d.name
					})
				.style('text-anchor',designConstants.textAnchor)
				.attr("transform",designConstants.textTranslation)
				.call(insertBB)

		const collectButtons=dtextGroups.append('g')
				.attr('class', 'dtextGroupCollect')
				.attr("transform", (d: any) => {
					return "translate("+(d.bbox.width+designConstants.collapseButtonsWidth*2.25)+", "+(-5)+")"
				})
				.style('cursor', 'pointer')

		collectButtons.append('text')
				.attr('class',"ctext")
				.text("-")
				.style("font-weight",800)
				.style("font-size","24px")
				.style('fill', TEXT_GRAY)
				.on("mouseenter", function(d){
					d3.select(this)
						.style("fill",LINK_COLOR)
				})
				.on("mouseleave", function(d){
					d3.select(this)
						.style("fill", TEXT_GRAY)
				})
				.on("click", (e:Event, d:DataRow)=>{
					this.collectGroup(d.name);
				})

		const expandButtons=dtextGroups.append('g')
				.attr('class', 'dtextGroupCollect')
				.attr("transform", (d: any) => {
					return "translate("+(d.bbox.width+designConstants.collapseButtonsWidth*1)+", "+(-5)+")"
				})
				.style('cursor', function(d){
					if(grouping.parentToCauses[d.name].length>1){
						return 'pointer'
					}
					return ''
				} )

		expandButtons.append('text')
				.attr('class',"ctext")
				.text("+")
				.style("font-weight",800)
				.style("font-size","24px")
				.style('fill', function(d){
					if(grouping.parentToCauses[d.name].length>1){
						return TEXT_GRAY
					}
					else{
						return NOT_CLICKABLE_GRAY
					}
				})
				.on("mouseenter", function(e: Event, d:DataRow){
					if(grouping.parentToCauses[d.name].length>1){
						d3.select(this).style("fill",LINK_COLOR)
					}
				})
				.on("mouseleave", function(e:Event, d:DataRow){
					if(grouping.parentToCauses[d.name].length>1){
						d3.select(this).style("fill", TEXT_GRAY)
					}
				})
				.on("click", (e:Event, d:DataRow)=>{
					if(grouping.parentToCauses[d.name].length>1){
						this.expandCollectedGroup(d.name);
					}
				})
	}

	insertPercentageText(dataSortedTotal: DataRow[]){
		this.svg.selectAll("ptext")
				.data(dataSortedTotal, function(d:any) {return d.name})
				.enter()
				.append('text')
				.attr('class','ptext')
				.attr("y", (d:any) => (this.yBars(d.name) as number))
				.attr("x", (d:any) => this.xscale(Math.min(this.currentMax, d.totalProb)))
				.text( function(d:any) {
					return (d.totalProb*100).toPrecision(3)+"%"
					})
				.style('text-anchor',"start")
				.attr("transform","translate(" + 5 + "," + BARHEIGHT/2 + ")")
				.style('fill', NOT_CLICKABLE_GRAY)
	}

	make(diseaseToWidth:string | null) {
		const vis = this;

		const {dataSortedTotal, dataSquares, dataIds} = this.computeRankAndSquares(vis.data, diseaseToWidth)

		const n=dataSortedTotal.length;
		let designConstants = (DESIGN==='WIDE') ? wideDesignConstants(n,vis.width) : longDesignConstants(n, vis.width);
		vis.svg.attr("height", designConstants.totalheightWithXBar)

		//Setting X-axis
		this.currentMax=getMaxX(dataSquares);
		const xAxisCall = this.createXAxisCall(this.currentMax, designConstants)
		vis.xAxisGroup.call(xAxisCall)

		//Setting the mapping disease -> y value
		this.recalibrate_ybars(dataSortedTotal, designConstants);

		this.instantUpdateOfRects(dataSortedTotal, designConstants)

		const dtextGroups=vis.svg.selectAll("dtextGroups")
				.data(dataSortedTotal, function(d: any) {return d.name})
				.enter()
				.append('g')
				.attr('class','dtextGroups')
				.attr("transform", (d:any) => {
					return (
						"translate(" + 
						this.xscale(0) +
						"," + 
						((this.yBars(d.name) as number)).toString() + 
						")"
					)
				})
		this.makeButtons(dtextGroups, designConstants, this.grouping);
			
		this.insertPercentageText(dataSortedTotal)	

		const rectButtons= vis.svg.selectAll("fitscreenButtons")
				.data(dataIds, function(i:any) {return i})
				.enter()
				.append('g')
				.attr('class','fitscreenButtons')
				.attr("transform", (i:any) => {
					return (
						"translate(" + 
						(designConstants.width-30).toString() + 
						"," + 
						((this.yBars(dataSortedTotal[i].name) as number)).toString() + 
						")"
					)
				})
				.style('cursor', 'pointer')
				.on("click", (e: Event, i:number) => {
					const clickedDisease=dataSortedTotal[i].name
					if(clickedDisease===diseaseToWidth){
						this.setDiseaseToWidth(null);
					}
					else{
						this.setDiseaseToWidth(clickedDisease)
					}
					
				})
		
		rectButtons.append("rect")
				.attr("width", 25)
				.attr("height",this.yBars.bandwidth()/2)
				.style("opacity", 0)
		
		rectButtons.append("text")
				.style("font-size", "20px")
				.attr("x",(d:any) => 0)
				.attr("y",(d:any) => BARHEIGHT/2)
				.attr("text-anchor","central")
				.style('fill', TEXT_GRAY)
				.text(function(d:any, index: number) {
					return "\u27F7"
				})
				.on("mouseenter", function(d){
					d3.select(this)
						.style("fill",LINK_COLOR)
				})
				.on("mouseleave", function(d){
					d3.select(this)
						.style("fill", TEXT_GRAY)
				})
		
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

		const addedBars=gs.enter().append('rect')
			.attr('class','causebar')

		this.addAttributesToCauseBars(addedBars);
			
			
	}

	addAttributesToCauseBars(causeBars: d3.Selection<any,any,any,any>){
		const vis=this
		causeBars.attr("y", d => (this.yBars(d.name) as number))
		.attr("x", d => this.xscale(d.x0))
		.attr('height', this.yBars.bandwidth)
		.attr("width", d => this.xscale(d.x)-this.xscale(d.x0))
		.attr("fill", d => this.colorDic[d.cause])
		.attr('stroke', '#2378ae' )
		.on("mouseenter", function(e: Event, d: SquareSection){
			d3.selectAll(".d3-tip").style("background-color", vis.colorDic[d.cause])
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
			vis.stip.hide(d,this);
			d3.select(this)
				.style("stroke-width",1)
				.style('stroke','#2378ae')
			})
	}

	createXAxisCall(newMax: number, designConstants: DesignConstants){
		const x = d3.scaleLinear()
		.domain([
			0, 
			newMax*1.15
		])
		.range([designConstants.startXScale,designConstants.width])
		this.xscale=x;
		return  d3.axisTop(x)
	}

	instantUpdateOfRects(totalProbs: DataRow[], designConstants: DesignConstants){
		const vis=this
		const yRects = d3.scaleBand()
			.domain(totalProbs.map((d:any) => d.name))
			.align(designConstants.yListAlign)
			.range([designConstants.yListStart, designConstants.totalheightWithXBar])
	
		const diseases = vis.svg.selectAll(".drect").data(totalProbs, function(d:any){return d.name})

		diseases.join('rect')
			.attr('class','drect')
			.attr("y", (d:any,i:number) => (yRects(d.name) as number))
			.attr("x", this.xscale(0))
			.attr("width", designConstants.width)
			.attr("height", designConstants.barheight)
			.attr('fill', function(d:any,i:number) { return ALTERNATING_COLORS[i%2]})
			.style("opacity", 0.5)
			.lower()
	}




	collapseCats(dataset: DataSet, diseaseToWidth: string | null,  newCollectedGroups: CauseGrouping, removed: string[], added: string[]){
		const {allSquares: dataSquares, totalProbs}=make_squares(dataset, diseaseToWidth, newCollectedGroups);
		const {allSquares: noMergeSquares, totalProbs: notUsed} = make_squares(dataset, diseaseToWidth,newCollectedGroups, false)
		const sortedTotalsWithRemovedCats=insertRemovedCatsInCopy(totalProbs, removed, added[0], this.yBars)
		const sortedTotalsFinal= copyOfSortedDataset(totalProbs, "totalProb");

		const vis = this;
		const n=sortedTotalsWithRemovedCats.length;
		let designConstants = (DESIGN==='WIDE') ? wideDesignConstants(n,vis.width) : longDesignConstants(n, vis.width);
		vis.svg.attr("height", designConstants.totalheightWithXBar)

		
		this.recalibrate_ybars(sortedTotalsWithRemovedCats, designConstants);

		const durationPerTransition=400;

		//this.instantUpdateOfRects(sortedTotalsWithRemovedCats, designConstants)

		const gs= vis.svg.selectAll<SVGRectElement, SquareSection[]>(".causebar")

		gs.transition("bars_y_move")
			.duration(durationPerTransition)
			.attr("y", (d:any) => (this.yBars(d.name) as number))
		
		const dtexts= vis.svg.selectAll<any,any>(".dtextGroups")
			.data(sortedTotalsWithRemovedCats, function(d: any) {return d.name})
		

		dtexts.transition("labels_move")
			.duration(durationPerTransition)
			.attr("transform", (d)=>{
				return "translate("+10+", "+ this.yBars(d.name) + ")"
			})
			.end()
			.then( () => {
				const addedDtextGroups=dtexts.enter()
					.append('g')
					.attr('class','dtextGroups')
					.attr("transform", (d:any) => {
						return (
							"translate(" + 
							this.xscale(0) +
							"," + 
							((this.yBars(d.name) as number)).toString() + 
							")"
						)
					})
				console.log("addedDtextGroups")
				console.log(addedDtextGroups);
				this.makeButtons(addedDtextGroups, designConstants, newCollectedGroups);
			})
		

		vis.svg.selectAll<any,any>(".ptext")
			.data(sortedTotalsWithRemovedCats, function(d: any) {return d.name})
			.transition("percentage_y_change")
			.duration(durationPerTransition)
			.attr("y", (d:any) => (this.yBars(d.name) as number))

		const newMaxX=getMaxX(dataSquares);
		const xAxisCall = this.createXAxisCall(newMaxX, designConstants)
		vis.xAxisGroup.transition("x_axis_change")
			.duration(durationPerTransition)
			.delay(durationPerTransition)
			.call(xAxisCall)

		vis.svg.selectAll<any,any>(".ptext")
			.transition("remove_percentages")
			.duration(0)
			.delay(durationPerTransition)
			.remove()
		
		const gsWitExpandedData= gs.data(noMergeSquares, function(d: any) {return d.name+'.'+d.cause})
		gsWitExpandedData.transition("bars_x_change")
			.duration(durationPerTransition)
			.delay(durationPerTransition)
			.attr("x", d => this.xscale(d.x0))
			.attr("width", d => this.xscale(d.x)-this.xscale(d.x0))

		const gsWithFinalData= gs.data(dataSquares, function(d:any) {return d.name+'.'+d.cause})

		gsWitExpandedData.transition("bars_y_move")
			.duration(durationPerTransition)
			.delay(durationPerTransition*2)
			.attr("y", d => (this.yBars(newCollectedGroups.causeToParent[d.name]) as number))
			.end()
			.then(()=>{
				this.currentMax=newMaxX;
				let newN=sortedTotalsFinal.length
				designConstants = (DESIGN==='WIDE') ? wideDesignConstants(newN,vis.width) : longDesignConstants(newN, vis.width);
				this.recalibrate_ybars(sortedTotalsFinal, designConstants)

				gsWithFinalData.exit()
					.remove()

				const enteredBars=gsWithFinalData.enter()
					.append('rect')
					.attr('class','causebar')
				this.addAttributesToCauseBars(enteredBars);
				
				const dtexts= vis.svg.selectAll<any,any>(".dtextGroups")
					.data(sortedTotalsFinal, function(d: any) {return d.name})

				dtexts.exit().remove()

				dtexts.transition("labels_move2")
					.duration(durationPerTransition)
					.attr("transform", (d)=>{
						return "translate("+10+", "+ this.yBars(d.name) + ")"
					})
					.end()
					.then(()=>{
						console.log("finished label move")
						vis.svg.attr("height", designConstants.totalheightWithXBar)
						this.instantUpdateOfRects(sortedTotalsFinal, designConstants);
					})
				
				gsWithFinalData.transition("ybar_move_again")
					.duration(durationPerTransition)
					.attr("y", (d:any) => (this.yBars(d.name) as number))
					.end()
					.then(()=>{
						this.insertPercentageText(sortedTotalsFinal);
						this.reMapFitScreenButtons(
							sortedTotalsFinal, 
							sortedTotalsFinal.map((d,i)=> i),
							diseaseToWidth
							)
					})
			})
	}


	// expandCats(
	// 	dataset: DataSet, 
	// 	diseaseToWidth: string | null,  
	// 	newCollectedGroups: CauseGrouping, 
	// 	removed: string[], 
	// 	added: string[]){

	// const {allSquares: dataSquares, totalProbs}=make_squares(dataset, diseaseToWidth, newCollectedGroups);
	// const {allSquares: noMergeSquares, totalProbs: notUsed} = make_squares(dataset, diseaseToWidth,this.grouping, false)
	// const sortedTotalsWithRemovedCat=insertRemovedCatsInCopy(totalProbs, added, removed[0], this.yBars)
	// const sortedTotalsFinal= copyOfSortedDataset(totalProbs, "totalProb");

	// 	const vis = this;
	// 	const n=sortedTotalsWithRemovedCats.length;
	// 	let designConstants = (DESIGN==='WIDE') ? wideDesignConstants(n,vis.width) : longDesignConstants(n, vis.width);
	// 	vis.svg.attr("height", designConstants.totalheightWithXBar)

		
	// 	this.recalibrate_ybars(sortedTotalsWithRemovedCats, designConstants);

	// 	const durationPerTransition=400;

	// 	//this.instantUpdateOfRects(sortedTotalsWithRemovedCats, designConstants)

	// 	const gs= vis.svg.selectAll<SVGRectElement, SquareSection[]>(".causebar")

	// 	gs.transition("bars_y_move")
	// 		.duration(durationPerTransition)
	// 		.attr("y", (d:any) => (this.yBars(d.name) as number))
		
	// 	const dtexts= vis.svg.selectAll<any,any>(".dtextGroups")
	// 		.data(sortedTotalsWithRemovedCats, function(d: any) {return d.name})
		

	// 	dtexts.transition("labels_move")
	// 		.duration(durationPerTransition)
	// 		.attr("transform", (d)=>{
	// 			return "translate("+10+", "+ this.yBars(d.name) + ")"
	// 		})
	// 		.end()
	// 		.then( () => {
	// 			const addedDtextGroups=dtexts.enter()
	// 				.append('g')
	// 				.attr('class','dtextGroups')
	// 				.attr("transform", (d:any) => {
	// 					return (
	// 						"translate(" + 
	// 						this.xscale(0) +
	// 						"," + 
	// 						((this.yBars(d.name) as number)).toString() + 
	// 						")"
	// 					)
	// 				})
	// 			console.log("addedDtextGroups")
	// 			console.log(addedDtextGroups);
	// 			this.makeButtons(addedDtextGroups, designConstants, newCollectedGroups);
	// 		})
		

	// 	vis.svg.selectAll<any,any>(".ptext")
	// 		.data(sortedTotalsWithRemovedCats, function(d: any) {return d.name})
	// 		.transition("percentage_y_change")
	// 		.duration(durationPerTransition)
	// 		.attr("y", (d:any) => (this.yBars(d.name) as number))

	// 	const newMaxX=getMaxX(dataSquares);
	// 	const xAxisCall = this.createXAxisCall(newMaxX, designConstants)
	// 	vis.xAxisGroup.transition("x_axis_change")
	// 		.duration(durationPerTransition)
	// 		.delay(durationPerTransition)
	// 		.call(xAxisCall)

	// 	vis.svg.selectAll<any,any>(".ptext")
	// 		.transition("remove_percentages")
	// 		.duration(0)
	// 		.delay(durationPerTransition)
	// 		.remove()
		
	// 	const gsWitExpandedData= gs.data(noMergeSquares, function(d: any) {return d.name+'.'+d.cause})
	// 	gsWitExpandedData.transition("bars_x_change")
	// 		.duration(durationPerTransition)
	// 		.delay(durationPerTransition)
	// 		.attr("x", d => this.xscale(d.x0))
	// 		.attr("width", d => this.xscale(d.x)-this.xscale(d.x0))

	// 	const gsWithFinalData= gs.data(dataSquares, function(d:any) {return d.name+'.'+d.cause})

	// 	gsWitExpandedData.transition("bars_y_move")
	// 		.duration(durationPerTransition)
	// 		.delay(durationPerTransition*2)
	// 		.attr("y", d => (this.yBars(newCollectedGroups.causeToParent[d.name]) as number))
	// 		.end()
	// 		.then(()=>{
	// 			this.currentMax=newMaxX;
	// 			let newN=sortedTotalsFinal.length
	// 			designConstants = (DESIGN==='WIDE') ? wideDesignConstants(newN,vis.width) : longDesignConstants(newN, vis.width);
	// 			this.recalibrate_ybars(sortedTotalsFinal, designConstants)

	// 			gsWithFinalData.exit()
	// 				.remove()

	// 			const enteredBars=gsWithFinalData.enter()
	// 				.append('rect')
	// 				.attr('class','causebar')
	// 			this.addAttributesToCauseBars(enteredBars);
				
	// 			const dtexts= vis.svg.selectAll<any,any>(".dtextGroups")
	// 				.data(sortedTotalsFinal, function(d: any) {return d.name})

	// 			dtexts.exit().remove()

	// 			dtexts.transition("labels_move2")
	// 				.duration(durationPerTransition)
	// 				.attr("transform", (d)=>{
	// 					return "translate("+10+", "+ this.yBars(d.name) + ")"
	// 				})
	// 				.end()
	// 				.then(()=>{
	// 					console.log("finished label move")
	// 					vis.svg.attr("height", designConstants.totalheightWithXBar)
	// 					this.instantUpdateOfRects(sortedTotalsFinal, designConstants);
	// 				})
				
	// 			gsWithFinalData.transition("ybar_move_again")
	// 				.duration(durationPerTransition)
	// 				.attr("y", (d:any) => (this.yBars(d.name) as number))
	// 				.end()
	// 				.then(()=>{
	// 					this.insertPercentageText(sortedTotalsFinal);
	// 					this.reMapFitScreenButtons(
	// 						sortedTotalsFinal, 
	// 						sortedTotalsFinal.map((d,i)=> i),
	// 						diseaseToWidth
	// 						)
	// 				})
	// 		})


	// }

	expandCats(a:any, b:any, c:any, d:any, e:any){
		
	}

	changeCats(dataset: DataSet, diseaseToWidth: string | null,  newCollectedGroups: CauseGrouping){
		const {removed, added}= getBooleanSet(this.grouping, newCollectedGroups)

		if(removed.length>added.length){
			this.collapseCats(dataset, diseaseToWidth, newCollectedGroups, removed, added)
		}
		else{
			this.expandCats(dataset,diseaseToWidth, newCollectedGroups, removed, added)
		}

		this.grouping=newCollectedGroups
	}

	computeRankAndSquares(data: DataRow[], diseaseToWidth:string| null): {dataSortedTotal: DataRow[], dataSquares: SquareSection[], dataIds:number[]}{
		const {allSquares: dataSquares, totalProbs}=make_squares(data, diseaseToWidth, this.grouping);
		const dataSortedTotal= copyOfSortedDataset(totalProbs, 'totalProb');
		const dataIds= dataSortedTotal.map((v:any, index:number) => {
			return index
		});
		return {dataSortedTotal, dataSquares, dataIds}
	}

	update(dataset: DataSet, diseaseToWidth: string | null){

		const vis = this;
		
		const {dataSortedTotal, dataSquares, dataIds} = this.computeRankAndSquares(dataset, diseaseToWidth)

		console.log("dataSortedTotal")
		console.log(dataSortedTotal);
		console.log("dataSquares")
		console.log(dataSquares)

		const n=dataSortedTotal.length;
		const designConstants = (DESIGN==='WIDE') ? wideDesignConstants(n,vis.width) : longDesignConstants(n, vis.width);

		//Updating X-axis
		this.currentMax=getMaxX(dataSquares);
		const xAxisCall = this.createXAxisCall(this.currentMax, designConstants)
		vis.xAxisGroup.call(xAxisCall)

		//Updating the disease-to-y mapping (this.yBars)
		this.recalibrate_ybars(dataSortedTotal, designConstants); 

		const gs= vis.svg.selectAll<SVGRectElement, SquareSection[]>(".causebar")
			.data(dataSquares, function(d: any) {return d.name+'.'+d.cause})

		const durationPerTransition=500;

		gs.exit().remove()

		gs.transition("bars_x_change")
			.duration(durationPerTransition)
			.attr("x", d => this.xscale(d.x0))
			.attr("width", d => this.xscale(d.x)-this.xscale(d.x0))

		vis.svg.selectAll<any,any>(".ptext")
			.data(dataSortedTotal, function(d: any) {return d.name})
			.transition("percentage_x_change_and_move")
			.duration(durationPerTransition)
			.attr("x", (d:any) => (this.xscale(Math.min(d.totalProb, this.currentMax)) as number))
			.text( function(d:any) {
				return (d.totalProb*100).toPrecision(3)+"%"
			})

		gs.transition("bars_y_move")
			.delay(durationPerTransition)
			.duration(durationPerTransition)
			.attr("y", (d:any) => (this.yBars(d.name) as number))
		
		vis.svg.selectAll<any,any>(".dtextGroups")
			.data(dataSortedTotal, function(d: any) {return d.name})
			.transition("labels_move")
			.delay(durationPerTransition)
			.duration(durationPerTransition)
			.attr("transform", (d)=>{
				return "translate("+10+", "+ this.yBars(d.name) + ")"
			})

		vis.svg.selectAll<any,any>(".ptext")
			.data(dataSortedTotal, function(d: any) {return d.name})
			.transition("percentage_y_change")
			.delay(durationPerTransition)
			.duration(durationPerTransition)
			.attr("y", (d:any) => (this.yBars(d.name) as number))
		
		this.reMapFitScreenButtons(dataSortedTotal, dataIds, diseaseToWidth);
	};

	reMapFitScreenButtons(dataSortedTotal: DataRow[], dataIds: number[], diseaseToWidth: string | null){
		this.svg.selectAll<any,any>(".fitscreenButtons")
			.data(dataIds, function(i:any) {return i})
			.on("click", (e:Event, i:number) => {
				const clickedDisease=dataSortedTotal[i].name
				if(clickedDisease===diseaseToWidth){
					this.setDiseaseToWidth(null);
				}
				else{
					this.setDiseaseToWidth(clickedDisease)
				}
			})
	}
}

function copyOfSortedDataset(dataset: DataSet, sorter: 'totalProb' | 'name' ='totalProb'): DataSet{
	return dataset.slice().sort(function(a: DataRow, b: DataRow) { return d3.descending(a[sorter], b[sorter]) });
}

function insertRemovedCatsInCopy(
	dataset: DataSet, 
	removed: string[], 
	added: string, 
	removedValue: d3.ScaleBand<string>
	): DataSet {
	let copy=dataset.slice().sort(function(a: DataRow, b: DataRow) { return d3.descending(a['totalProb'], b['totalProb']) });
	let indexOfAdded=-1
	copy.forEach((d:DataRow, i: number) => {
		if(d.name===added){
			indexOfAdded=i
		}
	})
	removed.sort(function(a,b) {
		return (removedValue(b) as number)-(removedValue(a) as number)
	}).forEach((removedName) => {
		copy.splice(indexOfAdded+1, 0, {
			name: removedName,
			totalProb: -1,
			innerCauses: {}
		})
	})
	return copy;
}

function getMaxX(dataset: SquareSection[]):number{
	let a= d3.max(dataset, d => d.x);
	if(a === undefined){
		a=1.0
	}
	return a;
}

function insertBB(selection: d3.Selection<any, any, any, any>) {
	selection.each(function (d: any) {
	  d.bbox = this.getBBox();
	});
  }

function getBooleanSet(oldGrouping: CauseGrouping, newGrouping: CauseGrouping){
	const listOne=Object.keys(oldGrouping.parentToCauses)
	const listTwo=Object.keys(newGrouping.parentToCauses)
	let removed: string[]= listOne.filter(d => !listTwo.includes(d))
	let added: string[]=listTwo.filter(d=> !listOne.includes(d));
	return {removed, added}
}
