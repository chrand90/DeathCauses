import React, { ChangeEvent, ReactElement } from "react";
import "./QuestionMenu.css";
import Button from "react-bootstrap/Button";
import { Row, Col, Form } from "react-bootstrap";
import Factors, { GeneralFactor } from "../models/Factors";
import { SimpleNumericQuestion, SimpleStringQuestion } from "./Question";
import {
  FactorAnswers,
  InputValidity,
  FactorAnswerUnitScalings,
} from "../models/Factors";
import { Label } from "reactstrap";
import HelpJsons from "../models/HelpJsons";
import AskedQuestionFramed from "./AskedQuestionFrame";

interface I_QuestionMenu {
  factorAnswers: FactorAnswers;
  factorAnswerScales: FactorAnswerUnitScalings;
  factors: Factors;
  helpjsons: HelpJsons;
  handleChange: (name: string, value: boolean | string | number | null) => void;
  handleSuccessfullSubmit: () => void;
  handleIgnoreFactor: (factorname: string) => void;
  handleChangeUnit: (name: string, newUnitName: string) => void;
}

interface I_QuestionMenuStates {
  validities: InputValidities;
  hasBeenAnswered: string[];
  answeringProgress: "answering" | "finished";
  currentFactor: string;
}

interface InputValidities {
  [key: string]: InputValidity;
}

interface dicWithFirstKey {
  [key: string]: any;
}

function getDicOrder(dic: dicWithFirstKey) {
  return Object.keys(dic);
}

class QuestionMenu extends React.Component<
  I_QuestionMenu,
  I_QuestionMenuStates
