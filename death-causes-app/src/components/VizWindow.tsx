import React from "react";
import "./VizWindow.css";
import BarChartWrapper from "./BarChartWrapper";
import RelationLinkVizWrapper from "./RelationLinkVizWrapper";
import { DataSet, DataRow } from "./PlottingData";
import { FactorAnswers, FactorAnswerUnitScalings } from "../models/Factors";
import RelationLinks, { RelationLinkJson } from "../models/RelationLinks";
import { hideAllToolTips, Visualization } from "./Helpers";
import ComputeController from "../models/updateFormNodes/UpdateFormController";
import Deathcause, {
  DeathCauseJson,
  RiskFactorGroupsContainer,
} from "./database/Deathcause";
import causesData from "../resources/Causes.json";
import causesCategoryData from "../resources/CategoryCauses.json";
import BarPlotWrapper from "./BarPlotWrapper";
import { Form } from "react-bootstrap";
import { SurvivalCurveData } from "./Calculations/SurvivalCurveData";
import AdvancedOptionsMenu from "./AdvancedOptions";
import Worker from "../models/worker";
import RootStore, {withStore} from "../stores/rootStore";
import { observer } from "mobx-react";
import { autorun, IReactionDisposer } from "mobx";
import { ComputationState } from "../stores/ComputationStateStore";

interface VizWindowProps {
  elementInFocus: string;
  visualization: Visualization;
  orderVisualization: (elementInFocus: string, vizType: Visualization) => void;
  store: RootStore;
}

interface VizWindowStates {
  riskFactorContributions: DataRow[];
  survivalCurveData: SurvivalCurveData[];
}


class VizWindowWithoutStore extends React.PureComponent<VizWindowProps, VizWindowStates> {
  removeFinishComputationListener: IReactionDisposer | null=null;

  constructor(props: any) {
    super(props);
    this.state = {
      riskFactorContributions: this.props.store.computationStore.riskFactorContributions,
      survivalCurveData: this.props.store.computationStore.survivalCurveData,
    }
  }

  componentDidMount(){
    this.removeFinishComputationListener = autorun(()=> {
      if(this.props.store.computationStateStore.computationState===ComputationState.ARTIFICIALLY_SIGNALLING_FINISHED_COMPUTATIONS){
        this.setState({
          riskFactorContributions: this.props.store.computationStore.riskFactorContributions,
          survivalCurveData: this.props.store.computationStore.survivalCurveData
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

  componentDidUpdate(prevProps: VizWindowProps) {
    if(prevProps.visualization!== this.props.visualization){
      hideAllToolTips();
    }
  }


  handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value: string = event.currentTarget.value;
    switch (value) {
      case Visualization.BAR_GRAPH: {
        this.props.orderVisualization(
          this.props.elementInFocus,
          Visualization.BAR_GRAPH
        );
        break;
      }
      case Visualization.RELATION_GRAPH: {
        this.props.orderVisualization(
          this.props.elementInFocus,
          Visualization.RELATION_GRAPH
        );
        break;
      }
      case Visualization.SURVIVAL_GRAPH: {
        this.props.orderVisualization(
          this.props.elementInFocus,
          Visualization.SURVIVAL_GRAPH
        );
        break;
      }
      default:
        break;
    }
  };

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
                colorDic={this.props.store.loadedDataStore.rdat.getColorDic()}
                rdat={this.props.store.loadedDataStore.rdat}
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
    switch (this.props.visualization) {
      case Visualization.BAR_GRAPH:
      case Visualization.SURVIVAL_GRAPH: {
        return (
          <div>
            {this.renderAdvancedOptionsMenu()}
            {this.renderDataBoundedGraph(this.props.visualization)}
          </div>
        );
      }
      case Visualization.RELATION_GRAPH: {
        return (
          <RelationLinkVizWrapper
            rdat={this.props.store.loadedDataStore.rdat}
            elementInFocus={this.props.elementInFocus}
            changeElementInFocus={(newFocus: string) => {
              this.props.orderVisualization(
                newFocus,
                Visualization.RELATION_GRAPH
              );
            }}
          />
        );
      }
      case Visualization.NO_GRAPH: {
        return "Input an age to get started";
      }
      default: {
        return <p>'No visualizations'</p>;
      }
    }
  }

  renderSelectOption() {
    const orgval = this.props.visualization;
    return (
      <Form>
        <Form.Group className="visualisation">
          <Form.Row>
            <select
              value={orgval}
              onChange={(ev) => {
                const val = ev.currentTarget.value;
                this.props.orderVisualization(
                  this.props.elementInFocus,
                  val as Visualization
                );
              }}
            >
              {[
                Visualization.SURVIVAL_GRAPH,
                Visualization.RELATION_GRAPH,
                Visualization.BAR_GRAPH,
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
      <div className="vizwindow">
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
