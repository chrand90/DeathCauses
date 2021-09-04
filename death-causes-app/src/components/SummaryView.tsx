import { observer } from "mobx-react";
import React, { Fragment } from "react";
import { Card, Col, Row } from "react-bootstrap";
import { CardBody, CardHeader } from "reactstrap";
import { NodeType } from "../models/RelationLinks";
import { DeathCauseContributionsAndChanges } from "../models/updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy";
import { DataPoint } from "../models/updateFormNodes/FinalSummary/SummaryView";
import RootStore, { withStore } from "../stores/rootStore";
import BarChartWrapper from "./BarChart/BarChartWrapper";
import ChangeView from "./ChangeView";
import LollipopChart from "./LollipopChart";
import { getLollipopChartFormatting } from "./LollipopChartFormatters";
import RangeSliders, { RangeSliderInput } from "./RangerSlidersSummaryView";
import SimpleDeathCauseBarChartSettings from "./BarChart/SimpleDeathCauseBarChartSettings"
import { EVALUATION_UNIT } from "../stores/AdvancedOptionsStore";


export interface SummaryViewProps {
    store: RootStore,
    riskFactorContributions: DeathCauseContributionsAndChanges
}

export class SummaryViewWithoutStore extends React.Component<SummaryViewProps> {
    colwidth = ""

    constructor(props: SummaryViewProps) {
        super(props)
        this.colwidth = this.props.store.uIStore.windowWidth>501 ? "70%" : "100%"
    }
    
    getLollipopChartData(): DataPoint[] {
        let data = this.props.store.computationStore.riskFactorContributions.costPerCause
        let lollipopChartData: DataPoint[] = []
        this.props.store.loadedDataStore.rdat.sortedNodes[NodeType.CAUSE].forEach(element => {
            lollipopChartData.push({name: element, value: data[element].totalProb})
        });
        return lollipopChartData.sort((a,b) => b.value - a.value).slice(0,5);
    }

    getSurvivalCurveSlidersData(): RangeSliderInput {
        return {
            ages: this.props.riskFactorContributions.ages,
            survivalProbs: [1, ...this.props.riskFactorContributions.survivalProbs]
        }
    }

    lifeExpectancySentence(){
        if(!("Age" in this.props.store.computationStore.submittedFactorAnswers) ||
            !this.props.store.loadedDataStore.loadedLifeExpectancies) {
                return null
        }

        const lifeExpentancy = this.props.riskFactorContributions.baseLifeExpectancy.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
        const age=this.props.store.computationStore.submittedFactorAnswers["Age"]
        const ageNumber = age === "" ? 0: Math.floor(typeof age==="string" ? parseFloat(age) : age)
        const textColor = this.props.riskFactorContributions.baseLifeExpectancy > this.props.store.loadedDataStore.lifeExpectancies[ageNumber] ? "green" : "red"
        if(age===""){
            return (
                <Fragment>
                <h3>
                    Your life expectancy is:{" "}
                    <span style={{ color: textColor }}>{lifeExpentancy}</span>{" "}
                    years
                </h3>
                <p>
                    The average life expectancy from birth is:{" "}
                    {this.props.store.loadedDataStore.lifeExpectancies[0].toFixed(
                    1
                    )}
                </p>
                </Fragment>
            );
        }
        else{
            return (
                <Fragment>
                <h3>
                    Your life expectancy is:{" "}
                    <span style={{ color: textColor }}>{lifeExpentancy}</span>{" "}
                    years
                </h3>
                {age < 110 && (<p>
                    The average life expectancy for someone as{" "}
                    {ageNumber > 83 ? "old" : "young"} as you is:{" "}
                    {this.props.store.loadedDataStore.lifeExpectancies[
                    ageNumber
                    ].toFixed(1)}
                </p>)}
                </Fragment>
            );
        }
    }

    getLifeExpectancyHeader() {

        return (
          <Fragment>

            {this.lifeExpectancySentence()}
          </Fragment>
        );
    }

    renderLollipopChart() {
        const lollipopChartFormatting = getLollipopChartFormatting(this.props.riskFactorContributions.evaluationUnit)
        return (
        <Row className="mx-auto my-1" style={{ width: "70%" }}>
                    <Col className="col-xs-12 col-sm-12 col-md-12 col-lg-12 col-xl-12">
                        <Card className="bg-light" style={{}}> 
                            <CardHeader><h5 style={{ fontWeight: 600 }}>{lollipopChartFormatting.getHeaderTitle()}</h5></CardHeader>
                            <LollipopChart data={this.getLollipopChartData()} formatting={lollipopChartFormatting}/>
                        </Card>
                    </Col>
                </Row>
        )
    }

    renderRiskFactorContributions() {
        let barChartSettings = new SimpleDeathCauseBarChartSettings(this.props.riskFactorContributions.evaluationUnit as EVALUATION_UNIT === EVALUATION_UNIT.YEARS_LOST,
            this.props.store.loadedDataStore.descriptions)
        return (                
            <Col className="mx-auto my-1" style={{ width: this.colwidth }}>
                <Card className="bg-light ">
                    <CardHeader><h4>Contribution from risk Factors</h4></CardHeader>
                    <CardBody>
                        <p>The bar below represents your total probability of dying. Each section shows how much each factor contribute to your total probability of dying.</p>
                        <BarChartWrapper database={this.props.riskFactorContributions.costPerCause} barChartSettings={barChartSettings}/> 
                    </CardBody>
                </Card>
            </Col>
        )
    }

    render() {
        if (this.props.store.computationStore.allChanges.length === 0) {
            return (
                <div><span>Data not loaded</span></div>
            )
        }

        return (
            <Fragment>
                <Col className="mx-auto my-1" style={{ width: this.colwidth }}> 
                    <Card className="my-1 mx-auto bg-light " style={{}}>
                        <CardBody>
                            {this.lifeExpectancySentence()}
                        </CardBody>
                    </Card>
                    <Card className="my-1 mx-auto bg-light " style={{}}>
                        <CardBody>
                        <ChangeView />
                        </CardBody>
                    </Card>
                    <Card className="my-1 mx-auto bg-light " style={{}}>
                        <CardBody>
                        <RangeSliders data={this.getSurvivalCurveSlidersData()}/>
                        </CardBody>
                    </Card>
                </Col>
                {this.renderRiskFactorContributions()}
                {this.renderLollipopChart()}
            </Fragment>
        )
    }
}

const SummaryView = withStore(observer(SummaryViewWithoutStore))
export default SummaryView