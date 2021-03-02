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
import { Visualization } from "./components/Helpers";




interface AppState {
  factorAnswersSubmitted: FactorAnswers | null;
  elementInFocus: string;
  relationLinkData: RelationLinks | null;
  visualization: Visualization;
}

class App extends React.Component<any, AppState> {
  constructor(props: any) {
    super(props);

    this.state = {
      factorAnswersSubmitted: null,
      elementInFocus: "BMI",
      relationLinkData: null,
      visualization: Visualization.NO_GRAPH
    };
    
    this.handleSuccessfulSubmit = this.handleSuccessfulSubmit.bind(this);
    this.orderVisualization = this.orderVisualization.bind(this);
  }

  handleSuccessfulSubmit(factorAnswers: FactorAnswers): void {
    console.log("submitted factoranswers")
    console.log(factorAnswers);
    this.setState({
      factorAnswersSubmitted: factorAnswers,
    });
  }

  // loadFactorAnswers() {
  //   this.setState({
  //     factorAnswers: new Factors()
  //   })
  //   // load_factor_answers.then((loaded_factor_answers)=> this.setState({hasLoadedFactorAnswers: false, factor_answers:loaded_factor_answers})).
  //   // This will load the factor answers and then it will update the rendered view using setState.
  // }

  // loadDatabase() {
  //   // load_data.then((loaded_data)=> this.setState({hasLoadedDatabase: false, factor_answers:loaded_data})).
  //   // This will load the data and then it will update the rendered view using setState.
  //   // this.setState({ database: json('../compile/Causes_for_json'), hasLoadedDatabase: true });
  // }


  loadRelationLinks() {
    Promise.all([
      json("Relations.json")
    ]).then((data) => {
      this.setState({ relationLinkData: new RelationLinks(data[0] as RelationLinkJson)
    })});
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
