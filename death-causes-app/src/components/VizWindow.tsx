import React from "react";
import "./VizWindow.css";
import BarChartWrapper from "./BarChartWrapper";
import RelationLinkVizWrapper from "./RelationLinkVizWrapper";
import { TEST_DATA, TEST_DATA2, DataSet } from "./PlottingData";
import { FactorAnswers } from "../models/Factors";
import RelationLinks from "../models/RelationLinks";

interface VizWindowProps {
  factorAnswers: FactorAnswers | null;
  relationLinkData: RelationLinks;
  elementInFocus: string;
}

interface VizWindowStates {
  selected_visualization: "testdata" | "testdata2" | "relationGraph";
  database: DataSet;
}

class VizWindow extends React.PureComponent<VizWindowProps, any> {
  counter: number = 0;
  constructor(props: any) {
    super(props);
    this.state = {
      selected_visualization: "testdata",
      database: TEST_DATA,
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
          selected_visualization: event.currentTarget.value,
        });
        break;
      }
      case "testdata2": {
        this.setState({
          database: TEST_DATA2,
          selected_visualization: event.currentTarget.value,
        });
        break;
      }
      case "relationGraph": {
        this.setState({ selected_visualization: event.currentTarget.value });
        break;
      }
      default:
        break;
    }
  };

  renderChosenGraph() {
    switch (this.state.selected_visualization) {
      case "testdata": {
        return <BarChartWrapper database={this.state.database} />;
      }
      case "testdata2": {
        return <BarChartWrapper database={this.state.database} />;
      }
      case "relationGraph": {
        return <RelationLinkVizWrapper rdat={this.props.relationLinkData} elementInFocus={this.props.elementInFocus}/>;
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
          value={this.state.selected_visualization}
        >
          <option value="testdata">TEST_DATA</option>
          <option value="testdata2">TEST_DATA2</option>
          <option value="relationGraph">Relation graph</option>
        </select>
        {this.renderChosenGraph()}
      </div>
    );
  }
}

export default VizWindow;
