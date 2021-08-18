import { observer } from 'mobx-react';
import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../stores/rootStore';
import BarChart from './BarChart';
import { DataSet } from './PlottingData';
import "./BarChartWrapper.css";
import { useHistory } from 'react-router';
import { LifeExpectancyContributions } from '../models/updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy';

enum LatestChange {
	FITSCREEN="fit screen to disease width",
	GROUPING= "collected categories to make grouping"
}

interface BarChartWrapperProps {
	database: DataSet | LifeExpectancyContributions;
	simpleVersion?: boolean;
}

const BarChartWrapper = observer((props: BarChartWrapperProps) => { //class ChartWrapper extends React.PureComponent<any,any> {
	const store= useStore();
	const database = props.database;
	const chartArea = useRef(null);
	const history = useHistory();
	const [chart, setChart] = useState<BarChart | null>(null);

	const rerouter = (modelPage: string) => {
		if(modelPage.length>0){
			history.push("/model/"+modelPage)
		}
		else{
			history.push("/model")
		}
		
	}


	useEffect(() => {
		if(chart){
			if(store.barChartStore.latestChange===LatestChange.GROUPING){
				chart.changeCats(database, store.barChartStore.diseaseToWidth, store.barChartStore.explicitCollectedGroups)
			}
			else{
				chart.update(database, store.barChartStore.diseaseToWidth, true);
			}
		}
	}, [store.barChartStore.diseaseToWidth, store.barChartStore.explicitCollectedGroups])

	const createNewChart = function () {
		setChart(new BarChart(
			chartArea.current, 
			database, 
			store.loadedDataStore.descriptions, 
			store.barChartStore.diseaseToWidth, 
			store.barChartStore.setDiseaseToWidth, 
			store.barChartStore.explicitCollectedGroups, 
			store.barChartStore.expandCategory, 
			store.barChartStore.collectParentCategory,
			rerouter,
			store.loadedDataStore.rdat.getPossibleExpansions(),
			props.simpleVersion ? props.simpleVersion : false
		));
	}

	useEffect(()=> {
		if(chart){
			store.uIStore.setToolTipHider(chart.hideAllToolTips);
		}
		else{
			store.uIStore.setToolTipHider(()=>{})
		}
	}, [chart])


	useEffect(() => {
		console.log('width changed');
		if (chart) {
			chart.clear();
			createNewChart();
		}
	}, [store.uIStore.windowWidth])

	useEffect(() => {
		if (chart) {
			console.log("updating graphics based on database")
			console.log("database")
			console.log(database);
			chart.update(database, store.barChartStore.diseaseToWidth);
		}
	}, [database]);

	useEffect(() => {
		createNewChart();
		return () => {
			chart?.clear();
		}
	}, []);

	const colwidth= store.uIStore.windowWidth<501 ? "100%" : "90%"
	const padding= store.uIStore.windowWidth<501 ? "0px" : ""
	return (
		<div className="container" style={{width:colwidth, padding: padding}}>
			<div ref={chartArea} id="barchartcontainer" style={{position:"relative", padding:"0px",margin: "auto", top:"0px",left:"0px"}} />
		</div>
	)

});


export default BarChartWrapper;