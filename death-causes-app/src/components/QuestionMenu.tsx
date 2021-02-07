import * as d3 from "d3";
import { json } from "d3";
import React, { ChangeEvent } from "react";
import Button from "react-bootstrap/Button";
import { Label, Spinner } from "reactstrap";

import Factors, {
  StringFactorPermanent,
  NumericFactorPermanent,
  FactorAnswers,
  GeneralFactor,
  InputValidity,
  FactorAnswerUnitScalings,
} from "../models/Factors";
import HelpJsons from "../models/HelpJsons";
import "./QuestionMenu.css";
import SimpleNumericQuestion from "./QuestionNumber";
import SimpleStringQuestion from "./QuestionString";
import AskedQuestionFramed from "./AskedQuestionFrame";

interface QuestionMenuProps {
  handleSuccessfulSubmit: (f: FactorAnswers) => void;
  }

interface QuestionMenuStates {
  validities: InputValidities;
  factorAnswers: FactorAnswers;
  factorAnswerScales: FactorAnswerUnitScalings;
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
  QuestionMenuProps,
  QuestionMenuStates
> {
  factors: Factors;
  helpjsons: HelpJsons;
  factorOrder: string[];

  constructor(props: QuestionMenuProps) {
    super(props);
    this.factorOrder = []; //getDicOrder(this.props.factorAnswers);
    this.state = {
      validities: {},
      factorAnswers: {},
      factorAnswerScales: {},
      hasBeenAnswered: [],
      answeringProgress: "answering",
      currentFactor: "",
    };
    this.factors = new Factors(null);
    this.helpjsons = {};
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleIgnoreFactor = this.handleIgnoreFactor.bind(this);
    this.handleValidityAndIgnoreFactor = this.handleValidityAndIgnoreFactor.bind(this);
    this.previousQuestion = this.previousQuestion.bind(this);
    this.startOverQuestionnaire = this.startOverQuestionnaire.bind(this);
    this.handleUnitChange = this.handleUnitChange.bind(this);
    // this.handleCallback = this.handleCallback.bind(this)
  }

  componentDidMount() {
    this.loadFactorNames();
  }

  loadFactorNames() {
    setTimeout(
      () =>
        Promise.all([
          d3.csv("FactorDatabase.csv"),
          json("helpjsons.json"),
        ]).then((data) => {
          this.factors = new Factors(data[0]);
          this.helpjsons = data[1] as HelpJsons;
          this.factorOrder = this.factors.getRandomFactorOrder()
          this.setState(
            { factorAnswers: this.factors.getFactorsAsStateObject(),
            currentFactor: this.factorOrder[0] },
            () => this.initializeValidities()
          );
        }),
      2000
    );
  }

  initializeValidities() {
    let res: InputValidities = {};
    for (let factorName in this.state.factorAnswers) {
      res[factorName] = this.factors.getInputValidity(
        factorName,
        this.state.factorAnswers[factorName] as string
      );
    }
    this.setState({ validities: res });
  }

  checkAllFormsForErrorAndMissing() {
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
    return { missingWarnings: validitiesToBeChanged, submittable: submittable };
  }

  isSubmittable() {
    return Object.values(this.state.validities).every((d: InputValidity) => {
      return d.status !== "Error";
    });
  }

  handleSubmit(event: React.FormEvent) {
    //TODO: brug en bedre måde at tjekke validites.
    event.preventDefault();
    const {
      missingWarnings,
      submittable,
    } = this.checkAllFormsForErrorAndMissing();
    if (submittable) {
      this.setState(
        (prevState: QuestionMenuStates) => {
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
              ...missingWarnings,
            },
            hasBeenAnswered: newHasBeenAnswered,
            answeringProgress: newAnswerProgress,
            currentFactor: newCurrentFactor,
          };
        },
        () => {
          this.props.handleSuccessfulSubmit(this.state.factorAnswers);
        }
      );
    }
  }

  handleInputChange(ev: ChangeEvent<HTMLInputElement>): void {
    const { name, type } = ev.currentTarget;
    const value = ev.currentTarget.value;

    this.setState((prevState: QuestionMenuStates) => {
      return {
        validities: {
          ...prevState.validities,
          [name]: this.factors.getInputValidity(name, value),
        },
        factorAnswers: {
          ...prevState.factorAnswers,
          [name]: value,
        },
      };
    });
  }

  handleIgnoreFactor(factorname: string): void {
    this.setState((prevState: QuestionMenuStates) => {
      return {
        validities: {
          ...prevState.validities,
          [factorname]: this.factors.getInputValidity(factorname, ""),
        },
        factorAnswers: {
          ...prevState.factorAnswers,
          [factorname]: "",
        },
      };
    });
  }

  handleUnitChange(name: string, newUnitName: string): void {
    this.setState(
      (prevState: QuestionMenuStates) => {
        return {
          factorAnswerScales: {
            ...prevState.factorAnswerScales,
            [name]: {
              unitName: newUnitName,
              scale: this.factors.getScalingFactor(name, newUnitName),
            },
          },
          validities: {
            ...prevState.validities,
            [name]: 
              this.factors.getInputValidity(
                name,
                this.state.factorAnswers[name] as string,
                newUnitName
                )
          },
        };
      }
    );
  }


  handleValidityAndChangeUnits(factorname: string, newUnitName: string): void {
    return
    // this.setState(
    //   (prevState: { validities: InputValidities }) => {
    //     return {
    //       validities: {
    //         ...prevState.validities,
    //         [factorname]: this.props.factors.getInputValidity(
    //           factorname,
    //           this.props.factorAnswers[factorname] as string,
    //           newUnitName
    //         ),
    //       },
    //     };
    //   },
    //   () => {
    //     this.props.handleChangeUnit(factorname, newUnitName);
    //   }
    // );
  }

  handleValidityAndIgnoreFactor(factorname: string): void {
    // this.setState(
    //   (prevState: { validities: InputValidities }) => {
    //     return {
    //       validities: {
    //         ...prevState.validities,
    //         [factorname]: this.props.factors.getInputValidity(
    //           factorname,
    //           "",
    //           factorname in this.props.factorAnswerScales
    //             ? this.props.factorAnswerScales[factorname].unitName
    //             : undefined
    //         ),
    //       },
    //     };
    //   },
    //   () => {
    //     this.props.handleIgnoreFactor(factorname);
    //   }
    // );
  }

  // handleCallback(event) {
  //   this.props.handleChange(event)
  // }

  // handleCallback2 = (event) => {
  //   this.props.handleChange(event)
  // }

  getHelpText(factorName: string): string {
    return factorName in this.helpjsons
      ? this.helpjsons[factorName]
      : "No help available";
  }

  getQuestion(
    factorName: string,
    factor: GeneralFactor<string | boolean | number>,
    featured: boolean = false
  ) {
    switch (factor.factorType) {
      case "number": {
        return (
          <SimpleNumericQuestion
            key={factorName}
            name={factorName}
            factorAnswer={this.state.factorAnswers[factorName] as number}
            phrasing={featured ? factor.phrasings[1] : factor.phrasings[0]}
            unitOptions={(factor as NumericFactorPermanent).unitOptions}
            handleChange={this.handleInputChange}
            handleIgnoreFactor={this.handleValidityAndIgnoreFactor}
            inputvalidity={this.state.validities[factorName]}
            helpText={this.getHelpText(factorName)}
            featured={featured}
            handleUnitChange={this.handleUnitChange}
            placeholder={
              factorName in this.state.factorAnswerScales
                ? this.state.factorAnswerScales[factorName].unitName
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
            factorAnswer={this.state.factorAnswers[factorName] as string}
            phrasing={featured ? factor.phrasings[1] : factor.phrasings[0]}
            options={(factor as StringFactorPermanent).options}
            handleChange={this.handleInputChange}
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
    this.setState((previousState: QuestionMenuStates) => {
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
    this.setState((previousState: QuestionMenuStates) => {
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
    return Object.keys(this.state.factorAnswers).find((factorName: string) => {
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
            this.factors.factorList[this.state.currentFactor],
            true
          )}
        </AskedQuestionFramed>
      );
    }
    return "Something went wrong";
  }

  renderQuestionList() {
    //this should make a list of questions. At its disposal, it has the this.props.factor_database and this.props.factor_answers.
    const submittable: boolean = this.isSubmittable();
    const questionList = Object.entries(this.factors.factorList).map(
      ([factorName, factor]) => {
        return this.getQuestion(factorName, factor);
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

          {this.getQuestionToAnswer()}
          {questionList}
        </form>
      </div>
    );
  }

  render() {
    if (Object.keys(this.state.validities).length === 0) {
      return <Spinner></Spinner>;
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
