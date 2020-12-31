import * as d3 from "d3";
import { json } from "d3";
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
import Factors, {
  FactorAnswers,
  FactorAnswerUnitScalings,
} from "./models/Factors";
import causesData from "./resources/Causes.json";
import HelpJsons from "./models/HelpJsons";

interface AppState {
  hasLoadedFactorAnswers: boolean;
  hasLoadedDatabase: boolean;
  hasLoadedFactorDatabase: boolean;
  factorDatabase: any;
  factorAnswers: FactorAnswers;
  factorAnswersSubmitted: FactorAnswers | null;
  factorAnswerScales: FactorAnswerUnitScalings;
}

class App extends React.Component<any, AppState> {
  factors: Factors;
  helpjsons: HelpJsons;

  constructor(props: any) {
    super(props);

    this.state = {
      hasLoadedFactorAnswers: true,
      hasLoadedDatabase: true,
      hasLoadedFactorDatabase: true,
      factorDatabase: undefined,
      factorAnswers: {},
      factorAnswersSubmitted: null,
      factorAnswerScales: {},
    };
    this.factors = new Factors(null);
    this.helpjsons = {};
    this.handleChange = this.handleChange.bind(this);
    this.handleSuccessfullSubmit = this.handleSuccessfullSubmit.bind(this);
    this.handleIgnoreFactor = this.handleIgnoreFactor.bind(this);
    this.handleChangeUnit = this.handleChangeUnit.bind(this);
  }

  handleSuccessfullSubmit(): void {
    this.setState({
      factorAnswersSubmitted: Object.create(this.state.factorAnswers),
    });
  }

  handleChange(name: string, value: boolean | string | number | null): void {
    this.setState<any>((prevState: { factorAnswers: Factors }) => {
      return {
        factorAnswers: {
          ...prevState.factorAnswers,
          [name]: value,
        },
      };
    });
    console.log(this.state);
  }

  handleChangeUnit(name: string, newUnitName: string): void {
    this.setState(
      (prevState: { factorAnswerScales: FactorAnswerUnitScalings }) => {
        return {
          factorAnswerScales: {
            ...prevState.factorAnswerScales,
            [name]: {
              unitName: newUnitName,
              scale: this.factors.getScalingFactor(name, newUnitName),
            },
          },
        };
      }
    );
  }

  handleIgnoreFactor(name: string): void {
    this.setState<any>((prevState: { factorAnswers: Factors }) => {
      return {
        factorAnswers: {
          ...prevState.factorAnswers,
          [name]: "",
        },
      };
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
    this.loadFactorNames();
  }

  componentDidMount() {
    this.loadFactorDatabase();
    this.setState({
      factorDatabase: causesData,
    });
  }

  loadFactorNames() {
    Promise.all([d3.csv("FactorDatabase.csv"), json("helpjsons.json")]).then(
      (data) => {
        this.factors = new Factors(data[0]);
        this.helpjsons = data[1] as HelpJsons;
        this.setState({
          factorAnswers: this.factors.getFactorsAsStateObject(),
        });
      }
    );
  }

  renderQuestionMenu() {
    return (
      <QuestionMenu
        factorAnswers={this.state.factorAnswers}
        factorAnswerScales={this.state.factorAnswerScales}
        factors={this.factors}
        helpjsons={this.helpjsons}
        handleChange={this.handleChange}
        handleSuccessfullSubmit={this.handleSuccessfullSubmit}
        handleIgnoreFactor={this.handleIgnoreFactor}
        handleChangeUnit={this.handleChangeUnit}
      />
    );
  }

  renderVizWindow() {
    return (
      <VizWindow factorAnswersSubmitted={this.state.factorAnswersSubmitted} />
    );
  }

  render() {
    console.log("Renders App");
    return (
      <div className="App">
        <Header />
        <Container fluid>
          <Row>
            <Col lg={4} xl={3} style={{ padding: "0px" }}>
              {Object.keys(this.state.factorAnswers).length > 0
                ? this.renderQuestionMenu()
                : "Waiting for loading quesitons"}
            </Col>
            <Col lg={8} xl={9} style={{ padding: "0px" }}>
              {this.state.factorAnswersSubmitted
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
