import React from 'react';
import BarChart from './BarChart';

export default class ChartWrapper extends React.PureComponent<any,any> {
    should_resize: boolean;
    ref: HTMLElement | null;
    barchart: null | BarChart=null;
	constructor(props: any){
		super(props);
		this.state={
			width:0,
            barchart:null,
        }
        this.ref=null;
        this.should_resize=true;
	}

	componentDidMount(){
		window.addEventListener("resize", 
		this.updateDimensions.bind(this));
		this.barchart= new BarChart(this.ref, this.props.database);
	 }

	getWidth(){
		//console.log(this.chart);
		return window.innerWidth/10*7 //This is a hack until I am capable of getting the actual width of the container. 
	}

	render() {
        
		return <div className="container" ref={(ref: HTMLElement | null ) => this.ref = ref} id="barchartcontainer"/>
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




	 componentWillUnmount() {
		window.removeEventListener("resize",
		this.updateDimensions.bind(this));
	 }

}