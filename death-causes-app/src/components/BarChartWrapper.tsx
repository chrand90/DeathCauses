import React, {useRef, useState, useEffect} from 'react';
import BarChart from './BarChart';
import {DataSet} from './PlottingData';

interface BarChartWrapperProps {
	database: DataSet
}

const BarChartWrapper= (props: BarChartWrapperProps) => { //class ChartWrapper extends React.PureComponent<any,any> {
	const database=props.database;
	console.log(database);
	const chartArea = useRef(null);
	const [chart, setChart] = useState<BarChart | null>(null);
	const {width} = useWindowSize();

	const createNewChart = function() {
		setChart(new BarChart(chartArea.current,database));
	}


	useEffect(() => {
		if(chart){
			chart.clear();
			createNewChart();
		}
	  }, [width])

	useEffect(()=> {
		chart?.clear()
		createNewChart();
	}, [database]);

	return <div className="container" ref={chartArea} id="barchartcontainer"/>
	

	// constructor(props: any){
	// 	super(props);
	// 	this.state={
			
	// 		barchart:null,
	// 	}
	// 	useEffect(() => {
	// 		this.createNewChart();
	// 	}, [this.state.width]);
    //     this.ref=null;
	// 	this.should_resize=true;
	// 	this.chartArea = useRef(null);
		
	// }



	// componentDidMount(){
	// 	window.addEventListener("resize", 
	// 	this.updateDimensions.bind(this));
	// 	this.barchart= new BarChart(this.ref, this.props.database);
	//  }

	// getWidth(){
	// 	//console.log(this.chart);
	// 	return window.innerWidth/10*7 //This is a hack until I am capable of getting the actual width of the container. 
	// }



	// updateDimensions(){
	// 	if(this.should_resize){
	// 		this.should_resize=false;
	// 		console.log("updating dimensioms "+this.getWidth());
	// 		setTimeout(() => {    
	// 			if(this.barchart!==null){
	// 				this.barchart.clear();
	// 			}
	// 			this.render();
	// 			this.componentDidMount();
	// 			this.should_resize=true;
	// 		}, 500);
	// 	}
	//  }




	//  componentWillUnmount() {
	// 	window.removeEventListener("resize",
	// 	this.updateDimensions.bind(this));
	//  }

}

function useWindowSize() {
	const isSSR = typeof window !== "undefined";
	const [windowSize, setWindowSize] = React.useState({
	  width: isSSR ? 1200 : window.innerWidth,
	});
  
	let resize_graphic=true;
	function changeWindowSize() {
		if(resize_graphic){
			resize_graphic=false;
			setTimeout(()=>{
				setWindowSize({ width: window.innerWidth});
				resize_graphic=true;
			},400);
		}
	}
  
	React.useEffect(() => {
	  window.addEventListener("resize", changeWindowSize);
  
	  return () => {
		window.removeEventListener("resize", changeWindowSize);
	  };
	}, []);
  
	return windowSize;
  }
  
  export default BarChartWrapper;