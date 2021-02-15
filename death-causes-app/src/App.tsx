import {json} from "d3";
import React, { MouseEvent } from "react";
import { Col, Container, Row } from "reactstrap";
import "./App.css";
import FrequencyTable from "./components/database/Age";
import Deathcause from "./components/database/Deathcause";
import { RiskFactorGroup } from "./components/database/RickFactorGroup";
import { RiskRatioTable } from "./components/database/RiskRatioTable";
import Header from "./components/Header";
import QuestionMenu from "./components/QuestionMenu";
import VizWindow from "./components/VizWindow";
import Factors, { FactorAnswers } from "./models/Factors";
import causesData from "./resources/Causes.json";
import RelationLinks, { RelationLinkJson } from "./models/RelationLinks";

interface AppState {
  factorAnswersSubmitted: FactorAnswers | null;
  factorDatabase: any;
  elementInFocus: string;
  relationLinkData: RelationLinks | null;
}

class App extends React.Component<any, AppState> {

  constructor(props: any) {
    super(props);

    this.state = {
      factorAnswersSubmitted: null,
      factorDatabase: null,
      elementInFocus: "BMI",
      relationLinkData: null,
    };
    this.handleSuccessfulSubmit = this.handleSuccessfulSubmit.bind(this);
    this.changeFocus = this.changeFocus.bind(this);
  }

  changeFocus(newElementInFocus: string) {
    this.setState<any>({ elementInFocus: newElementInFocus });
  }

  handleSuccessfulSubmit(factorAnswers: FactorAnswers): void {
    this.setState({
      factorAnswersSubmitted: Object.create(factorAnswers),
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

  loadFactorDatabase() {
    let res: Deathcause[] = [];
    let database = causesData;
    // console.log(database.BreastCancer.RiskFactorGroups[0])

    // for (var key in database) {
    //   if (database.hasOwnProperty(key)) {
    //     console.log(database[key as keyof typeof database])
    //     res.push(new Deathcause(database[key as keyof typeof database], key))
    //   }
    // }

    // console.log(res)
    // console.log(age)
  }

  loadRelationLinks() {
    Promise.all([
      json("AffectPointers.json")
    ]).then((data) => {

      this.setState({ relationLinkData: new RelationLinks(data[0] as RelationLinkJson)});
    });
  }

  componentDidMount() {
    this.loadFactorDatabase();
    this.loadRelationLinks()
    this.setState({
      factorDatabase: causesData,
    });
  }

  renderQuestionMenu() {
    return (
      <QuestionMenu handleSuccessfulSubmit={this.handleSuccessfulSubmit} />
    );
  }

  renderVizWindow() {
    return (
      <VizWindow
        factorAnswersSubmitted={this.state.factorAnswersSubmitted}
        relationLinkData={this.state.relationLinkData!}
        elementInFocus={this.state.elementInFocus}
        changeElementInFocus={this.changeFocus}
      />
    );
  }
  render() {
    console.log("Renders App");
    return (
      <div className="App">
        <Header />
        <Container fluid>
          <Row>
            <Col lg={5} xl={4} style={{ padding: "0px" }}>
              {this.renderQuestionMenu()}
            </Col>
            <Col lg={7} xl={8} style={{ padding: "0px" }}>
              {this.state.factorAnswersSubmitted &&
              this.state.relationLinkData !== null
                ? this.renderVizWindow()
                : "yolo"}
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default App;
