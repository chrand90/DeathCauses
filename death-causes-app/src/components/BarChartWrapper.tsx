import React, { useRef, useState, useEffect } from 'react';
import BarChart from './BarChart';
import { DataSet } from './PlottingData';

interface BarChartWrapperProps {
	database: DataSet
}

const BarChartWrapper = (props: BarChartWrapperProps) => { //class ChartWrapper extends React.PureComponent<any,any> {
	const database = props.database;
	console.log(database);
	const chartArea = useRef(null);
	const [chart, setChart] = useState<BarChart | null>(null);
	const { width } = useWindowSize();

	const createNewChart = function () {
		setChart(new BarChart(chartArea.current, database));
	}


	useEffect(() => {
		if (chart) {
			chart.clear();
			createNewChart();
		}
	}, [width])

	useEffect(() => {
		if (chart) {
			chart?.clear()
			createNewChart();
		}
	}, [database]);

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

export default BarChartWrapper;