import React from 'react';
import './App.css';
import Header from './components/Header';
import QuestionMenu from './components/QuestionMenu';
// import VizWindow from './Components/VizWindow.js';
import { Row, Col } from 'reactstrap';
import { json } from 'd3';
import causesData from './resources/Causes.json'
import Factors from './models/Factors';

interface AppState {
  hasLoadedFactorAnswers: boolean,
  hasLoadedDatabase: boolean,
  hasLoadedFactorDatabase: boolean,
  factorDatabase: any,
  factorAnswers: Factors
  factorAnswersSubmitted: Factors|null
}

class App extends React.Component<any, AppState> {
  constructor(props: any) {
    super(props);

    this.state  = {
      hasLoadedFactorAnswers: true,
      hasLoadedDatabase: true,
      hasLoadedFactorDatabase: true,
      factorDatabase: undefined,
      factorAnswers: new Factors(),
      factorAnswersSubmitted: null
    }

    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  };

  handleSubmit(event: Event): void {
    event.preventDefault()
    this.setState({
      factorAnswersSubmitted: this.state.factorAnswers
    })
  }

  handleChange(event: React.FormEvent<HTMLInputElement>): void {
    var value: any
    const { name, type } = event.currentTarget
    type === "checkbox" ? value = event.currentTarget.checked : value = event.currentTarget.value
    this.setState<any>((prevState: { factorAnswers: Factors }) => {
      return {
        factorAnswers: {
          ...prevState.factorAnswers,
          [name]: value
        }
      }
    })
    console.log(this.state)
  }

  loadFactorAnswers() {
    // load_factor_answers.then((loaded_factor_answers)=> this.setState({hasLoadedFactorAnswers: false, factor_answers:loaded_factor_answers})).
    // This will load the factor answers and then it will update the rendered view using setState.
  }

  loadDatabase() {
    // load_data.then((loaded_data)=> this.setState({hasLoadedDatabase: false, factor_answers:loaded_data})).
    // This will load the data and then it will update the rendered view using setState.
    this.setState({ database: json('../compile/Causes_for_json'), hasLoadedDatabase: true });
  }

  loadFactorDatabase() {
    // load_factor_db.then((loaded_factor_data=> this.setState({hasLoadedFactorDatabase: false, factor_answers:loaded_factor_database})).
    // This will load the data and then it will update the rendered view using setState.
  }

  componentDidMount() {
    this.setState({
      factorDatabase: causesData
    }
    )
  }

  renderQuestionMenu() {
    return (
      // <div>QuestionMenu</div>
      <QuestionMenu factors={this.state.factorAnswers} handleChange={this.handleChange} handleSubmit={this.handleSubmit} />
    );
  }

  renderVizWindow() {
    return (
      <div>VizWindowDog</div>
      // <VizWindow database={this.state.database} factorAnswersSubmitted={this.state.factorAnswersSubmitted} />
    );
  }

  render() {
    return (
      <div className="App">
        <Header />
        <Row>
          <Col md={3} xs={3} lg={3} sm={3} xl={3}>
            {this.state.hasLoadedFactorAnswers && this.state.hasLoadedFactorDatabase ? this.renderQuestionMenu() : "Waiting for loading quesitons"}
          </Col>
          <Col md={9} xs={9} lg={9} sm={9} xl={9}>
            {this.state.hasLoadedDatabase && this.state.hasLoadedFactorAnswers ? this.renderVizWindow() : "Waiting for loading quesitons and database"}
          </Col>
        </Row>
      </div>
    );
  }

}

export default App;
