import React, { useRef, useState, useEffect } from 'react';
import RelationLinks, { RelationLinkJson } from '../models/RelationLinks';
import RelationLinkViz from './RelationLinkViz';

interface RelationLinkWrapperProps {
	rdat: RelationLinks;
	elementInFocus: string;
}


const RelationLinkWrapper = (props: RelationLinkWrapperProps) => { //class ChartWrapper extends React.PureComponent<any,any> {
	const chartArea = useRef(null);
	const [chart, setChart] = useState<RelationLinkViz | null>(null);
	const { width } = useWindowSize();

	const createNewChart = function () {
		setChart(new RelationLinkViz(chartArea.current, props.rdat, props.elementInFocus));
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

export default RelationLinkWrapper;