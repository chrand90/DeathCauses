import {json} from "d3";
import React from "react";
import { Col, Container, Row } from "reactstrap";
import "./App.css";
import Header from "./components/Header";
import QuestionMenu from "./components/QuestionMenu";
import VizWindow from "./components/VizWindow";
import  { FactorAnswers } from "./models/Factors";
import RelationLinks, { RelationLinkJson } from "./models/RelationLinks";
import Spinner from "react-bootstrap/Spinner";
import { ComputationState, Visualization } from "./components/Helpers";
import relationLinkFile from "./resources/Relations.json";




interface AppState {
  factorAnswersSubmitted: FactorAnswers | null;
  elementInFocus: string;
  relationLinkData: RelationLinks | null;
  visualization: Visualization;
  computationState: ComputationState;
}

class App extends React.Component<any, AppState> {
  constructor(props: any) {
    super(props);

    this.state = {
      factorAnswersSubmitted: null,
      elementInFocus: "BMI",
      relationLinkData: null,
      visualization: Visualization.NO_GRAPH,
      computationState: ComputationState.READY
    };
    
    this.handleSuccessfulSubmit = this.handleSuccessfulSubmit.bind(this);
    this.orderVisualization = this.orderVisualization.bind(this);
    this.reportChangesToInput = this.reportChangesToInput.bind(this);
    this.reportChangesToComputationState=this.reportChangesToComputationState.bind(this);
  }

  reportChangesToInput(newState: ComputationState=ComputationState.CHANGED){
    this.setState({computationState: newState});
  }

  reportChangesToComputationState(newState: ComputationState){
    this.setState({computationState: newState});
  }

  handleSuccessfulSubmit(factorAnswers: FactorAnswers): void {
    console.log("submitted factoranswers")
    console.log(factorAnswers);
    this.setState({
      factorAnswersSubmitted: factorAnswers,
      computationState: ComputationState.RUNNING
    }, () => {
      if((this.state.visualization!==Visualization.SURVIVAL_GRAPH && this.state.visualization!==Visualization.BAR_GRAPH)){
        this.orderVisualization(this.state.elementInFocus, Visualization.BAR_GRAPH);
      }
    });
  }


  loadRelationLinks() {
    setTimeout(
      () => {
        this.setState({ relationLinkData: new RelationLinks(relationLinkFile as RelationLinkJson)})
      },
      200
    )
  }

  componentDidMount() {
    this.loadRelationLinks()
  }

  orderVisualization(elementInFocus: string, visualizationType: Visualization): void {
    this.setState({ visualization: visualizationType, elementInFocus: elementInFocus} );
  }

  renderQuestionMenu() {
    return (
      <QuestionMenu 
        handleSuccessfulSubmit={this.handleSuccessfulSubmit} 
        relationLinkData={this.state.relationLinkData!}
        orderVisualization={this.orderVisualization}
        reportChanges={this.reportChangesToInput}
        computationState={this.state.computationState}          
    />
    );
  }

  renderVizWindow() {
    return (
      <VizWindow
        factorAnswersSubmitted={this.state.factorAnswersSubmitted}
        relationLinkData={this.state.relationLinkData!}
        elementInFocus={this.state.elementInFocus}
        visualization={this.state.visualization}
        orderVisualization={this.orderVisualization}
        relationLinkRaw={relationLinkFile as RelationLinkJson}
        computationState={this.state.computationState}
        reportChangesToComputationState={this.reportChangesToComputationState}
      />
    );
  }

  render() {
    return (
      <div className="App">
        <Header />
        <Container fluid>
          <Row>
            <Col lg={5} xl={4} style={{ padding: "0px" }}>
              {this.state.relationLinkData!== null ? this.renderQuestionMenu() : <Spinner animation="grow" />}
            </Col>
            <Col lg={7} xl={8} style={{ padding: "0px" }}>
              { this.state.relationLinkData !== null
                ? this.renderVizWindow()
                : <Spinner animation="grow" />}
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

}

export default App;
