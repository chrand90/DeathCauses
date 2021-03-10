import React from "react";
import "./VizWindow.css";
import BarChartWrapper from "./BarChartWrapper";
import RelationLinkVizWrapper from "./RelationLinkVizWrapper";
import { TEST_DATA, TEST_DATA2, DataSet } from "./PlottingData";
import { FactorAnswers } from "../models/Factors";
import RelationLinks from "../models/RelationLinks";
import { Visualization } from "./Helpers";
import ComputeController from "../models/updateFormNodes/UpdateFormController";
import Deathcause from "./database/Deathcause";
import causesData from "../resources/Causes.json";
import BarPlotWrapper from "./BarPlotWrapper";
import { Form } from "react-bootstrap";
import { SurvivalCurveData } from "./Calculations/SurvivalCurveData";
import { CalculationFacade } from "./Calculations/CalculationsFacade";

interface VizWindowProps {
  factorAnswersSubmitted: FactorAnswers | null;
  relationLinkData: RelationLinks;
  elementInFocus: string;
  visualization: Visualization;
  orderVisualization: (elementInFocus: string, vizType: Visualization) => void;
}

interface VizWindowStates {
  database: DataSet | null;
  survivalData: SurvivalCurveData[];
  initializedDatabase: boolean;
}

class VizWindow extends React.PureComponent<VizWindowProps, VizWindowStates> {
  computerController: ComputeController | null;
  factorDatabase: Deathcause[] = [];

  constructor(props: any) {
    super(props);
    this.state = {
      database: null,
      survivalData: [],
      initializedDatabase: false,
    };
    this.computerController = null; //new ComputeController(this.props.relationLinkData, null);
  }

  componentDidUpdate(prevProps: VizWindowProps) {
    if (
      prevProps.factorAnswersSubmitted !== this.props.factorAnswersSubmitted &&
      this.props.factorAnswersSubmitted
    ) {
      console.log("initiating update computercontroller");
      this.updateComputerController();
    }
  }

  updateComputerController() {
    const a = this.computerController?.computeInnerProbabilities(
      this.props.factorAnswersSubmitted!
    );
    this.setState({ database: a! }, () => {
      const b = this.computerController?.computeSurvivalData(
        this.props.factorAnswersSubmitted!
      );
      this.setState({ survivalData: b! });
    });
  }

  loadFactorDatabase() {
    setTimeout(() => {
      let database: Deathcause[] = [];
      for (var key in causesData) {
        if (causesData.hasOwnProperty(key)) {
          database.push(
            new Deathcause(causesData[key as keyof typeof causesData], key)
          );
        }
      }
      const c = new CalculationFacade(database);
      this.computerController = new ComputeController(
        this.props.relationLinkData,
        null,
        120,
        c
      );
      this.setState({initializedDatabase: true});
    }, 500);
  }

  componentDidMount() {
    this.loadFactorDatabase();
  }

  renderVisualization() {
    //uses this.state.selcted_visualization and this.props.database and this.props.factor_answers to make the relevant revisualization.
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

  renderChosenGraph() {
    if(!this.state.initializedDatabase){
      return "Loading database..."
    }
    switch (this.props.visualization) {
      case Visualization.BAR_GRAPH: {
        return (
          <div>
            {this.state.database ? (
              <BarChartWrapper
                database={this.state.database}
                colorDic={this.props.relationLinkData.getColorDic()}
              />
            ) : (
              "Input age to get started"
            )}
          </div>
        );
      }
      case Visualization.RELATION_GRAPH: {
        return (
          <RelationLinkVizWrapper
            rdat={this.props.relationLinkData}
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
      case Visualization.SURVIVAL_GRAPH:
        return <BarPlotWrapper data={this.state.survivalData} />;
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
                return <option value={d}>{d}</option>;
              })}
            </select>
          </Form.Row>
        </Form.Group>
      </Form>
    );
  }

  render(): React.ReactNode {
    console.log(this.props);
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

export default VizWindow;
