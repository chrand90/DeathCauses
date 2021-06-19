import { observer } from 'mobx-react';
import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../stores/rootStore';
import BarChart from './BarChart';
import { DataSet } from './PlottingData';

enum LatestChange {
	FITSCREEN="fit screen to disease width",
	GROUPING= "collected categories to make grouping"
}

interface BarChartWrapperProps {
	database: DataSet;
	simpleVersion?: boolean;
}

const BarChartWrapper = observer((props: BarChartWrapperProps) => { //class ChartWrapper extends React.PureComponent<any,any> {
	const store= useStore();
	const database = props.database;
	const chartArea = useRef(null);
	const [chart, setChart] = useState<BarChart | null>(null);
	const colorDic = store.loadedDataStore.rdat.getColorDic();


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
			colorDic, 
			store.barChartStore.diseaseToWidth, 
			store.barChartStore.setDiseaseToWidth, 
			store.barChartStore.explicitCollectedGroups, 
			store.barChartStore.expandCategory, 
			store.barChartStore.collectParentCategory,
			store.loadedDataStore.rdat.getPossibleExpansions(),
			store.loadedDataStore.rdat.optimizabilities,
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
			chart.update(database, store.barChartStore.diseaseToWidth);
		}
	}, [database]);

	useEffect(() => {
		createNewChart();
		return () => {
			chart?.clear();
		}
	}, []);

	return <div className="container" ref={chartArea} id="barchartcontainer" />

});


export default BarChartWrapper;