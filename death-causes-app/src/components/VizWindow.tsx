import { autorun, IReactionDisposer } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { Form, Tab, Tabs } from "react-bootstrap";
import { ComputationState } from "../stores/ComputationStateStore";
import RootStore, { withStore } from "../stores/rootStore";
import { Visualization } from "../stores/UIStore";
import AdvancedOptionsMenu from "./AdvancedOptions";
import BarChartWrapper from "./BarChartWrapper";
import BarPlotWrapper from "./BarPlotWrapper";
import { SurvivalCurveData } from "./Calculations/SurvivalCurveData";
import { DEATHCAUSES_COLOR, DEATHCAUSES_LIGHT, hideAllToolTips } from "./Helpers";
import { DataRow } from "./PlottingData";
import RelationLinkVizWrapper from "./RelationLinkVizWrapper";
import "./VizWindow.css";
import SummaryView, { SummaryViewWithoutStore, SummaryViewProps } from "./SummaryView";
import { SummaryViewData } from "../models/updateFormNodes/FinalSummary/SummaryView";
import { LifeExpectancyContributions } from "../models/updateFormNodes/FinalSummary/RiskFactorContributionsLifeExpectancy";
import { ConditionsRes } from "../models/updateFormNodes/FinalSummary/ConditionSummary";
import ConditionsViz from "./ConditionsViz";

interface VizWindowProps {
  store: RootStore;
}

interface VizWindowStates {
  riskFactorContributions: DataRow[] | LifeExpectancyContributions;
  survivalCurveData: SurvivalCurveData[];
  summaryViewData: SummaryViewData | null;
  conditionsRes: ConditionsRes | null;
}

class VizWindowWithoutStore extends React.PureComponent<VizWindowProps, VizWindowStates> {
  removeFinishComputationListener: IReactionDisposer | null=null;

  constructor(props: any) {
    super(props);
    this.state = {
      riskFactorContributions: this.props.store.computationStore.riskFactorContributions,
      survivalCurveData: this.props.store.computationStore.survivalCurveData,
      summaryViewData: this.props.store.computationStore.summaryView,
      conditionsRes: this.props.store.computationStore.conditionRes
    }
  }

  componentDidMount(){
    this.removeFinishComputationListener = autorun(()=> {
      if(this.props.store.computationStateStore.computationState===ComputationState.ARTIFICIALLY_SIGNALLING_FINISHED_COMPUTATIONS){
        this.setState({
          riskFactorContributions: this.props.store.computationStore.riskFactorContributions,
          survivalCurveData: this.props.store.computationStore.survivalCurveData,
          summaryViewData: this.props.store.computationStore.summaryView,
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
      case Visualization.BAR_GRAPH: 
      case Visualization.CONDITIONS: {
        return this.state.riskFactorContributions.length>0 || Object.keys(this.state.riskFactorContributions).length>0;
      }
      case Visualization.SUMMARY_VIEW: {
        return this.state.summaryViewData !== null
      }
      case Visualization.SURVIVAL_GRAPH: {
        return true;
      }
      default: {
        return false;
      }
    }
  }

  renderChosenGraph() {
    if(this.isResultsComputed()){
      switch (this.props.store.uIStore.visualization) {
        case Visualization.BAR_GRAPH: {
          return <BarChartWrapper database={this.state.riskFactorContributions}/>
        }
        case Visualization.SUMMARY_VIEW: {
          return <SummaryView data={this.state.summaryViewData}/>
        }
        case Visualization.SURVIVAL_GRAPH: {
          return <BarPlotWrapper data={this.state.survivalCurveData} />
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
          {[Visualization.SURVIVAL_GRAPH,
            Visualization.BAR_GRAPH,
            Visualization.SUMMARY_VIEW,
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
        style={{paddingTop:"18px"}}
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
