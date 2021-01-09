
import React from 'react';
import { Col, Container, Row } from 'reactstrap';
import './App.css';
import Deathcause from './components/database/Deathcause';
import { ProbabilityOfDeathCauseCalculation } from './components/database/ProbabilityOfDeathCauseCalculation';
import Header from './components/Header';
import QuestionMenu from './components/QuestionMenu';
import VizWindow from './components/VizWindow';
import Factors, { FactorAnswers } from './models/Factors';
import causesData from './resources/Causes.json';


interface AppState {
  factorAnswersSubmitted: FactorAnswers,
}

class App extends React.Component<any, AppState> {



  constructor(props: any) {
    super(props);

    this.state = {
      factorAnswersSubmitted: new Factors(null).getFactorsAsStateObject(),
    }
    //this.handleChange = this.handleChange.bind(this)
    this.handleSuccessfulSubmit = this.handleSuccessfulSubmit.bind(this)
    //this.handleIgnoreFactor = this.handleIgnoreFactor.bind(this)
  };

  handleSuccessfulSubmit(factorAnswers: FactorAnswers): void {
    this.setState({
      factorAnswersSubmitted: factorAnswers
    }, () => { })
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
