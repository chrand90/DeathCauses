import { observer } from 'mobx-react';
import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../stores/rootStore';
import RelationLinkViz from './RelationLinkViz';
import './RelationLinkVizWrapper.css';
import { useHistory } from "react-router-dom";
import  Button  from 'react-bootstrap/Button';
import { Container, Spinner } from "react-bootstrap";

const DESCRIPTION_LENGTH=22;

function createHandleChangeFunction(changeElementInFocus: (d:string) => void): (ev: React.ChangeEvent<HTMLSelectElement>) => void {
	const handleChangeFunction = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const value: string = event.currentTarget.value;
		changeElementInFocus(value);
	}
	return handleChangeFunction
}




const RelationLinkWrapper = observer(() => { //class ChartWrapper extends React.PureComponent<any,any> {
	const chartArea = useRef(null);
	const store = useStore();
	let history = useHistory();
	const [chart, setChart] = useState<RelationLinkViz | null>(null);

	const onRedirectToLibrary = (name: string) => {
		history.push("/model/"+name)
	} 

	const createNewChart = function () {
		if(store.loadedDataStore.loadedRelationLinks){
			setChart(new RelationLinkViz(
				chartArea.current, 
				store.loadedDataStore.rdat,
				store.loadedDataStore.descriptions,
				store.relationLinkVizStore.elementInFocus, 
				store.relationLinkVizStore.setElementInFocus));
		}
	}

	useEffect(() => {
		if (chart) {
			chart.clear();
			createNewChart();
		}
	}, [store.uIStore.windowWidth])

	useEffect(() => {
		createNewChart();
		return () => {
			chart?.clear();
		}
	}, [store.loadedDataStore.loadedRelationLinks]);

	useEffect(() => {
		if (chart) {
			chart.update(store.relationLinkVizStore.elementInFocus);
		}
	}, [store.relationLinkVizStore.elementInFocus]);

	if(!store.loadedDataStore.loadedRelationLinks){
		return (<div><Spinner animation="grow"></Spinner><small>Loading database</small></div>)
	}

	return (
		<div>
			<Container>
				<h1>
					Relation between risk factors and death causes
				</h1>
				<p>Graph showing how we use <select value={store.relationLinkVizStore.elementInFocus} onChange={createHandleChangeFunction(store.relationLinkVizStore.setElementInFocus)}>
					{store.loadedDataStore.rdat.getAllPossibleNodes().map(
						(d:string) => {
							return [d,store.loadedDataStore.descriptions.getDescription(d,DESCRIPTION_LENGTH)]
						}
					 ).sort(function(a,b){return a[1].localeCompare(b[1])}).map(
						 ([nodeComputationName, nodeHumanName]) => {
							return <option value={nodeComputationName}>{nodeHumanName}</option>
						 }
					 )
					}
					</select> in the model</p>
				<p> Visit its page in the library <Button 
					className="text-link-button" 
					variant="link"
					onClick={()=> onRedirectToLibrary(store.relationLinkVizStore.elementInFocus)}> 
					{store.loadedDataStore.descriptions.getDescription(store.relationLinkVizStore.elementInFocus, DESCRIPTION_LENGTH)} </Button></p>
			</Container>
			<div style={{overflowX:"auto", width: "100%", maxWidth:"1600px", margin:"auto"}}>
				<div className="containerRelationLink" ref={chartArea} id="relationlinkcontainer"/>
			</div>
		</div>
			
	)

});


export default RelationLinkWrapper;