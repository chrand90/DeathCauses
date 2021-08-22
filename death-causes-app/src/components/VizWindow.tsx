import { autorun, IReactionDisposer } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { Form } from "react-bootstrap";
import { ComputationState } from "../stores/ComputationStateStore";
import RootStore, { withStore } from "../stores/rootStore";
import { Visualization } from "../stores/UIStore";
import AdvancedOptionsMenu from "./AdvancedOptions";
import BarChartWrapper from "./BarChartWrapper";
import BarPlotWrapper from "./BarPlotWrapper";
import { SurvivalCurveData } from "./Calculations/SurvivalCurveData";
import { hideAllToolTips } from "./Helpers";
import { DataRow } from "./PlottingData";
import RelationLinkVizWrapper from "./RelationLinkVizWrapper";
import "./VizWindow.css";
import SummaryView, { SummaryViewWithoutStore, SummaryViewProps } from "./SummaryView";
import { SummaryViewData } from "../models/updateFormNodes/FinalSummary/SummaryView";

interface VizWindowProps {
  store: RootStore;
}

interface VizWindowStates {
  riskFactorContributions: DataRow[];
  survivalCurveData: SurvivalCurveData[];
  summaryViewData: SummaryViewData | null;
}

class VizWindowWithoutStore extends React.PureComponent<VizWindowProps, VizWindowStates> {
  removeFinishComputationListener: IReactionDisposer | null=null;

  constructor(props: any) {
    super(props);
    this.state = {
      riskFactorContributions: this.props.store.computationStore.riskFactorContributions,
      survivalCurveData: this.props.store.computationStore.survivalCurveData,
      summaryViewData: this.props.store.computationStore.summaryView
    }
  }

  componentDidMount(){
    this.removeFinishComputationListener = autorun(()=> {
      if(this.props.store.computationStateStore.computationState===ComputationState.ARTIFICIALLY_SIGNALLING_FINISHED_COMPUTATIONS){
        this.setState({
          riskFactorContributions: this.props.store.computationStore.riskFactorContributions,
          survivalCurveData: this.props.store.computationStore.survivalCurveData,
          summaryViewData: this.props.store.computationStore.summaryView
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


  renderAdvancedOptionsMenu() {
    return (
      <div>
        <AdvancedOptionsMenu></AdvancedOptionsMenu>
      </div>
    );
  }

  renderDataBoundedGraph(
    visualization: Visualization.BAR_GRAPH | Visualization.SURVIVAL_GRAPH
  ) {
    switch (visualization) {
      case Visualization.BAR_GRAPH: {
        return (
          <div>
            {this.state.riskFactorContributions.length>0 ? (
              <BarChartWrapper
                database={this.state.riskFactorContributions}
              />
            ) : (
              "Input age to get started"
            )}
          </div>
        );
      }
      case Visualization.SURVIVAL_GRAPH: {
        return <BarPlotWrapper data={this.state.survivalCurveData} />;
      }
    }
  }

  renderChosenGraph() {
    switch (this.props.store.uIStore.visualization) {
      case Visualization.BAR_GRAPH:
      case Visualization.SURVIVAL_GRAPH: {
        return (
          <div>
            {this.renderAdvancedOptionsMenu()}
            {this.renderDataBoundedGraph(this.props.store.uIStore.visualization)}
          </div>
        );
      }
      case Visualization.RELATION_GRAPH: {
        return (
          <RelationLinkVizWrapper/>
        );
      }
      case Visualization.NO_GRAPH: {
        return "Input an age to get started";
      }
      case Visualization.SUMMARY_VIEW: {
        if (this.state.summaryViewData === null) {
          return (<h3>Answer questions and compute to show results</h3>)
        }
        return (
          <SummaryView data={this.state.summaryViewData}/>
        )
      }
      default: {
        return <p>'No visualizations'</p>;
      }
    }
  }

  renderSelectOption() {
    const orgval = this.props.store.uIStore.visualization;
    return (
      <Form>
        <Form.Group className="visualisation">
          <Form.Row>
            <select
              value={orgval}
              onChange={(ev) => {
                const val = ev.currentTarget.value;
                this.props.store.uIStore.setVisualization(
                  val as Visualization
                );
              }}
            >
              {[
                Visualization.SURVIVAL_GRAPH,
                Visualization.RELATION_GRAPH,
                Visualization.BAR_GRAPH,
                Visualization.SUMMARY_VIEW

              ].map((d: string) => {
                return (
                  <option value={d} key={d}>
                    {d}
                  </option>
                );
              })}
            </select>
          </Form.Row>
        </Form.Group>
      </Form>
    );
  }

  render(): React.ReactNode {
    return (
      <div onClick={() => {
        this.props.store.uIStore.tooltipHider()
      }}>
        <h4> Visualization Menu </h4>
        {this.renderSelectOption()}
        <hr></hr>
        {this.renderChosenGraph()}
      </div>
    );
  }
}

const VizWindow= withStore(observer(VizWindowWithoutStore)) 
export default VizWindow;
