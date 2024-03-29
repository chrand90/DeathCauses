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
import BarChartSettings from "./BarChart/BarChartSettings";
import { isFunctionTypeNode } from "typescript";


export interface SummaryViewProps {
    store: RootStore,
    riskFactorContributions: DeathCauseContributionsAndChanges
}

export class SummaryViewWithoutStore extends React.Component<SummaryViewProps> {

    constructor(props: SummaryViewProps) {
        super(props)
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
                        <Card className="my-1 mx-auto bg-light" style={{}}> 
                            <CardHeader><h5 style={{ fontWeight: 600 }}>{lollipopChartFormatting.getHeaderTitle()}</h5></CardHeader>
                            <LollipopChart data={this.getLollipopChartData()} formatting={lollipopChartFormatting}/>
                        </Card>
        )
    }

    isContributionsEmpty(barChartSettings: BarChartSettings){
        if(!barChartSettings.getUseLifeExpectancy()){
            return false;
        }
        if("any cause" in this.props.riskFactorContributions.costPerCause){
            return Object.values(this.props.riskFactorContributions.costPerCause["any cause"].innerCauses).reduce((a,b)=>a+b,0)<1e-12;
        }
        return false;
    }

    getRiskFactorContributionExplanation(barChartSettings: BarChartSettings, emptyContributions: boolean){
        if(barChartSettings.getUseLifeExpectancy()){
            if(emptyContributions){
                return (
                    <p>
                        <span style={{color:"grey"}}>
                            Without answering more questions, no potential death of yours can be assigned to a known risk factor.
                        </span>
                    </p>
                )
            }
            return (
                <p>
                    The bar shows how much longer you would live if you didn't die of known risk factors. Each section represents a risk factor.
                </p>
            )
        }
        else{
            return (
                <p>
                    The bar represents your total probability of dying. The sections show how much each factor contributes to your total probability of dying.
                </p>
            )  
        }
    }

    renderRiskFactorContributions() {
        let barChartSettings = new SimpleDeathCauseBarChartSettings(this.props.riskFactorContributions.evaluationUnit as EVALUATION_UNIT === EVALUATION_UNIT.YEARS_LOST,
            this.props.store.loadedDataStore.descriptions)
        const emptyContributions=this.isContributionsEmpty(barChartSettings);
        return (                
                <Card className="bg-light ">
                    <CardHeader><h4>Contributions from risk factors</h4></CardHeader>
                    <CardBody>
                        {this.getRiskFactorContributionExplanation(barChartSettings, emptyContributions)}
                        {emptyContributions ? null :
                            <BarChartWrapper database={this.props.riskFactorContributions.costPerCause} barChartSettings={barChartSettings}/> 
                        }
                    </CardBody>
                </Card>
        )
    }

    render() {
        if (this.props.store.computationStore.allChanges.length === 0) {
            return (
                <div><span>Data not loaded</span></div>
            )
        }

        const colwidth = this.props.store.uIStore.windowWidth>650  ? "70%" : "100%"
        return (
            <Fragment>
                <Col className="mx-auto my-1" style={{ width: colwidth }}> 
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
                    {this.renderRiskFactorContributions()}
                    {this.renderLollipopChart()}
                </Col>
            </Fragment>
        )
    }
}

const SummaryView = withStore(observer(SummaryViewWithoutStore))
export default SummaryView