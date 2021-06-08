import React, { Fragment } from "react";
import { Button } from "react-bootstrap";
import { Card, Col, Row } from "react-bootstrap";
import { CardBody, CardFooter, CardHeader } from "reactstrap";
import RelationLinks, { NodeToColor } from "../models/RelationLinks";
import { SummaryViewData } from "../models/updateFormNodes/FinalSummary/SummaryView";
import BarChartWrapperSummary from "./BarChartSummaryWrapper";
import { Visualization } from "./Helpers";
import LollipopChart from "./LollipopChart";
import Treemap from "./Treemap";


export interface SummaryViewProps {
    data: SummaryViewData,
    colorDic: NodeToColor,
    rdat: RelationLinks,
    orderVisualisationCB: Function
}

export class SummaryView extends React.Component<SummaryViewProps> {

    render() {
        const lifeExpentancy = this.props.data.lifeExpentancyData.lifeExpentancy.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
        const textColor = this.props.data.lifeExpentancyData.lifeExpentancy > 70 ? "green" : "red"
        return (
            <Fragment>
                <Col className="mx-auto my-1" style={{ width: "70%" }}>
                    <Card className="my-1 mx-auto bg-light " style={{}}>
                        <CardBody>
                            <h3>Your life expectancy is: <span style={{ color: textColor }}>{lifeExpentancy}</span> years</h3>
                            <p></p>
                            <h5>The average life expentancy is: 70</h5>
                            <p>
                                There is a <span style={{ fontWeight: 700 }}>90% </span>probability that you will live to be
                                <span style={{ fontWeight: 700 }}> {this.props.data.lifeExpentancyData.ninetyPercentProbability} </span>
                            </p>
                            {this.props.data.lifeExpentancyData.probabilityOfTurning100 &&
                                <p>
                                    There is a <span style={{ fontWeight: 700 }}>{(this.props.data.lifeExpentancyData.probabilityOfTurning100 * 100).toPrecision(2)}% </span>
                                    probability that you will live to be at least <span style={{ fontWeight: 700 }}>100</span>.
                        </p>
                            }
                        </CardBody>
                    </Card>
                </Col>
                <Col className="mx-auto my-1" style={{ width: "70%" }}>
                    <Card className="bg-light " style={{}}>
                        <CardHeader><h4>Risk factor contribution</h4></CardHeader>
                        <CardBody>
                            <BarChartWrapperSummary rdat={this.props.rdat} colorDic={this.props.colorDic} database={this.props.data.dataSet} />
                        </CardBody>
                    </Card>
                </Col>
                <Row className="mx-auto my-1" style={{ width: "70%" }}>
                    <Col className="pr-1 ">
                        <Card className="bg-light " style={{}} >
                            <CardHeader><h5 style={{ fontWeight: 600 }}>Years lost per cause</h5></CardHeader>
                            <table style={{ width: "60%", margin: "auto" }}>
                                <thead>
                                    <th style={{ textAlign: "left" }}>Death cause</th>
                                    <th style={{ textAlign: "right" }}>Years lost</th>
                                </thead>
                                <tbody>
                                    {
                                        this.props.data.yearsLostToDeathCauses.map(element => {
                                            return <tr><td style={{ textAlign: "left" }}>
                                                {element.name}</td><td style={{ textAlign: "right" }}>{element.value.toPrecision(2)}</td></tr>
                                        })
                                    }
                                </tbody>
                            </table>
                        </Card>
                    </Col>
                    <Col className="pl-1">
                        <Card className="bg-light" style={{}}> {/*backgroundColor: 'rgba(50, 50, 200, 0.1)'*/}
                            <CardHeader><h5 style={{ fontWeight: 600 }}>Most likely cause of death</h5></CardHeader>
                            <LollipopChart data={this.props.data.probabiliiesOfDyingOfEachDeathCause}/>
                            <table style={{ width: "60%", margin: "auto" }}>
                                <thead>
                                    <th style={{ textAlign: "left" }}>Death cause</th>
                                    <th style={{ textAlign: "right" }}>Probability</th>
                                </thead>
                                <tbody>
                                    {
                                        this.props.data.probabiliiesOfDyingOfEachDeathCause.map(element => {
                                            return <tr><td style={{ textAlign: "left" }}>
                                                {element.name}</td><td style={{ textAlign: "right" }}>{(element.value * 100).toPrecision(3) + "%"}</td></tr>
                                        })
                                    }
                                </tbody>
                            </table>
                        </Card>
                    </Col>
                </Row>
            </Fragment>
        )
    }
}
