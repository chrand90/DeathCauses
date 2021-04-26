import React from "react";
import "./VizWindow.css";
import BarChartWrapper from "./BarChartWrapper";
import RelationLinkVizWrapper from "./RelationLinkVizWrapper";
import { TEST_DATA, TEST_DATA2, DataSet, DataRow } from "./PlottingData";
import { FactorAnswers } from "../models/Factors";
import RelationLinks, { RelationLinkJson } from "../models/RelationLinks";
import { Visualization } from "./Helpers";
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
import AdvancedOptionsMenu, {
  AdvancedOptions,
  Threading,
} from "./AdvancedOptions";
import Worker from "../models/worker";

interface VizWindowProps {
  factorAnswersSubmitted: FactorAnswers | null;
  relationLinkData: RelationLinks;
  relationLinkRaw: RelationLinkJson;
  elementInFocus: string;
  visualization: Visualization;
  orderVisualization: (elementInFocus: string, vizType: Visualization) => void;
}

const worker = new Worker();

export interface RawDataJson {
  [deathCauseName: string]: DeathCauseJson;
}

interface VizWindowStates {
  database: DataSet | null;
  survivalData: SurvivalCurveData[];
  initializedDatabase: boolean;
  advancedOptions: AdvancedOptions;
  advancedOptionsKey: boolean;
}

class VizWindow extends React.PureComponent<VizWindowProps, VizWindowStates> {
  computerController: ComputeController | null;
  deathcauses: Deathcause[];
  deathCauseCategories: RiskFactorGroupsContainer[];

  constructor(props: any) {
    super(props);
    this.state = {
      database: null,
      survivalData: [],
      initializedDatabase: false,
      advancedOptions: {
        ageFrom: null,
        ageTo: 120,
        threading: Threading.MULTI,
      },
      advancedOptionsKey: false,
    };
    this.updateAdvancedOptions = this.updateAdvancedOptions.bind(this);
    this.computerController = null; //new ComputeController(this.props.relationLinkData, null);
    this.deathcauses = [];
    this.deathCauseCategories = [];
    this.resetAdvancedOptionsMenu = this.resetAdvancedOptionsMenu.bind(this);
  }

  componentDidUpdate(prevProps: VizWindowProps, prevStates: VizWindowStates) {
    if (
      prevProps.factorAnswersSubmitted !== this.props.factorAnswersSubmitted &&
      this.props.factorAnswersSubmitted
    ) {
      this.updateComputerController();
    }
    if (prevStates.advancedOptions !== this.state.advancedOptions) {
      if (this.state.advancedOptions.threading === Threading.SINGLE) {
        this.computerController = new ComputeController(
          this.props.relationLinkData,
          this.state.advancedOptions.ageFrom,
          this.state.advancedOptions.ageTo,
          this.deathcauses,
          this.deathCauseCategories
        );
      } else {
        worker.initializeObject(
          this.props.relationLinkRaw,
          causesData as RawDataJson,
          causesCategoryData as RawDataJson,
          this.state.advancedOptions.ageFrom,
          this.state.advancedOptions.ageTo
        );
      }
      this.updateComputerController();
    }
  }



  updateComputerController() {
    if (this.state.advancedOptions.threading === Threading.SINGLE) {
      this.computerController?.compute(this.props.factorAnswersSubmitted!);
      const a = this.computerController?.computeInnerProbabilities();
      this.setState({ database: a! }, () => {
        const b = this.computerController?.computeSurvivalData();
        this.setState({ survivalData: b! });
      });
    } else {
      const promise: Promise<{
        survivalData: SurvivalCurveData[];
        innerCauses: DataRow[];
      }> = worker.processData(this.props.factorAnswersSubmitted);
      promise.then(({ survivalData, innerCauses }) => {
        this.setState({ survivalData: survivalData, database: innerCauses });
      });
    }
  }

  initializeCauses() {
    const rawData: RawDataJson = causesData as RawDataJson;
    Object.entries(rawData).forEach(([key, deathcause]) => {
      this.deathcauses.push(new Deathcause(deathcause, key));
    });
    const rawCategoryData: RawDataJson = causesCategoryData as RawDataJson;
    Object.entries(rawCategoryData).forEach(([key, deathcause]) => {
      this.deathCauseCategories.push(
        new RiskFactorGroupsContainer(deathcause, key)
      );
    });
  }

  loadFactorDatabase() {
    setTimeout(() => {
      this.initializeCauses();
      if(this.state.advancedOptions.threading===Threading.SINGLE){
        this.computerController = new ComputeController(
          this.props.relationLinkData,
          this.state.advancedOptions.ageFrom,
          this.state.advancedOptions.ageTo,
          this.deathcauses,
          this.deathCauseCategories
        );
      }
      else{
        worker.initializeObject(
          this.props.relationLinkRaw,
          causesData as RawDataJson,
          causesCategoryData as RawDataJson,
          this.state.advancedOptions.ageFrom,
          this.state.advancedOptions.ageTo
        );
      }
      this.setState({ initializedDatabase: true });
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

  updateAdvancedOptions(newOptions: AdvancedOptions) {
    this.setState({ advancedOptions: newOptions });
  }

  renderAdvancedOptionsMenu() {
    return (
      <div
        key={
          "advancedoptionsinstate" + this.state.advancedOptionsKey.toString()
        }
      >
        <AdvancedOptionsMenu
          optionsSubmitted={this.state.advancedOptions}
          updateAdvancedOptions={this.updateAdvancedOptions}
          factorAnswers={this.props.factorAnswersSubmitted}
          reset={this.resetAdvancedOptionsMenu}
        ></AdvancedOptionsMenu>
      </div>
    );
  }

  resetAdvancedOptionsMenu() {
    //this changes the id of the div that contains the advancedoptionsmenu. This forces a full re-rendering of the component
    this.setState((prevState: VizWindowStates) => {
      return {
        advancedOptionsKey: !prevState.advancedOptionsKey,
      };
    });
  }

  renderDataBoundedGraph(
    visualization: Visualization.BAR_GRAPH | Visualization.SURVIVAL_GRAPH
  ) {
    switch (visualization) {
      case Visualization.BAR_GRAPH: {
        return (
          <div>
            {this.state.database ? (
              <BarChartWrapper
                database={this.state.database}
                colorDic={this.props.relationLinkData.getColorDic()}
                rdat={this.props.relationLinkData}
              />
            ) : (
              "Input age to get started"
            )}
          </div>
        );
      }
      case Visualization.SURVIVAL_GRAPH: {
        return <BarPlotWrapper data={this.state.survivalData} />;
      }
    }
  }

  renderChosenGraph() {
    if (!this.state.initializedDatabase) {
      return "Loading database...";
    }
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
    console.log(this.state.database);
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
