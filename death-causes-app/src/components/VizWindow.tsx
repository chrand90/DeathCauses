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
import causesData from '../resources/Causes.json';
import  BarPlotWrapper  from './BarPlotWrapper';
import { Form } from "react-bootstrap";
import { SurvivalCurveData } from './Calculations/SurvivalCurveData';
import { CalculationFacade } from "./Calculations/CalculationsFacade";

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
  survivalData: SurvivalCurveData[];
}

class VizWindow extends React.PureComponent<VizWindowProps, VizWindowStates> {
  computerController: ComputeController | null;
  factorDatabase: Deathcause[] = [];
  
  constructor(props: any) {
    super(props);
    this.state = {
      database: TEST_DATA,
      chosenValue: "Risk factor contributions 1",
      survivalData: [],
    };
    this.computerController=null; //new ComputeController(this.props.relationLinkData, null);
  }

  componentDidUpdate(prevProps: VizWindowProps) {
    if(prevProps.factorAnswersSubmitted!== this.props.factorAnswersSubmitted && this.props.factorAnswersSubmitted){
      console.log("initiating update computercontroller")
      this.updateComputerController()
    }
  }

  updateComputerController(){
    const a= this.computerController?.computeInnerProbabilities(this.props.factorAnswersSubmitted!)
    console.log("new inner causes");
    console.log(a);
    this.setState({database: a!}, () => {
      const b= this.computerController?.computeSurvivalData(this.props.factorAnswersSubmitted!)
      this.setState({survivalData: b!})
    }); 
    // this.computerController?.computeInnerProbabilities(this.props.factorAnswersSubmitted!).then((res) => {
    //   this.setState({database: res},
    //     () => this.computerController?.computeSurvivalData(this.props.factorAnswersSubmitted!).then((res) => {
    //       this.setState({survivalData: res}, () => {
    //         if(  !(this.props.visualization===Visualization.BAR_GRAPH || this.props.visualization=== Visualization.SURVIVAL_GRAPH)){
    //           this.props.orderVisualization(this.props.elementInFocus, Visualization.BAR_GRAPH);
    //         }
    //       })
    //     }))
    // })
  }

  loadFactorDatabase() {
    let database: Deathcause[] = [];
    for (var key in causesData) {
        if (causesData.hasOwnProperty(key)) {
            database.push(new Deathcause(causesData[key as keyof typeof causesData], key))
        }
    }
    const c=new CalculationFacade(database)
    console.log("calculation facade")
    console.log(c);
    this.computerController=new ComputeController(this.props.relationLinkData, null, 120, c);
  }

  componentDidMount() {
      this.loadFactorDatabase()
  }

  renderVisualization() {
      //uses this.state.selcted_visualization and this.props.database and this.props.factor_answers to make the relevant revisualization.
  }

  handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {

    const value: string = event.currentTarget.value;
    switch (value) {
      case "Risk factor contributions 1": {
        this.setState({
          chosenValue: value,
        }, () => this.props.orderVisualization(this.props.elementInFocus, Visualization.BAR_GRAPH));
        break;
      }
      case "Risk factor contributions 2": {
        this.setState({
          database: TEST_DATA2,
          chosenValue: value,
        }, () => this.props.orderVisualization(this.props.elementInFocus, Visualization.BAR_GRAPH));
        break;
      }
      case "Relation graph": {
        this.setState({chosenValue: value}, () => {
        this.props.orderVisualization(this.props.elementInFocus, Visualization.RELATION_GRAPH)});
        break;
      }
      case "Survival curve": {
        this.props.orderVisualization(this.props.elementInFocus, Visualization.SURVIVAL_GRAPH);
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
      case Visualization.SURVIVAL_GRAPH:
        return <BarPlotWrapper data={this.state.survivalData}/>
      case Visualization.NO_GRAPH: {
        return "Input an age to get started"
      }
      default: {
        return <p>'No visualizations'</p>;
      }
    }
  }

  renderSelectOption() {
    return (
        <Form>
            <Form.Group className='visualisation' >
                <Form.Row>
                    <Form.Control className='visualisation' as="select" defaultValue="Choose..." onChange={this.handleChange} style={{height:"40px"}}>
                        <option>Survival curve</option>
                        <option>Risk factor contributions 1</option>
                        <option>Risk factor contributions 2</option>
                        <option>Relation graph</option>
                    </Form.Control>
                </Form.Row>
            </Form.Group>
        </Form >
    )
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
