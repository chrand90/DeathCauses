import React from 'react';
import './App.css';
import Header from './Components/Header.js';
import QuestionMenu from './Components/QuestionMenu.js';
import VizWindow from './Components/VizWindow.js';
import { Row, Col } from 'reactstrap';
import { json } from 'd3';
import data from './data/Causes_for_json.json'
import testdata from './data/test_data.json'

class App extends React.Component {
  constructor(props) {
    super();
    this.state = {
      hasLoadedFactorAnswers: true, //indicates whether the initial factors havent been read from the file. In the
      hasLoadedDatabase: true, //indicates whether the database hasnt been loaded from the file
      hasLoadedFactorDatabase: true,
      factor_database: null, //indicates any data about the factors. For example, how should the question be formulated.
      database: null,
      factor_answers: {
        bmi: "",
        waist: "", //livvidde
        caffeine: "", // kop kaffe, svarende til XYZ [mg koffein / dag]. Eventuelt hover over box med typiske koffein indhold i forskellige kaffetyper.
        fish: "", // [g fisk/uge]
        vegetables: "",
        fluids: "",
        headTrauma: "",
        drinking: "",
        gender: "",
        oralContraceptiveTypicalAmmount: "",
        oralContraceptiveSinceStop: "",
        physicalActivityTotal: "",
        physicalActivityHard: "",
        redMeat: "",
        hCVHistory: "",
        iIVHistory: "",
        diabetes: "",
        smokeSinceStop: "", // afhænger af smokeIntensity. Tidsperiode i år.
        smokeTypicalAmmount: "", // [smøger / dag] mens man røg
        smokeIntensity: "", // nuværende forbrug af røg [smøger/dag]
        SmokeCumulative: "", // pack years. 1 pakke per dag i et år = 1 pack year. eventuelt erstart med smokeStart. 
        indoorTanning: "",
        race: "",
        maxDrinking: "",
        greens: "",
        familyHistoryParkinson: "",
        pesticideExposureDays: "",
        depression: "",
      },
      factorAnswersSubmitted: {
        bmi: "",
        waist: "", //livvidde
        caffeine: "", // kop kaffe, svarende til XYZ [mg koffein / dag]. Eventuelt hover over box med typiske koffein indhold i forskellige kaffetyper.
        fish: "", // [g fisk/uge]
        vegetables: "",
        fluids: "",
        headTrauma: "",
        drinking: "",
        gender: "",
        oralContraceptiveTypicalAmmount: "",
        oralContraceptiveSinceStop: "",
        physicalActivityTotal: "",
        physicalActivityHard: "",
        redMeat: "",
        hCVHistory: "",
        iIVHistory: "",
        diabetes: "",
        smokeSinceStop: "", // afhænger af smokeIntensity. Tidsperiode i år.
        smokeTypicalAmmount: "", // [smøger / dag] mens man røg
        smokeIntensity: "", // nuværende forbrug af røg [smøger/dag]
        SmokeCumulative: "", // pack years. 1 pakke per dag i et år = 1 pack year. eventuelt erstart med smokeStart. 
        indoorTanning: "",
        race: "",
        maxDrinking: "",
        greens: "",
        familyHistoryParkinson: "",
        pesticideExposureDays: "",
        depression: "",
      },
      tmp: ""
    };
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  };

  test = () => {
    console.log(this.state.database)
  }

  // callbackFunction(event) {
  //   const { name, value } = event.target
  //   this.setState({
  //     data: {
  //       waist: value,
  //     }
  //   })
  // }´

  handleSubmit(event) {
    event.preventDefault()
    this.setState({
      factorAnswersSubmitted: this.state.factor_answers
    })
  }

  handleChange(event) {
    var value
    const { name, type } = event.target
    type === "checkbox" ? value = event.target.checked : value = event.target.value
    this.setState(prevState => {
      return {
        factor_answers: {
          ...prevState.factor_answers,
          [name]: value
        }
      }
    })
    console.log(this.state)
  }

  visualize() {
    //this should re-render the view with the new factor values that was changed by QuestionMenu. 
    // this.setState({ factor_answers: this.state.factor_answers });
  };

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
    // Promise.all(
    //   [json("https://raw.githubusercontent.com/chrand90/DeathCauses/master/compile/Causes_for_json")]//,
    //   //json('../factor_database'), NOT IMPLEMENTED
    //   //json('../basic_factor_answers') NOT IMPLEMENTED
    // ).then((databases) => {
    //   console.log(databases[0])
    //   this.setState({ database: databases[0], hasLoadedDatabase: true });
    // });
    //Probably better to use: Promise all then
    this.setState({
      database: data,
      tmp: testdata
    }
    )
  }





  renderQuestionMenu() {
    return (
      <QuestionMenu factor_answers={this.state.factor_answers} factor_database={this.factor_database} handleChange={this.handleChange} test={this.test} handleSubmit={this.handleSubmit} />
    );
  }

  renderVizWindow() {
    return (
      <VizWindow database={this.state.database} factorAnswersSubmitted={this.state.factorAnswersSubmitted} />
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
