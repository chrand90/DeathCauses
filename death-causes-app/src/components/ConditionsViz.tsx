import { observer } from 'mobx-react';
import React, { useEffect, useRef, useState } from 'react';

import "./BarChartWrapper.css";

import { ConditionsRes } from '../models/updateFormNodes/FinalSummary/ConditionSummary';


interface ConditionsResProps {
	conditionRes: ConditionsRes
}

const ConditionsViz = observer((props: ConditionsResProps) => { //class ChartWrapper extends React.PureComponent<any,any> {
	console.log(props.conditionRes)
	return (
		<div className="container">
			hello
		</div>
	)

});


export default ConditionsViz;