> {
  factorOrder: string[];

  constructor(props: I_QuestionMenu) {
    super(props);
    this.factorOrder = getDicOrder(this.props.factorAnswers);
    this.state = {
      validities: this.initialize_validities(this.props.factorAnswers),
      hasBeenAnswered: [],
      answeringProgress: "answering",
      currentFactor: this.factorOrder[0],
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleValidityAndChange = this.handleValidityAndChange.bind(this);
    this.handleValidityAndIgnoreFactor = this.handleValidityAndIgnoreFactor.bind(
      this
    );
    this.previousQuestion = this.previousQuestion.bind(this);
    this.startOverQuestionnaire = this.startOverQuestionnaire.bind(this);
    this.handleValidityAndChangeUnits = this.handleValidityAndChangeUnits.bind(
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

  handleSubmit(event: React.FormEvent) {
    //TODO: brug en bedre måde at tjekke validites.
    event.preventDefault();
    let submittable = true;
    let validitiesToBeChanged: InputValidities = {};
    for (let factorName in this.state.validities) {
      //checking if there can be submitted a form.
      if (
        factorName === this.state.currentFactor ||
        this.state.answeringProgress === "finished" ||
        factorName in this.state.hasBeenAnswered
      ) {
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
    }
    if (submittable) {
      this.setState(
        (prevState: I_QuestionMenuStates) => {
          let newAnswerProgress = prevState.answeringProgress;
          let newHasBeenAnswered = [...prevState.hasBeenAnswered];
          let newCurrentFactor = prevState.currentFactor;
          if (prevState.answeringProgress === "answering") {
            newHasBeenAnswered.push(prevState.currentFactor);
            if (newHasBeenAnswered.length === this.factorOrder.length) {
              newAnswerProgress = "finished";
              newCurrentFactor = "";
            } else {
              newCurrentFactor = this.factorOrder[newHasBeenAnswered.length];
            }
          }
          return {
            validities: {
              ...prevState.validities,
              ...validitiesToBeChanged,
            },
            hasBeenAnswered: newHasBeenAnswered,
            answeringProgress: newAnswerProgress,
            currentFactor: newCurrentFactor,
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
            [name]: this.props.factors.getInputValidity(
              name,
              value,
              name in this.props.factorAnswerScales
                ? this.props.factorAnswerScales[name].unitName
                : undefined
            ),
          },
        };
      },
      () => {
        this.props.handleChange(name, value);
      }
    );
  }

  handleValidityAndChangeUnits(factorname: string, newUnitName: string): void {
    this.setState(
      (prevState: { validities: InputValidities }) => {
        return {
          validities: {
            ...prevState.validities,
            [factorname]: this.props.factors.getInputValidity(
              factorname,
              this.props.factorAnswers[factorname] as string,
              newUnitName
            ),
          },
        };
      },
      () => {
        this.props.handleChangeUnit(factorname, newUnitName);
      }
    );
  }

  handleValidityAndIgnoreFactor(factorname: string): void {
    this.setState(
      (prevState: { validities: InputValidities }) => {
        return {
          validities: {
            ...prevState.validities,
            [factorname]: this.props.factors.getInputValidity(
              factorname,
              "",
              factorname in this.props.factorAnswerScales
                ? this.props.factorAnswerScales[factorname].unitName
                : undefined
            ),
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

  getHelpText(factorName: string): string {
    return factorName in this.props.helpjsons
      ? this.props.helpjsons[factorName].join("")
      : "No help available";
  }

  getQuestion(
    factorName: string,
    factor: GeneralFactor<string | number | boolean>,
    featured: boolean = false
  ) {
    switch (factor.factorType) {
      case "number": {
        return (
          <SimpleNumericQuestion
            key={factorName}
            name={factorName}
            factorAnswer={this.props.factorAnswers[factorName] as number}
            phrasing={featured ? factor.phrasings[1] : factor.phrasings[0]}
            unitOptions={factor.options}
            handleChange={this.handleValidityAndChange}
            handleIgnoreFactor={this.handleValidityAndIgnoreFactor}
            inputvalidity={this.state.validities[factorName]}
            helpText={this.getHelpText(factorName)}
            featured={featured}
            handleChangeUnit={this.handleValidityAndChangeUnits}
            placeholder={
              factorName in this.props.factorAnswerScales
                ? this.props.factorAnswerScales[factorName].unitName
                : factor.placeholder
            }
          />
        );
      }
      case "string": {
        return (
          <SimpleStringQuestion
            key={factorName}
            name={factorName}
            placeholder={factor.placeholder}
            factorAnswer={this.props.factorAnswers[factorName] as string}
            phrasing={featured ? factor.phrasings[1] : factor.phrasings[0]}
            options={factor.options}
            handleChange={this.handleValidityAndChange}
            handleIgnoreFactor={this.handleValidityAndIgnoreFactor}
            helpText={this.getHelpText(factorName)}
            inputvalidity={this.state.validities[factorName]}
            featured={featured}
          />
        );
      }
      default: {
        break;
      }
    }
  }

  startOverQuestionnaire() {
    this.setState({
      hasBeenAnswered: [],
      currentFactor: this.factorOrder[0],
      answeringProgress: "answering",
    });
  }

  previousQuestion() {
    this.setState((previousState: I_QuestionMenuStates) => {
      return {
        currentFactor:
          previousState.hasBeenAnswered[
            previousState.hasBeenAnswered.length - 1
          ],
        hasBeenAnswered: previousState.hasBeenAnswered.slice(0, -1),
        answeringProgress: "answering",
      };
    });
  }

  finishQuestionnaire() {
    this.setState({ answeringProgress: "finished" });
  }

  startOver(){
    this.setState((previousState: I_QuestionMenuStates) => {
      return {
        currentFactor:
          previousState.hasBeenAnswered[
            previousState.hasBeenAnswered.length - 1
          ],
        hasBeenAnswered: previousState.hasBeenAnswered.slice(0, -1),
        answeringProgress: "answering",
      };
    });
  }

  getCurrentFactor() {
    return Object.keys(this.props.factorAnswers).find((factorName: string) => {
      return !(factorName in this.state.hasBeenAnswered);
    });
  }

  getQuestionToAnswer() {
    if (this.state.answeringProgress === "finished") {
      return (
        <AskedQuestionFramed
          factorName={undefined}
          validity={undefined}
          onSubmit={this.handleSubmit}
          previousPossible={this.state.hasBeenAnswered.length > 0}
          onPrevious={this.previousQuestion}
          onStartOver={this.startOverQuestionnaire}
        />
      );
    }
    if (this.state.currentFactor) {
      return (
        <AskedQuestionFramed
          factorName={this.state.currentFactor}
          validity={this.state.validities[this.state.currentFactor]}
          onSubmit={this.handleSubmit}
          previousPossible={this.state.hasBeenAnswered.length > 0}
          onPrevious={this.previousQuestion}
          onStartOver={this.startOverQuestionnaire}
        >
          {this.getQuestion(
            this.state.currentFactor,
            this.props.factors.factorList[this.state.currentFactor],
            true
          )}
        </AskedQuestionFramed>
      );
    }
    return "Something went wrong";
  }

  renderQuestionList() {
    //this should make a list of questions. At its disposal, it has the this.props.factor_database and this.props.factor_answers.
    const submittable: boolean = Object.values(this.state.validities).every(
      (d: InputValidity) => {
        return d.status !== "Error";
      }
    );
    console.log(submittable);
    console.log(this.state.validities);
    console.log("render QuestionMenu");
    let questionList: React.ReactNode[] = [];
    Object.entries(this.props.factors.factorList).forEach(
      ([factorName, factor]) => {
        console.log(factorName);
        if (
          this.state.answeringProgress === "finished" ||
          this.state.hasBeenAnswered.includes(factorName)
        ) {
          console.log(factorName);
          questionList.push(this.getQuestion(factorName, factor));
        }
      }
    );
    console.log(questionList);
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

          {this.getQuestionToAnswer()}
          {questionList}
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
