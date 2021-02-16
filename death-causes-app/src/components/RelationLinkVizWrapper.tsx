import React, { useRef, useState, useEffect } from 'react';
import RelationLinks, { RelationLinkJson } from '../models/RelationLinks';
import RelationLinkViz from './RelationLinkViz';
import './RelationLinkVizWrapper.css';
import DropdownButton from "react-bootstrap/DropdownButton";

interface RelationLinkWrapperProps {
	rdat: RelationLinks;
	elementInFocus: string;
	changeElementInFocus: (d:string) => void,
}

function createHandleChangeFunction(changeElementInFocus: (d:string) => void): (ev: React.ChangeEvent<HTMLSelectElement>) => void {
	const handleChangeFunction = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const value: string = event.currentTarget.value;
		changeElementInFocus(value);
	}
	return handleChangeFunction
}




const RelationLinkWrapper = (props: RelationLinkWrapperProps) => { //class ChartWrapper extends React.PureComponent<any,any> {
	const chartArea = useRef(null);
	const elementInFocus= props.elementInFocus;
	const [chart, setChart] = useState<RelationLinkViz | null>(null);
	const { width } = useWindowSize();

	const createNewChart = function () {
		setChart(new RelationLinkViz(chartArea.current, props.rdat, props.elementInFocus, props.changeElementInFocus));
	}

	useEffect(() => {
		console.log('width changed');
		if (chart) {
			chart.clear();
			createNewChart();
		}
	}, [width])

	useEffect(() => {
		createNewChart();
	}, []);

	useEffect(() => {
		console.log('dataset changed');
		if (chart) {
			chart.clear();
			createNewChart()
		}
	}, [elementInFocus]);

	return (
		<div>
			<p>Graph showing how we use <select value={elementInFocus} onChange={createHandleChangeFunction(props.changeElementInFocus)}>
				{props.rdat.getAllPossibleNodes().map((d:string) => {
					return <option value={d}>{d}</option>
				})}
				</select> in the model</p>
		<div className="containerRelationLink" ref={chartArea} id="relationlinkcontainer"/>
		</div>
	)

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

export default RelationLinkWrapper;