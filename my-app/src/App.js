import React from 'react';
import './App.css';
import Header from './Components/Header.js';
import QuestionMenu from './Components/QuestionMenu.js';
import VizWindow from './Components/VizWindow.js';
import { Row, Col} from 'reactstrap';
import { json} from 'd3';

class App extends React.Component {


  visualize(){
    //this should re-render the view with the new factor values that was changed by QuestionMenu. 
    this.setState({ factor_answers: this.state.factor_answers}); 
  };

  loadFactorAnswers(){
    // load_factor_answers.then((loaded_factor_answers)=> this.setState({hasLoadedFactorAnswers: false, factor_answers:loaded_factor_answers})).
    // This will load the factor answers and then it will update the rendered view using setState.
  }

  loadDatabase(){
    // load_data.then((loaded_data)=> this.setState({hasLoadedDatabase: false, factor_answers:loaded_data})).
    // This will load the data and then it will update the rendered view using setState.
    this.setState({ database:json('../compile/Causes_for_json'), hasLoadedDatabase:true});
  }

  loadFactorDatabase(){
    // load_factor_db.then((loaded_factor_data=> this.setState({hasLoadedFactorDatabase: false, factor_answers:loaded_factor_database})).
    // This will load the data and then it will update the rendered view using setState.
  }

  componentDidMount(){
    Promise.all( 
      [json("https://raw.githubusercontent.com/chrand90/DeathCauses/master/compile/Causes_for_json")]//,
      //json('../factor_database'), NOT IMPLEMENTED
      //json('../basic_factor_answers') NOT IMPLEMENTED
    ).then((databases) => {
      console.log(databases[0])
      this.setState({database:databases[0], hasLoadedDatabase:true});
    });
    //Probably better to use: Promise all then
  }



  constructor(props){
    super();
    this.state= { 
      hasLoadedFactorAnswers: true, //indicates whether the initial factors havent been read from the file. In the
      hasLoadedDatabase: false, //indicates whether the database hasnt been loaded from the file
      hasLoadedFactorDatabase: true,
      factor_database: null, //indicates any data about the factors. For example, how should the question be formulated.
      factor_answers: null, //the current answers of 
      database: null
    };
  };

  renderQuestionMenu(){
    return (
      <QuestionMenu onNewVisualization={(x) => this.visualize(x)} factor_answers={this.state.factor_answers} factor_database={this.factor_database}/>
    );
  }

  renderVizWindow(){
    return (
      <VizWindow factor_answers={this.state.factor_answers} database={this.state.database}/>
    );
  }

  render(){
    console.log(this.state)
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
