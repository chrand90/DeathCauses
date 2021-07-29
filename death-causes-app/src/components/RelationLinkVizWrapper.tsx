import { observer } from 'mobx-react';
import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../stores/rootStore';
import RelationLinkViz from './RelationLinkViz';
import './RelationLinkVizWrapper.css';

interface RelationLinkWrapperProps {
}

function createHandleChangeFunction(changeElementInFocus: (d:string) => void): (ev: React.ChangeEvent<HTMLSelectElement>) => void {
	const handleChangeFunction = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const value: string = event.currentTarget.value;
		changeElementInFocus(value);
	}
	return handleChangeFunction
}




const RelationLinkWrapper = observer((props: RelationLinkWrapperProps) => { //class ChartWrapper extends React.PureComponent<any,any> {
	const chartArea = useRef(null);
	const store = useStore();
	const [chart, setChart] = useState<RelationLinkViz | null>(null);

	const createNewChart = function () {
		setChart(new RelationLinkViz(
			chartArea.current, 
			store.loadedDataStore.rdat,
			store.loadedDataStore.descriptions,
			store.relationLinkVizStore.elementInFocus, 
			store.relationLinkVizStore.setElementInFocus));
	}

	useEffect(() => {
		console.log('width changed');
		if (chart) {
			chart.clear();
			createNewChart();
		}
	}, [store.uIStore.windowWidth])

	useEffect(() => {
		createNewChart();
		return () => {
			console.log("indside unmounter hook");
			console.log(chart);
			chart?.clear();
		}
	}, []);

	useEffect(() => {
		console.log('dataset changed');
		if (chart) {
			chart.update(store.relationLinkVizStore.elementInFocus);
		}
	}, [store.relationLinkVizStore.elementInFocus]);

	return (
		<div>
			<p>Graph showing how we use <select value={store.relationLinkVizStore.elementInFocus} onChange={createHandleChangeFunction(store.relationLinkVizStore.setElementInFocus)}>
				{store.loadedDataStore.rdat.getAllPossibleNodes().map((d:string) => {
					return <option value={d}>{store.loadedDataStore.descriptions.getDescription(d,20)}</option>
				})}
				</select> in the model</p>
		<div className="containerRelationLink" ref={chartArea} id="relationlinkcontainer"/>
		</div>
	)

});


export default RelationLinkWrapper;