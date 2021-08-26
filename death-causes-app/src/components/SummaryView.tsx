import * as d3 from "d3";
import { observer } from "mobx-react";
import React, { Fragment, useEffect, useState } from "react";
import { Card, Col, Row } from "react-bootstrap";
import { CardBody, CardHeader, CardTitle } from "reactstrap";
import { DataPoint } from "../models/updateFormNodes/FinalSummary/SummaryView";
import RootStore, { withStore } from "../stores/rootStore";
import BarChartWrapper from "./BarChartWrapper";
import ChangeView from "./ChangeView";
import LollipopChart, { LollipopChartFormatting } from "./LollipopChart";
import { probabilityLollipopChartFormatter } from "./ProbabilityLollipopChartFormatter";
import RangeSliders from "./RangerSlidersSummaryView";


export interface SummaryViewProps {
    store: RootStore
}

export class SummaryViewWithoutStore extends React.Component<SummaryViewProps> {

    lifeExpectancySentence(){
        if("Age" in this.props.store.computationStore.submittedFactorAnswers &&
            this.props.store.loadedDataStore.loadedLifeExpectancies){
            const age=this.props.store.computationStore.submittedFactorAnswers["Age"]
            if(age===""){
                return(
                    <p>
                        The average life expectancy from birth is: {this.props.store.loadedDataStore.lifeExpectancies[0].toFixed(1)} 
                    </p>
                )
            }
            else{
                const ageNumber= Math.floor(typeof age==="string" ? parseFloat(age) : age)
                if(age>110){
                    return null
                }
                return (
                    <p>
                        The average life expectancy for someone as {ageNumber>83 ? "old" : "young"} as you is: {this.props.store.loadedDataStore.lifeExpectancies[ageNumber].toFixed(1)} 
                    </p>
                )
            }
        }
        return null
    }

    render() {
        if (this.props.store.computationStore.summaryView === null) {
            return (
                <div><span>Data not loaded</span></div>
            )
        }
        let summaryViewData = this.props.store.computationStore.summaryView

        const lifeExpentancy = summaryViewData.lifeExpentancyData.lifeExpentancy.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
        const textColor = summaryViewData.lifeExpentancyData.lifeExpentancy > 70 ? "green" : "red"

        const colwidth= this.props.store.uIStore.windowWidth>501 ? "70%" : "100%" 

        return (
            <Fragment>
                <Col className="mx-auto my-1" style={{ width: colwidth }}>
                    <Card className="my-1 mx-auto bg-light " style={{}}>
                        <CardBody>
                            <h3>Your life expectancy is: <span style={{ color: textColor }}>{lifeExpentancy}</span> years</h3>
                            <p></p>
                            {this.lifeExpectancySentence()}
                            <RangeSliders summaryViewData={summaryViewData}/>
                        </CardBody>
                    </Card>
                    <Card className="my-1 mx-auto bg-light " style={{}}>
                        <CardHeader><h4>Effect of your change of input</h4></CardHeader>
                        <CardBody>
                            <ChangeView></ChangeView>
                        </CardBody>
                    </Card>
                </Col>
                <Col className="mx-auto my-1" style={{ width: colwidth }}>
                    <Card className="bg-light ">
                        <CardHeader><h4>Risk Factors</h4></CardHeader>
                        <CardBody>
                            <p>The bar below represents all the time you lose to known risk factors.</p>
                            <BarChartWrapper database={this.props.store.computationStore.riskFactorContributions} simpleVersion={true} />
                        </CardBody>
                    </Card>
                </Col>
                {/* <Row className="mx-auto my-1" style={{ width: "70%" }}>
                    <Col className="col-xs-12 col-sm-12 col-md-12 col-lg-12 col-xl-6">
                        <Card className="bg-light " style={{}} >
                            <CardHeader><h5 style={{ fontWeight: 600 }}>Years lost per cause</h5></CardHeader>
                            <LollipopChart data={summaryViewData.yearsLostToDeathCauses} descriptions={this.props.store.loadedDataStore.descriptions} formatting={probabilityLollipopChartFormatter}/>
                            <table style={{ width: "60%", margin: "auto" }}>
                                <thead>
                                    <th style={{ textAlign: "left" }}>Death cause</th>
                                    <th style={{ textAlign: "right" }}>Years lost</th>
                                </thead>
                                <tbody>
                                    {
                                        summaryViewData.yearsLostToDeathCauses.map(element => {
                                            return <tr><td style={{ textAlign: "left" }}>
                                                {element.name}</td><td style={{ textAlign: "right" }}>{element.value.toPrecision(2)}</td></tr>
                                        })
                                    }
                                </tbody>
                            </table>
                        </Card>
                    </Col>
                    <Col className="col-xs-12 col-sm-12 col-md-12 col-lg-12 col-xl-12">
                        <Card className="bg-light" style={{}}> 
                            <CardHeader><h5 style={{ fontWeight: 600 }}>Most likely cause of death</h5></CardHeader>
                            <LollipopChart data={summaryViewData.probabiliiesOfDyingOfEachDeathCause} descriptions={this.props.store.loadedDataStore.descriptions} formatting={probabilityLollipopChartFormatter}/>
                        </Card>
                    </Col>
                </Row> */}
            </Fragment>
        )
    }
}

const SummaryView = withStore(observer(SummaryViewWithoutStore))
export default SummaryView