import { autorun, IReactionDisposer } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { Tab, Tabs } from "react-bootstrap";
import { ConditionsRes } from "../models/updateFormNodes/FinalSummary/ConditionSummary";
import { DeathCauseContributions } from "../models/updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy";
import { EVALUATION_UNIT } from "../stores/AdvancedOptionsStore";
import { ComputationState } from "../stores/ComputationStateStore";
import RootStore, { withStore } from "../stores/rootStore";
import { Visualization } from "../stores/UIStore";
import AdvancedOptionsMenu from "./AdvancedOptions";
import BarChartWrapper from "./BarChart/BarChartWrapper";
import DeathCauseBarChartSettings from "./BarChart/DeathCauseBarChartSettings";
import BarPlotWrapper from "./BarPlotWrapper";
import { SurvivalCurveData } from "./Calculations/SurvivalCurveData";
import ConditionsViz from "./ConditionsViz";
import SummaryView from "./SummaryView";
import "./VizWindow.css";

interface VizWindowProps {
  store: RootStore;
}

interface VizWindowStates {
  riskFactorContributions: DeathCauseContributions;
  conditionsRes: ConditionsRes | null;
}

class VizWindowWithoutStore extends React.PureComponent<VizWindowProps, VizWindowStates> {
  removeFinishComputationListener: IReactionDisposer | null=null;

  constructor(props: any) {
    super(props);
    this.state = {
      riskFactorContributions: this.props.store.computationStore.riskFactorContributions,
      conditionsRes: this.props.store.computationStore.conditionRes
    }
  }

  componentDidMount(){
    this.removeFinishComputationListener = autorun(()=> {
      if(this.props.store.computationStateStore.computationState===ComputationState.ARTIFICIALLY_SIGNALLING_FINISHED_COMPUTATIONS){
        this.setState({
          riskFactorContributions: this.props.store.computationStore.riskFactorContributions,
          conditionsRes: this.props.store.computationStore.conditionRes
        }, () => {
          this.props.store.computationStateStore.setComputationState(ComputationState.READY);
        })
      }
    })
  }

  componentWillUnmount(){
    if(this.removeFinishComputationListener){
      this.removeFinishComputationListener();
    }
  }

  //this wrapping in a div is necesseray to secure  smoother transition
  renderAdvancedOptionsMenu() {
    return (
      <div>
        <AdvancedOptionsMenu></AdvancedOptionsMenu>
      </div>
    );
  }

  waitingMessage(){
    return (<p>Input your age to get started</p>)
  }

  isResultsComputed(){
    switch (this.props.store.uIStore.visualization) {
      case Visualization.CONDITIONS: {
        return this.state.conditionsRes !== null && Object.keys(this.state.conditionsRes).length > 0;
      }
      case Visualization.BAR_GRAPH: 
      case Visualization.SURVIVAL_GRAPH:
      case Visualization.SUMMARY_VIEW: {
        return Object.keys(this.state.riskFactorContributions.costPerCause).length > 0
      }
      default: {
        return false;
      }
    }
  }

  getSurvivalCurveInputData(): SurvivalCurveData[] {
    return this.state.riskFactorContributions.ages.map((e, i) => {return {age: e, prob: this.state.riskFactorContributions.survivalProbs[i]}})
  }

  renderChosenGraph() {
    if(this.isResultsComputed()){
      switch (this.props.store.uIStore.visualization) {
        case Visualization.BAR_GRAPH: {
          let usesLifeExpectancy = this.props.store.computationStore.riskFactorContributions.evaluationUnit === EVALUATION_UNIT.YEARS_LOST
          return (
          <BarChartWrapper 
            database={this.state.riskFactorContributions.costPerCause}
            barChartSettings={new DeathCauseBarChartSettings(false, usesLifeExpectancy, this.props.store.loadedDataStore.descriptions)}
          />)
        }
        case Visualization.SUMMARY_VIEW: {
          return <SummaryView riskFactorContributions={this.state.riskFactorContributions}/>
        }
        case Visualization.SURVIVAL_GRAPH: {
          return <BarPlotWrapper data={this.getSurvivalCurveInputData()} />
        }
        case Visualization.CONDITIONS: {
          return <ConditionsViz conditionRes={this.state.conditionsRes ? this.state.conditionsRes : {
            averageProportion: {},
            probOfHavingWhileDying: {}
        }} />
        }
      }
    }
    return this.waitingMessage();
  }

  renderSelectOption() {
    const orgval = this.props.store.uIStore.visualization;
    return (
      <div>
        <Tabs
        id="select-visualization"
        activeKey={this.props.store.uIStore.visualization}
        onSelect={(k:any) => this.props.store.uIStore.setVisualization(k)}
        className="mb-3"
        >
          {[Visualization.SUMMARY_VIEW,
            Visualization.SURVIVAL_GRAPH,
            Visualization.BAR_GRAPH,
            Visualization.CONDITIONS
          ].map((d: string) => {
            return (
              <Tab eventKey={d} title={d}></Tab>
            );
          })}
        </Tabs>
      </div>
    );
  }

  render(): React.ReactNode {
    return (
      <div 
        onClick={() => {
          this.props.store.uIStore.tooltipHider()
        }}
        style={{paddingTop:"18px", minHeight:"calc(100vh - 72px)"}}
      >
        <h3> Visualization </h3>
        {this.renderSelectOption()}
        {this.renderAdvancedOptionsMenu()}
        {this.renderChosenGraph()}
      </div>
    );
  }
}

const VizWindow= withStore(observer(VizWindowWithoutStore)) 
export default VizWindow;
