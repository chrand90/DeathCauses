import React, { useRef, useState, useEffect } from 'react';
import RelationLinks, { NodeToColor } from '../models/RelationLinks';
import BarChart from './BarChart';
import { DataSet } from './PlottingData';

enum LatestChange {
	FITSCREEN="fit screen to disease width",
	GROUPING= "collected categories to make grouping"
}
interface CategorizationState {
	diseaseToWidth: string | null,
	collectedCategories: string[],
	latestChange: LatestChange
}

interface BarChartWrapperProps {
	database: DataSet;
	colorDic: NodeToColor;
	rdat: RelationLinks;
}

const BarChartWrapperSummary = (props: BarChartWrapperProps) => { //class ChartWrapper extends React.PureComponent<any,any> {
	const database = props.database;
	const chartArea = useRef(null);
	const [chart, setChart] = useState<BarChart | null>(null);
	const { width } = useWindowSize();
	const [categorization, setCategorization] = useState<CategorizationState>({diseaseToWidth: null, collectedCategories:["NonViolentDeath", "ViolentDeath"], latestChange: LatestChange.FITSCREEN})
	const collectedCategoriesRef=useRef([] as string[]);
	collectedCategoriesRef.current=categorization.collectedCategories;
	const diseaseToWidthRef=useRef(null as null | string);
	diseaseToWidthRef.current=categorization.diseaseToWidth;

	const setDiseaseToWidth = (newDiseaseToWidth: null | string) => {
		setCategorization({collectedCategories: collectedCategoriesRef.current, diseaseToWidth:newDiseaseToWidth, latestChange: LatestChange.FITSCREEN});
	}

	const createNewChart = function () {
		setChart(new BarChart(
			chartArea.current, 
			database, 
			props.colorDic, 
			categorization.diseaseToWidth, 
			setDiseaseToWidth, 
			props.rdat.makeCollectedGroups(categorization.collectedCategories), 
			()=>{}, 
			()=>{},
			props.rdat.getPossibleExpansions()
		));
	}

	useEffect(() => {
		console.log('width changed');
		if (chart) {
			chart.clear();
			createNewChart();
		}
	}, [width])

	useEffect(() => {
		console.log('data changed');
		if (chart) {
			chart.update(database, categorization.diseaseToWidth);
		}
	}, [database]);

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

export default BarChartWrapperSummary;