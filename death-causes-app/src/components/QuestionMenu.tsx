import React, { ChangeEvent, ReactElement } from "react";
import "./QuestionMenu.css";
import Button from "react-bootstrap/Button";
import { Row, Col, Form } from "react-bootstrap";
import Factors,  { FactorAnswers, InputValidity } from "../models/Factors";
import SimpleNumericQuestion from './QuestionNumber';
import SimpleStringQuestion from './QuestionString';
import { Label, Spinner } from "reactstrap";
import HelpJsons from "../models/HelpJsons";
import * as d3 from 'd3';
import { json } from 'd3';


interface QuestionMenuProps {
  handleSuccessfulSubmit: (f: FactorAnswers) => void;
}

interface QuestionMenuStates {
  validities: InputValidities;
  factorAnswers: FactorAnswers;
}

interface InputValidities {
  [key: string]: InputValidity;
}

class QuestionMenu extends React.Component<
QuestionMenuProps,
QuestionMenuStates
> {

  factors: Factors;
  helpjsons: HelpJsons;

  constructor(props: QuestionMenuProps) {

    super(props);
    this.state = {
      validities: {},
      factorAnswers: {}
    };
    this.factors= new Factors(null);
    this.helpjsons= {};
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleIgnoreFactor = this.handleIgnoreFactor.bind(
      this
    );
    // this.handleCallback = this.handleCallback.bind(this)
  }

  componentDidMount(){
    this.loadFactorNames();
  }

  loadFactorNames() {
    setTimeout( () =>
    Promise.all([d3.csv('FactorDatabase.csv'), json('helpjsons.json')]).then(data => { 
      this.factors=  new Factors(data[0]);
      this.helpjsons= (data[1] as HelpJsons);
      this.setState({ factorAnswers: this.factors.getFactorsAsStateObject() }, () => this.initialize_validities()) 
    }),
    2000);
  }

  initialize_validities() 
  {
    let res: InputValidities = {};
    for (let factorName in this.state.factorAnswers) {
      res[factorName] = this.factors.getInputValidity(
        factorName,
        this.state.factorAnswers[factorName] as string
      );
    }
    this.setState({validities: res});
  }

  checkAllFormsForErrorAndMissing(){
    let submittable = true;
    let validitiesToBeChanged: InputValidities = {};
    for (let factorName in this.state.validities) {
      //checking if there can be submitted a form.
      let validity = this.state.validities[factorName];
      if (validity.status === "Error") {
        submittable = false;
      }
      if (validity.status === "Missing") {
        validitiesToBeChanged[factorName] = {
          message: "Ignored by the model",
          status: "Warning",
        };
      }
    }
    return {missingWarnings: validitiesToBeChanged, submittable:submittable};
  }

  isSubmittable(){
    return Object.values(this.state.validities).every(
      (d: InputValidity) => {
        return d.status !== "Error";
      }
    );
  }

  handleSubmit(event: React.FormEvent) { //TODO: brug en bedre måde at tjekke validites.
    event.preventDefault();
    const {missingWarnings, submittable} = this.checkAllFormsForErrorAndMissing();
    if (submittable) {
      this.setState(
        (prevState: { validities: InputValidities}) => {
          return {
            validities: {
              ...prevState.validities,
              ...missingWarnings,
            },
          };
        },
        () => {
          this.props.handleSuccessfulSubmit(this.state.factorAnswers);
        }
      );
    }
  }

  //Overvej at flytte denne op i App.tsx for at undgå dobbeltrendering
  handleInputChange(ev: ChangeEvent<HTMLInputElement>): void {
    const { name, type } = ev.currentTarget;
    const value = ev.currentTarget.value;

    this.setState(
      (prevState: QuestionMenuStates) => {
        return {
          validities: {
            ...prevState.validities,
            [name]: this.factors.getInputValidity(name, value),
          },
          factorAnswers: { 
            ...prevState.factorAnswers,
            [name]: value,
          }
        };
      }
    );
  }


  handleIgnoreFactor(factorname: string): void {
    this.setState(
      (prevState: QuestionMenuStates) => {
        return {
          validities: {
            ...prevState.validities,
            [factorname]: this.factors.getInputValidity(factorname, ""),
          },
          factorAnswers: {
            ...prevState.factorAnswers,
            [factorname]: "" 
          }
        };
      }
    );
  }

  // handleCallback(event) {
  //   this.props.handleChange(event)
  // }

  // handleCallback2 = (event) => {
  //   this.props.handleChange(event)
  // }

  getHelpText(factorName:string):string{
    return (
      factorName in this.helpjsons
                  ? this.helpjsons[factorName].join("")
                  : "No help available"
    )
  }

  renderQuestionList() {
    //this should make a list of questions. At its disposal, it has the this.props.factor_database and this.props.factor_answers.
    const submittable: boolean = this.isSubmittable();
    const questionlist = Object.entries(this.factors.factorList).map(
      ([factorName, factor]) => {
        switch (factor.factorType) {
          case 'number': {
            return (
              <SimpleNumericQuestion
              key={factorName}
              name={factorName}
              placeholder={factor.placeholder}
              factorAnswer={this.state.factorAnswers[factorName] as number}
              phrasing={factor.phrasing}
              handleChange={this.handleInputChange}
              handleIgnoreFactor={this.handleIgnoreFactor}
              inputvalidity={this.state.validities[factorName]}
              helpText={this.getHelpText(factorName)}
            />
            );
          }
          case 'string': {
            return (
              <SimpleStringQuestion
                key={factorName}
                name={factorName}
                placeholder={factor.placeholder}
                factorAnswer={this.state.factorAnswers[factorName] as string}
                phrasing={factor.phrasing}
                options={factor.options}
                handleChange={this.handleInputChange}
                handleIgnoreFactor={this.handleIgnoreFactor}
                helpText={this.getHelpText(factorName)}
                inputvalidity={this.state.validities[factorName]}
                />
            )
          }
          default: {
            break
          }
        }
      }
    );
    return (
      <div>
        <p>
          Input risk factors to calculate probability of dying of most diseases
          and expected lifespan
        </p>
        <form noValidate onSubmit={this.handleSubmit}>

        <div>
            <div>
              <Button variant="primary" type="submit" disabled={!submittable}>
                Compute
              </Button>
            </div>
            <div>
              {submittable ? (
                ""
              ) : (
                <Label className="errorLabel">*Fix inputs</Label>
              )}
            </div>
          </div>

          {questionlist}
        </form>
      </div>
    );
  }

  render() {
    if(Object.keys(this.state.validities).length===0){
      return <Spinner></Spinner>
    }
    return (
      <div className="questionmenu">
        <h4> Risk factors </h4>
        {this.renderQuestionList()}
      </div>
    );
  }
}

export default QuestionMenu;
