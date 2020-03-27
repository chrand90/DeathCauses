import React, { Component } from 'react';
import BarChart from './BarChart';

export default class ChartWrapper extends Component {
	componentDidMount() {
		new BarChart(this.refs.chart, this.props.database)
	}

	render() {
		return <div ref="chart"></div>
	}
}