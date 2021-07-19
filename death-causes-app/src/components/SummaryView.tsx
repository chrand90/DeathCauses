import { observer } from "mobx-react";
import React, { Fragment, useEffect, useState } from "react";
import { Card, Col, Row } from "react-bootstrap";
import { CardBody, CardHeader } from "reactstrap";
import RootStore, { withStore } from "../stores/rootStore";
import BarChartWrapper from "./BarChartWrapper";
import ChangeView from "./ChangeView";
import LollipopChart from "./LollipopChart";
import RangeSliders from "./RangerSlidersSummaryView";


export interface SummaryViewProps {
    store: RootStore
}

export class SummaryViewWithoutStore extends React.Component<SummaryViewProps> {

    render() {
        if (this.props.store.computationStore.summaryView === null) {
            return (
                <div><span>Data not loaded</span></div>
            )
        }
        let summaryViewData = this.props.store.computationStore.summaryView

        const lifeExpentancy = summaryViewData.lifeExpentancyData.lifeExpentancy.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
        const textColor = summaryViewData.lifeExpentancyData.lifeExpentancy > 70 ? "green" : "red"

        return (
            <Fragment>
                <Col className="mx-auto my-1" style={{ width: "70%" }}>
                    <Card className="my-1 mx-auto bg-light " style={{}}>
                        <CardBody>
                            <h3>Your life expectancy is: <span style={{ color: textColor }}>{lifeExpentancy}</span> years</h3>
                            <p></p>
                            <h5>The average life expentancy is: 70</h5>
                            <RangeSliders/>
                        </CardBody>
                    </Card>
                    <Card className="my-1 mx-auto bg-light " style={{}}>
                        <CardBody>
                            <p>Effect of your change of input</p>
                            <ChangeView></ChangeView>
                        </CardBody>
                    </Card>
                </Col>
                <Col className="mx-auto my-1" style={{ width: "70%" }}>
                    <Card className="bg-light " style={{}}>
                        <CardHeader><h4>Contribution from risk Factors</h4></CardHeader>
                        <CardBody>
                            <p className="mx-5">The bar below represents your total probability of dying. Each section shows how much each factor contribute to your total probability of dying.</p>
                            <BarChartWrapper database={this.props.store.computationStore.riskFactorContributions} simpleVersion={true} />
                        </CardBody>
                    </Card>
                </Col>
                <Row className="mx-auto my-1" style={{ width: "70%" }}>
                    <Col className="pr-1 ">
                        <Card className="bg-light " style={{}} >
                            <CardHeader><h5 style={{ fontWeight: 600 }}>Years lost per cause</h5></CardHeader>
                            <LollipopChart data={summaryViewData.yearsLostToDeathCauses} />
                            {/* <table style={{ width: "60%", margin: "auto" }}>
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
                            </table> */}
                        </Card>
                    </Col>
                    <Col className="pl-1">
                        <Card className="bg-light" style={{}}> {/*backgroundColor: 'rgba(50, 50, 200, 0.1)'*/}
                            <CardHeader><h5 style={{ fontWeight: 600 }}>Most likely cause of death</h5></CardHeader>
                            <LollipopChart data={summaryViewData.probabiliiesOfDyingOfEachDeathCause} />
                            {/* <table style={{ width: "60%", margin: "auto" }}>
                                <thead>
                                    <th style={{ textAlign: "left" }}>Death cause</th>
                                    <th style={{ textAlign: "right" }}>Probability</th>
                                </thead>
                                <tbody>
                                    {
                                        summaryViewData.probabiliiesOfDyingOfEachDeathCause.map(element => {
                                            return <tr><td style={{ textAlign: "left" }}>
                                                {element.name}</td><td style={{ textAlign: "right" }}>{(element.value * 100).toPrecision(3) + "%"}</td></tr>
                                        })
                                    }
                                </tbody>
                            </table> */}
                        </Card>
                    </Col>
                </Row>
            </Fragment>
        )
    }
}

const SummaryView = withStore(observer(SummaryViewWithoutStore))
export default SummaryView