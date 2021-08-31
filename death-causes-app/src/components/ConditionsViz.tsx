import { observer } from 'mobx-react';
import React from 'react';
import { ConditionsRes } from '../models/updateFormNodes/FinalSummary/ConditionSummary';
import RootStore, {  withStore } from '../stores/rootStore';
import BarChartWrapper from './BarChart/BarChartWrapper';
import { ConditionVizFlavor } from '../stores/UIStore';
import { DataSet } from './PlottingData';
import ConditionsBarChartSettings from './BarChart/ConditionsBarChartSettings';
import { createHandleChangeFunction } from './Helpers';


interface ConditionsResProps {
	conditionRes: ConditionsRes,
	store: RootStore
}

class ConditionsVizWithoutStore extends React.PureComponent<ConditionsResProps> {

	constructor(props: ConditionsResProps){
		super(props);
	}

	getDataSet(): DataSet{
		if(this.props.store.uIStore.conditionVizFlavor===ConditionVizFlavor.AVERAGE_PROPORTION){
			return Object.values(this.props.conditionRes.averageProportion)
		}
		return Object.values(this.props.conditionRes.probOfHavingWhileDying);
	}

	makeConditionVizFlavorOptions(){
		return (
			<select value={this.props.store.uIStore.conditionVizFlavor} onChange={createHandleChangeFunction<ConditionVizFlavor>(this.props.store.uIStore.setConditionVizFlavor)}>
				{Object.values(ConditionVizFlavor).map((cf,i) => {
					return <option id={"conditionflactor"+i.toString()} key={cf}>{cf}</option>
				})}
			</select>
		)
	}

	render(){
		return (
			<div>
				<p>This graph illustrates the risk of getting certain conditions, regardless of whether one dies from them.</p>
				<p>Type of probability {this.makeConditionVizFlavorOptions()}</p>
				<BarChartWrapper 
				database={this.getDataSet()}
				barChartSettings={new ConditionsBarChartSettings(this.props.store.uIStore.conditionVizFlavor, this.props.store.loadedDataStore.descriptions)}
			/>
			</div>
			
		)
	}
	

}
const ConditionsViz= withStore(observer(ConditionsVizWithoutStore)) 
export default ConditionsViz;