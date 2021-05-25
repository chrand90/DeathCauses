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
import relationLinkFile from "./resources/Relations.json";
import RootStore, {StoreContext} from "./stores/rootStore";
import {observer} from "mobx-react";

interface AppState {
  factorAnswersSubmitted: FactorAnswers | null;
  elementInFocus: string;
  relationLinkData: RelationLinks | null;
  visualization: Visualization;
}

class AppWithoutObserver extends React.Component<any, AppState> {

  store: RootStore;

  constructor(props: any) {
    super(props);

    this.store=new RootStore();

    this.state = {
      factorAnswersSubmitted: null,
      elementInFocus: "BMI",
      relationLinkData: null,
      visualization: Visualization.NO_GRAPH,
    };
    this.orderVisualization = this.orderVisualization.bind(this);
  }




  orderVisualization(elementInFocus: string, visualizationType: Visualization): void {
    this.setState({ visualization: visualizationType, elementInFocus: elementInFocus} );
  }

  renderQuestionMenu() {
    return (
      <QuestionMenu 
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
        relationLinkRaw={relationLinkFile as RelationLinkJson}
      />
    );
  }

  render() {
    return (
      <div className="App">
        <StoreContext.Provider value={this.store}>
        <Header />
        <Container fluid>
          <Row>
            <Col lg={5} xl={4} style={{ padding: "0px" }}>
              {this.store.loadedQuestionMenuData ?  this.renderQuestionMenu() : <Spinner animation="grow" />}
            </Col>
            <Col lg={7} xl={8} style={{ padding: "0px" }}>
              { this.store.loadedVizWindowData 
                ? this.renderVizWindow()
                : <Spinner animation="grow" />}
            </Col>
          </Row>
        </Container>
        </StoreContext.Provider >
      </div>
    );
  }

}

const App= observer(AppWithoutObserver);
export default App;
