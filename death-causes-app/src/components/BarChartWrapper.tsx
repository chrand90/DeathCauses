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
	const chartArea = useRef(null);
	const [chart, setChart] = useState<BarChart | null>(null);
	const { width } = useWindowSize();
	const [diseaseToWidth, setDiseaseToWidth] = useState<string | null>(null);
	const [collectedCategories, setCollectedCategories] = useState<string[]>([]);
	const collectedCategoriesRef=useRef([] as string[]);
	collectedCategoriesRef.current=collectedCategories;

	const expandCategory= (category: string) => {
		console.log("expands "+ category)
		console.log("from"+collectedCategoriesRef.current.toString())
		let newCats=[...collectedCategoriesRef.current]
		if(newCats.includes(category)){
			newCats=newCats.filter(d => d!==category)
			newCats=newCats.concat(props.rdat.getImmediateCauseCategoryDescendants(category))
			setCollectedCategories(newCats);
		}
		else{
			console.log("Tried to remove a category that wasnt collapsed... Ignored.")
		}

	}

	const collectParentCategory= (category: string) => {
		console.log("collects "+category)
		const parent=props.rdat.getParentCategory(category)
		let noLongerNeedsToBeCollapsed: string[];
		let newCats:string[]=[...collectedCategoriesRef.current]
		if(parent){
			noLongerNeedsToBeCollapsed=props.rdat.findCauseCategoryDescendants(parent)
			noLongerNeedsToBeCollapsed=noLongerNeedsToBeCollapsed.filter(item => item !== parent);
			newCats.push(parent)
		}
		else{
			noLongerNeedsToBeCollapsed=[]; 
		}
		const newCollectedGroups=newCats.filter(d=>!noLongerNeedsToBeCollapsed.includes(d))
		setCollectedCategories(newCollectedGroups);
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
			collectParentCategory,
			props.rdat.getPossibleExpansions()
		));
	}

	useEffect(() => {
		console.log("new expanded categories "+collectedCategories)
		if (chart) {
			chart.changeCats(database, diseaseToWidth, props.rdat.makeCollectedGroups(collectedCategories))
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