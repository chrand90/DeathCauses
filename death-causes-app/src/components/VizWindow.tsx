import React from "react";
import "./VizWindow.css";
import BarChartWrapper from "./BarChartWrapper";
import RelationLinkVizWrapper from "./RelationLinkVizWrapper";
import { TEST_DATA, TEST_DATA2, DataSet } from "./PlottingData";
import { FactorAnswers } from "../models/Factors";
import RelationLinks from "../models/RelationLinks";
import { Visualization } from "./Helpers";

interface VizWindowProps {
  factorAnswersSubmitted: FactorAnswers | null;
  relationLinkData: RelationLinks;
  elementInFocus: string;
  visualization: Visualization;
  orderVisualization: (elementInFocus: string, vizType: Visualization) => void;
}

interface VizWindowStates {
  database: DataSet;
  chosenValue: string;
}

class VizWindow extends React.PureComponent<VizWindowProps, VizWindowStates> {
  counter: number = 0;
  constructor(props: any) {
    super(props);
    this.state = {
      database: TEST_DATA,
      chosenValue: "testdata",
    };
  }

  renderVisualization() {
    //uses this.state.selcted_visualization and this.props.database and this.props.factor_answers to make the relevant revisualization.
  }

  handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {

    const value: string = event.currentTarget.value;
    switch (value) {
      case "testdata": {
        this.setState({
          database: TEST_DATA,
          chosenValue: value,
        }, () => this.props.orderVisualization(this.props.elementInFocus, Visualization.BAR_GRAPH));
        break;
      }
      case "testdata2": {
        this.setState({
          database: TEST_DATA2,
          chosenValue: value,
        }, () => this.props.orderVisualization(this.props.elementInFocus, Visualization.BAR_GRAPH));
        break;
      }
      case "relationGraph": {
        this.setState({chosenValue: value}, () => {
        this.props.orderVisualization(this.props.elementInFocus, Visualization.RELATION_GRAPH)});
        break;
      }
      default:
        break;
    }
  };

  renderChosenGraph() {
    switch (this.props.visualization) {
      case Visualization.BAR_GRAPH: {
        return <BarChartWrapper database={this.state.database} />;
      }
      case Visualization.RELATION_GRAPH: {
        return (
          <RelationLinkVizWrapper
            rdat={this.props.relationLinkData}
            elementInFocus={this.props.elementInFocus}
            changeElementInFocus={(newFocus: string) => {this.props.orderVisualization(newFocus, Visualization.RELATION_GRAPH)}}
          />
        );
      }
      default: {
        return <p>'No visualizations'</p>;
      }
    }
  }

  render(): React.ReactNode {
    console.log(this.props);
    return (
      <div className="vizwindow">
        <h4> Visualization Menu </h4>

        <select
          id="visualizations"
          onChange={this.handleChange}
          value={this.state.chosenValue}
        >
          <option value="testdata">TEST_DATA</option>
          <option value="testdata2">TEST_DATA2</option>
          <option value="relationGraph">Relation graph</option>
        </select>
        <hr></hr>
        {this.renderChosenGraph()}
      </div>
    );
  }
}

export default VizWindow;
