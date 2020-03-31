import React, { Component } from 'react';
import BarChart from './BarChart';

export default class ChartWrapper extends Component {

	constructor(){
		super();
		this.state={
			width:0,
			barchart:null
		}
		this.should_resize=true;
	}

	getWidth(){
		console.log(this.chart);
		return window.innerWidth/10*7 //This is a hack until I am capable of getting the actual width of the container. 
	}

	render() {
		return <div ref="chart"></div>
	}

	updateDimensions(){
		if(this.should_resize){
			this.should_resize=false;
			console.log("updating dimensioms "+this.getWidth());
			setTimeout(() => {    
				if(this.barchart!==null){
					this.barchart.clear();
				}
				this.render();
				this.componentDidMount();
				this.should_resize=true;
			}, 500);

		}
		
		
	 }



	 componentDidMount(){
		window.addEventListener("resize", 
		this.updateDimensions.bind(this));
		this.barchart= new BarChart(this.refs.chart, this.props.database);
	 }
	 componentWillUnmount() {
		window.removeEventListener("resize",
		this.updateDimensions.bind(this));
	 }

}