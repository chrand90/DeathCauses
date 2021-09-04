import { observer } from 'mobx-react';
import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../stores/rootStore';
import BarChart from './BarChart';
import { DataRow, DataSet } from './PlottingData';
import "./BarChartWrapper.css";
import { useHistory } from 'react-router';
import { DeathCauseContributions } from '../models/updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy';
import { EVALUATION_UNIT } from '../stores/AdvancedOptionsStore';

enum LatestChange {
	FITSCREEN="fit screen to disease width",
	GROUPING= "collected categories to make grouping"
}

interface BarChartWrapperProps {
	database: {[key: string]: DataRow};
	evaluationUnit: EVALUATION_UNIT;
	simpleVersion?: boolean;
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
			props.evaluationUnit,
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
		if (chart) {
			chart.clear();
			createNewChart();
		}
	}, [store.uIStore.windowWidth, props.evaluationUnit])

	useEffect(() => {
		if (chart && chart.useLifeExpectancy === (props.evaluationUnit as EVALUATION_UNIT === EVALUATION_UNIT.YEARS_LOST ) ) {
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