import React, { useRef, useState, useEffect } from 'react';
import RelationLinks, { NodeToColor } from '../models/RelationLinks';
import BarChart from './BarChart';
import { DataSet } from './PlottingData';

interface BarChartWrapperProps {
	database: DataSet;
	colorDic: NodeToColor;
	rdat: RelationLinks;
}

const BarChartWrapper = (props: BarChartWrapperProps) => { //class ChartWrapper extends React.PureComponent<any,any> {
	const database = props.database;
	console.log(database);
	const chartArea = useRef(null);
	const [chart, setChart] = useState<BarChart | null>(null);
	const { width } = useWindowSize();
	const [diseaseToWidth, setDiseaseToWidth] = useState<string | null>(null);
	const [collectedCategories, setCollectedCategories] = useState<string[]>([]);

	const expandCategory= (category: string) => {
		console.log("expands "+ category)
		let newCats=[...collectedCategories]
		if(newCats.includes(category)){
			newCats=newCats.filter(d => d!==category)
		}
		else{
			throw Error("Tried to remove a category that wasnt collapsed")
		}
		setCollectedCategories(newCats);
	}

	const collectParentCategory= (category: string) => {
		console.log("collects "+category)
		const parent=props.rdat.getParentCategory(category)
		let noLongerNeedsToBeCollapsed: string[];
		let newCats:string[]=[...collectedCategories]
		if(parent){
			noLongerNeedsToBeCollapsed=props.rdat.findCauseCategoryDescendants(category)
			newCats.push(parent)
		}
		else{
			noLongerNeedsToBeCollapsed=[]; 
		}
		setCollectedCategories(newCats.filter(d=>!noLongerNeedsToBeCollapsed.includes(d)));
	}


	const createNewChart = function () {
		setChart(new BarChart(
			chartArea.current, 
			database, 
			props.colorDic, 
			diseaseToWidth, 
			setDiseaseToWidth, 
			props.rdat.makeCollectedGroups(collectedCategories), 
			expandCategory, 
			collectParentCategory
		));
	}

	useEffect(() => {
		console.log("new expanded categories "+collectedCategories)
		if (chart) {
			chart.clear();
			createNewChart();
			// chart.expandCats(
			// 	database,  
			// 	diseaseToWidth,
			// 	props.rdat.makeCollectedGroups(collectedCategories)
			// )
		}
	}, [collectedCategories])


	useEffect(() => {
		console.log('width changed');
		if (chart) {
			chart.clear();
			createNewChart();
		}
	}, [width])

	useEffect(() => {
		if (chart) {
			chart.update(database, diseaseToWidth);
		}
	}, [database, diseaseToWidth]);

	useEffect(() => {
		createNewChart();
		return () => {
			chart?.clear();
		}
	}, []);

	return <div className="container" ref={chartArea} id="barchartcontainer" />

}

function useWindowSize() {
	const [windowSize, setWindowSize] = useState({
		width: window.innerWidth,
	});

	let resize_graphic = true;
	function changeWindowSize() {
		if (resize_graphic) {
			resize_graphic = false;
			setTimeout(() => {
				setWindowSize({ width: window.innerWidth });
				resize_graphic = true;
			}, 400);
		}
	}

	useEffect(() => {
		window.addEventListener("resize", changeWindowSize);

		return () => {
			window.removeEventListener("resize", changeWindowSize);
		};
	}, []);

	return windowSize;
}

export default BarChartWrapper;