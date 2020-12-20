import React, { ChangeEvent, ReactElement } from "react";
import "./QuestionMenu.css";
import Button from "react-bootstrap/Button";
import { Row, Col, Form } from "react-bootstrap";
import Factors from "../models/Factors";
import { SimpleNumericQuestion, SimpleStringQuestion } from "./Question";
import { FactorAnswers, InputValidity } from "../models/Factors";
import { Label } from "reactstrap";
import HelpJsons from "../models/HelpJsons";

interface I_QuestionMenu {
  factorAnswers: FactorAnswers;
  factors: Factors;
  helpjsons: HelpJsons;
  handleChange: (name: string, value: boolean | string | number | null) => void;
  handleSuccessfullSubmit: () => void;
  handleIgnoreFactor: (factorname: string) => void;
}

interface I_QuestionMenuStates {
  validities: InputValidities;
  updateCycle: number;
}

interface InputValidities {
  [key: string]: InputValidity;
}

class QuestionMenu extends React.Component<
  I_QuestionMenu,
  I_QuestionMenuStates
> {
  constructor(props: I_QuestionMenu) {
    super(props);
    this.state = {
      validities: this.initialize_validities(this.props.factorAnswers),
      updateCycle: 0,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleValidityAndChange = this.handleValidityAndChange.bind(this);
    this.handleValidityAndIgnoreFactor = this.handleValidityAndIgnoreFactor.bind(
      this
    );
    // this.handleCallback = this.handleCallback.bind(this)
  }

  initialize_validities(factorAnswers: FactorAnswers): InputValidities {
    let res: InputValidities = {};
    for (let factorName in factorAnswers) {
      res[factorName] = this.props.factors.getInputValidity(
        factorName,
        factorAnswers[factorName] as string
      );
    }
    return res;
  }

  handleSubmit(event: React.FormEvent) { //TODO: brug en bedre måde at tjekke validites.
    event.preventDefault();
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
          status: "Missing",
        };
      }
    }
    if (submittable) {
      this.setState(
        (prevState: { validities: InputValidities; updateCycle: number }) => {
          return {
            validities: {
              ...prevState.validities,
              ...validitiesToBeChanged,
            },
            updateCycle: prevState.updateCycle + 1,
          };
        },
        () => {
          console.log(this.state.validities);
          this.props.handleSuccessfullSubmit();
        }
      );
    }
  }

  //Overvej at flytte denne op i App.tsx for at undgå dobbeltrendering
  handleValidityAndChange(ev: ChangeEvent<HTMLInputElement>): void {
    var value: string | boolean;
    const { name, type } = ev.currentTarget;
    type === "checkbox"
      ? (value = ev.currentTarget.checked)
      : (value = ev.currentTarget.value);
    this.setState(
      (prevState: { validities: InputValidities }) => {
        return {
          validities: {
            ...prevState.validities,
            [name]: this.props.factors.getInputValidity(name, value),
          },
        };
      },
      () => {
        this.props.handleChange(name, value);
      }
    );
  }

  handleValidityAndIgnoreFactor(factorname: string): void {
    this.setState(
      (prevState: { validities: InputValidities }) => {
        return {
          validities: {
            ...prevState.validities,
            [factorname]: this.props.factors.getInputValidity(factorname, ""),
          },
        };
      },
      () => {
        this.props.handleIgnoreFactor(factorname);
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
      factorName in this.props.helpjsons
                  ? this.props.helpjsons[factorName].join("")
                  : "No help available"
    )
  }

  renderQuestionList() {
    let factorAnswers = this.props.factorAnswers;
    //this should make a list of questions. At its disposal, it has the this.props.factor_database and this.props.factor_answers.
    const submittable: boolean = Object.values(this.state.validities).every(
      (d: InputValidity) => {
        return d.status !== "Error";
      }
    );
    console.log(submittable);
    console.log(this.state.validities);
    console.log("render QuestionMenu");
    const questionlist = Object.entries(this.props.factors.factorList).map(
      ([factorName, factor]) => {
        switch (factor.factorType) {
          case 'number': {
            return (
              <SimpleNumericQuestion
              key={factorName}
              name={factorName}
              placeholder={factor.placeholder}
              factorAnswer={this.props.factorAnswers[factorName] as number}
              phrasing={factor.phrasing}
              handleChange={this.handleValidityAndChange}
              handleIgnoreFactor={this.handleValidityAndIgnoreFactor}
              inputvalidity={this.state.validities[factorName]}
              updateCycle={this.state.updateCycle}
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
                factorAnswer={this.props.factorAnswers[factorName] as string}
                phrasing={factor.phrasing}
                options={factor.options}
                handleChange={this.handleValidityAndChange}
                handleIgnoreFactor={this.handleValidityAndIgnoreFactor}
                helpText={this.getHelpText(factorName)}
                updateCycle={this.state.updateCycle}
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
    console.log(questionlist);
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

          {/*<Form.Row>
              <Form.Label column sm={4}>
                Fish consumed / week</Form.Label>
              <Col>
                <Form.Control type="text" placeholder="grams of fish" name="fish" value={factorAnswers.fish} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column sm={4}>
                Waist circumference</Form.Label>
              <Col>
                <Form.Control type="text" placeholder="waist cm" name="waist" value={factorAnswers.waist} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column sm={4}>
                BMI</Form.Label>
              <Col>
                <Form.Control type="text" placeholder="Age" name="age" value={factorAnswers.age} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column sm={4}>
                Gender</Form.Label>
              <Col>
                <Form.Control as="select" placeholder="Gender" name="gender" value={factorAnswers.gender} onChange={this.props.handleChange}>
                  <option selected disabled>Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Form.Control>
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column sm={4}>
                Diabetes</Form.Label>
              <Col>
                <Form.Control type="checkbox" name="diabetes" checked={factorAnswers.diabetes} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>*/}


          {/* <label>Gender
      <input type="radio" id="male" name="gender" value="Male" />
            <label htmlFor="male">Male</label> <br />
            <input type="radio" id="female" name="gender" value="Female" />
            <label htmlFor="female">Female</label> <br />
            <input type="radio" id="other" name="gender" vlaue="Other" />
            <label htmlFor="other">Other</label> <br />
          </label>
          <br />
      Age:
      <input type="date" />
          <br />
          <br />
          <br />
          <div class="line">
            <label for="input">What is your BMI?</label>
            <div>
              <input type="text" placeholder="BMI: 18-25" name="bmi" value={this.props.bmi} onChange={this.props.handleChange} />
            </div>
          </div>
          <br />
          <br />
          <br />
          <br />

      Do you have depression?

      <input type="radio" id="yes" name="depression" value="yes" />
          <label htmlFor="yes">Yes</label>

          <input type="radio" id="no" name="depression" value="no" />
          <label htmlFor="no">No</label>
          <br />


      Do you drink alcohol?

      <input type="radio" id="yes" name="alcohol" value="yes" />
          <label htmlFor="yes">Yes</label>

          <input type="radio" id="no" name="alcohol" value="no" />
          <label htmlFor="no">No</label>
          <br />
          <li>If yes, how much do you maximum drink in a week?</li>
          <br />
      Your waist circumference?
      <input type="text" name="waist" placeholder="cm" value={this.props.waist} onChange={this.handleCallback} /> */}
        </form>
      </div>
    );
  }

  render() {
    return (
      <div className="questionmenu">
        <h4> Risk factors </h4>
        {this.renderQuestionList()}
      </div>
    );
  }
}

export default QuestionMenu;
