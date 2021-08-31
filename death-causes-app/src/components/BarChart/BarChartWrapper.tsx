import { observer } from 'mobx-react';
import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../stores/rootStore';
import BarChart from './BarChart';
import { DataSet } from '../PlottingData';
import "./BarChartWrapper.css";
import { useHistory } from 'react-router';
import { LifeExpectancyContributions } from '../../models/updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy';
import { KnowledgeableOptimizabilities } from '../../models/Optimizabilities';
import { Visualization } from '../../stores/UIStore';
import BarChartSettings from './BarChartSettings';
import "./BarChartWrapper.css";

enum LatestChange {
	FITSCREEN="fit screen to disease width",
	GROUPING= "collected categories to make grouping"
}

interface BarChartWrapperProps {
	database: DataSet | LifeExpectancyContributions;
	barChartSettings: BarChartSettings;
}

const BarChartWrapper = observer((props: BarChartWrapperProps) => { //class ChartWrapper extends React.PureComponent<any,any> {
	const store= useStore();
	const database = props.database;
	const chartArea = useRef(null);
	const history = useHistory();
	const [chart, setChart] = useState<BarChart | null>(null);

	const rerouter = (modelPage: string) => {
		if(modelPage.substring(0,1)==="#"){
			history.push("/model"+modelPage)
		}
		else if(modelPage.length>0 && modelPage.substring(0,1)!=="#"){
			history.push("/model/"+modelPage)
		}
		else{
			history.push("/model")
		}
		
	}

	const newOptims = () => {
		return new KnowledgeableOptimizabilities(store.loadedDataStore.optimizabilities, store.computationStore.submittedFactorAnswers)
	}


	useEffect(() => {
		if(chart){
			if(store.barChartStore.latestChange===LatestChange.GROUPING){
				chart.changeCats(
					database, 
					props.barChartSettings.getElementToWidth(store),
					props.barChartSettings.getGrouping(store),
					newOptims())
			}
			else{
				chart.update(
					database, 
					props.barChartSettings.getElementToWidth(store), 
					newOptims(), 
					true);
			}
		}
	}, [store.barChartStore.diseaseToWidth, store.barChartStore.conditionToWidth, store.barChartStore.explicitCollectedGroups])

	const createNewChart = function () {
		setChart(new BarChart(
			chartArea.current, 
			database, 
			store.loadedDataStore.descriptions, 
			props.barChartSettings.getElementToWidth(store),
			props.barChartSettings.setElementToWidth(store),
			props.barChartSettings.getGrouping(store),
			store.barChartStore.expandCategory, 
			store.barChartStore.collectParentCategory,
			rerouter,
			store.loadedDataStore.rdat.getPossibleExpansions(),
			newOptims(),
			props.barChartSettings
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
		if (chart) {
			chart.clear();
			createNewChart();
		}
	}, [store.uIStore.windowWidth, store.uIStore.conditionVizFlavor])

	useEffect(() => {
		if (chart) {
			chart.update(database, props.barChartSettings.getElementToWidth(store), newOptims());
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