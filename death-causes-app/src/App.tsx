import * as d3 from 'd3';
import React, { MouseEvent } from 'react';
import { Col, Row } from 'reactstrap';
import './App.css';
import FrequencyTable from './components/database/Age';
import Deathcause from './components/database/Deathcause';
import { RiskFactorGroup } from './components/database/RickFactorGroup';
import { RiskRatioTable } from './components/database/RiskRatioTable';
import Header from './components/Header';
import QuestionMenu from './components/QuestionMenu';
import VizWindow from './components/VizWindow';
import Factors, { StateObject } from './models/Factors';
import causesData from './resources/Causes.json';

interface AppState {
  hasLoadedFactorAnswers: boolean,
  hasLoadedDatabase: boolean,
  hasLoadedFactorDatabase: boolean,
  factorDatabase: any,
  factorAnswers: StateObject | null
  factorAnswersSubmitted: StateObject | null
}

class App extends React.Component<any, AppState> {
  constructor(props: any) {
    super(props);

    this.state = {
      hasLoadedFactorAnswers: true,
      hasLoadedDatabase: true,
      hasLoadedFactorDatabase: true,
      factorDatabase: undefined,
      factorAnswers: null,
      factorAnswersSubmitted: null
    }

    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  };

  handleSubmit(event: MouseEvent): void {
    event.preventDefault()
    this.setState({
      factorAnswersSubmitted: Object.create(this.state.factorAnswers)
    })
  }

  handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    var value: boolean | string | number
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
    this.loadFactorNames()
  }

  componentDidMount() {
    this.loadFactorDatabase()
    this.setState({
      factorDatabase: causesData
    })
  }

  loadFactorNames() {
    d3.csv('FactorDatabase.csv').then(data => { this.setState({ factorAnswers: new Factors(data).getFactorsAsStateObject() }) });
  }

  renderQuestionMenu() {
    return (
      <QuestionMenu factors={this.state.factorAnswers} handleChange={this.handleChange} handleSubmit={this.handleSubmit} />
    );
  }

  renderVizWindow() {
    return (
      <VizWindow factorAnswersSubmitted={this.state.factorAnswersSubmitted} />
    );
  }

  render() {
    return (
      <div className="App">
        <Header />
        <Row>
          <Col md={3} xs={3} lg={3} sm={3} xl={3} style={{ padding: '0px' }}>
            {this.state.factorAnswers ? this.renderQuestionMenu() : "Waiting for loading quesitons"}
          </Col>
          <Col md={9} xs={9} lg={9} sm={9} xl={9} style={{ padding: '0px' }}>
            {this.state.factorAnswersSubmitted ? this.renderVizWindow() : "yolo"}
          </Col>
        </Row>
      </div>
    );
  }

}

export default App;
