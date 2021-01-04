
import React, { MouseEvent } from 'react';
import { Col, Container, Row } from 'reactstrap';
import './App.css';
import FrequencyTable from './components/database/Age';
import Deathcause from './components/database/Deathcause';
import { ProbabilityOfDeathCauseCalculation } from './components/database/ProbabilityOfDeathCauseCalculation';
import { RiskFactorGroup } from './components/database/RickFactorGroup';
import { RiskRatioTable } from './components/database/RiskRatioTable';
import Header from './components/Header';
import QuestionMenu from './components/QuestionMenu';
import VizWindow from './components/VizWindow';
import Factors, { FactorAnswers } from './models/Factors';
import causesData from './resources/Causes.json';


interface AppState {
  factorAnswersSubmitted: FactorAnswers | null,
  factorDatabase: any,
}

class App extends React.Component<any, AppState> {



  constructor(props: any) {
    super(props);

    this.state = {
      factorAnswersSubmitted: null,
      factorDatabase: null
    }
    //this.handleChange = this.handleChange.bind(this)
    this.handleSuccessfulSubmit = this.handleSuccessfulSubmit.bind(this)
    //this.handleIgnoreFactor = this.handleIgnoreFactor.bind(this)
  };

  handleSuccessfulSubmit(factorAnswers: FactorAnswers): void {
    this.setState({
      factorAnswersSubmitted: factorAnswers
    }, () => {this.calculateRR()})
  }

  calculateRR() {
    let database = this.state.factorDatabase
    let calc = new ProbabilityOfDeathCauseCalculation();
    for (var key in database) {
      if (database.hasOwnProperty(key)) {
        if (this.state.factorAnswersSubmitted) {
          console.log(database[key as keyof typeof database].deathCauseName)
          console.log(calc.calculate(this.state.factorAnswersSubmitted, 10, 100, database[key as keyof typeof database]))
        }
      }
    }
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

    for (var key in database) {
      if (database.hasOwnProperty(key)) {
        console.log(database[key as keyof typeof database])
        res.push(new Deathcause(database[key as keyof typeof database], key))
      }
    }

    this.setState({
      factorDatabase: res
    })
  }

  componentDidMount() {
    this.loadFactorDatabase()
  }


  renderQuestionMenu() {
    return (
      <QuestionMenu
        handleSuccessfulSubmit={this.handleSuccessfulSubmit} />
    );
  }

  renderVizWindow() {
    return (
      <VizWindow factorAnswersSubmitted={this.state.factorAnswersSubmitted} />
    );
  }

  render() {
    console.log('Renders App')
    return (
      <div className="App">
        <Header />
        <Container fluid>
          <Row>
            <Col lg={4} xl={3} style={{ padding: '0px' }}>
              {this.renderQuestionMenu()}
            </Col>
            <Col lg={8} xl={9} style={{ padding: '0px' }}>
              {this.state.factorAnswersSubmitted ? this.renderVizWindow() : "yolo"}
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

}

export default App;
