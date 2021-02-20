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
import Spinner from "react-bootstrap/Spinner";
import { Visualization } from "./components/Helpers";
import ComputeController from "./models/updateFormNodes/UpdateFormController";
import Worker from './models/worker';


const computeRisks= new Worker();

interface AppState {
  factorAnswersSubmitted: FactorAnswers | null;
  factorDatabase: any;
  elementInFocus: string;
  relationLinkData: RelationLinks | null;
  visualization: Visualization;
  computeChoice: "Webworker" | "Same thread";
}

class App extends React.Component<any, AppState> {
  computerController: ComputeController | null;
  constructor(props: any) {
    super(props);

    this.state = {
      factorAnswersSubmitted: null,
      factorDatabase: null,
      elementInFocus: "BMI",
      relationLinkData: null,
      visualization: Visualization.BAR_GRAPH,
      computeChoice: "Same thread"
    };
    
    this.handleSuccessfulSubmit = this.handleSuccessfulSubmit.bind(this);
    this.orderVisualization = this.orderVisualization.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.computerController=null;
  }

  handleSuccessfulSubmit(factorAnswers: FactorAnswers): void {
    console.log("submitted factoranswers")
    console.log(factorAnswers);
    this.setState({
      factorAnswersSubmitted: factorAnswers,
    }, 
    () => {
      if(this.state.computeChoice==="Webworker"){
        let r=computeRisks.processData(this.state.factorAnswersSubmitted!);
        r.then( (v) => {
          console.log("computed factors by web worker");
          console.log(v);
        })
      }
      else{
        let r=this.computerController?.compute(this.state.factorAnswersSubmitted!);
        console.log("computed factors in the same thread");
        console.log(r);
      }            
      this.orderVisualization(this.state.elementInFocus, Visualization.BAR_GRAPH);
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
      json("Relations.json")
    ]).then((data) => {
      this.setState({ relationLinkData: new RelationLinks(data[0] as RelationLinkJson)},
      () => {computeRisks.initializeObject(data[0]); 
        this.computerController=new ComputeController(this.state.relationLinkData!, null);
      });
    });
  }

  componentDidMount() {
    this.loadFactorDatabase();
    this.loadRelationLinks()
    this.setState({
      factorDatabase: causesData
    })
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

  handleChange(event: React.ChangeEvent<HTMLSelectElement>){

    const value: string = event.currentTarget.value;
    if(value==="Webworker"){
      this.setState({  computeChoice: "Webworker" })
    }
    else{
      this.setState({  computeChoice: "Same thread" })
    }

  };

  render() {
    console.log('Renders App')
    return (
      <div className="App">
        <Header />
        <Container fluid>
        <select
          id="computeworker"
          onChange={this.handleChange}
          value={this.state.computeChoice}
        >
          <option value="Webworker">Web worker</option>
          <option value="Same thread">Same thread</option>
        </select>
          <Row>
            <Col lg={5} xl={4} style={{ padding: "0px" }}>
              {this.state.relationLinkData!== null ? this.renderQuestionMenu() : <Spinner animation="grow" />}
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
