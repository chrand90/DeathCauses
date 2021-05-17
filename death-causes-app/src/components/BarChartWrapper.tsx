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

const BarChartWrapper = (props: BarChartWrapperProps) => { //class ChartWrapper extends React.PureComponent<any,any> {
	const database = props.database;
	const chartArea = useRef(null);
	const [chart, setChart] = useState<BarChart | null>(null);
	const { width } = useWindowSize();
	const [categorization, setCategorization] = useState<CategorizationState>({diseaseToWidth: null, collectedCategories:[], latestChange: LatestChange.FITSCREEN})
	const collectedCategoriesRef=useRef([] as string[]);
	collectedCategoriesRef.current=categorization.collectedCategories;
	const diseaseToWidthRef=useRef(null as null | string);
	diseaseToWidthRef.current=categorization.diseaseToWidth;

	const expandCategory= (category: string) => {
		console.log("expands "+ category)
		let newCats=[...collectedCategoriesRef.current]
		if(newCats.includes(category)){
			newCats=newCats.filter(d => d!==category)
			newCats=newCats.concat(props.rdat.getImmediateCauseCategoryDescendants(category))
			setCategorization({collectedCategories: newCats, diseaseToWidth:diseaseToWidthRef.current, latestChange: LatestChange.GROUPING});
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
		let newDiseaseToWidth: string | null=diseaseToWidthRef.current;
		if(diseaseToWidthRef.current && parent){
			if(props.rdat.findCauseCategoryAncestors(diseaseToWidthRef.current).includes(parent)){
				newDiseaseToWidth=null;
			}
		}
		const newCollectedGroups=newCats.filter(d=>!noLongerNeedsToBeCollapsed.includes(d))
		setCategorization({collectedCategories: newCollectedGroups, diseaseToWidth:newDiseaseToWidth, latestChange: LatestChange.GROUPING});
	}

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
			expandCategory, 
			collectParentCategory,
			props.rdat.getPossibleExpansions()
		));
	}

	useEffect(() => {
		if (chart) {
			if(categorization.latestChange===LatestChange.GROUPING){
				chart.changeCats(database, categorization.diseaseToWidth, props.rdat.makeCollectedGroups(categorization.collectedCategories))
			}
			else{
				chart.update(database, categorization.diseaseToWidth, true);
			}
			
		}
	}, [categorization])


	useEffect(() => {
		console.log('width changed');
		if (chart) {
			chart.clear();
			createNewChart();
		}
	}, [width])

	useEffect(() => {
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

export default BarChartWrapper;