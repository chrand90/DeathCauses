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
  InputJson,
  FactorMaskings,
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
  activelyIgnored: ignoreList;
  hasBeenAnswered: string[];
  answeringProgress: "answering" | "finished";
  currentFactor: string;
  windowWidth: number;
  factorMaskings: FactorMaskings;
}

interface InputValidities {
  [key: string]: InputValidity;
}

interface dicWithFirstKey {
  [key: string]: any;
}

interface ignoreList {
  [key: string]: boolean;
}

function getDicOrder(dic: dicWithFirstKey) {
  return Object.keys(dic);
}

function getViewport() {
  // https://stackoverflow.com/a/8876069
  const width = Math.max(
    document.documentElement.clientWidth,
    window.innerWidth || 0
  );
  return width;
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
      activelyIgnored: {},
      windowWidth: getViewport(),
      factorMaskings: {},
    };
    this.factors = new Factors(null);
    this.helpjsons = {};
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleIgnoreFactor = this.handleIgnoreFactor.bind(this);
    this.previousQuestion = this.previousQuestion.bind(this);
    this.startOverQuestionnaire = this.startOverQuestionnaire.bind(this);
    this.handleUnitChange = this.handleUnitChange.bind(this);
    this.updateWidth = this.updateWidth.bind(this);
    // this.handleCallback = this.handleCallback.bind(this)
  }

  updateWidth() {
    this.setState({ windowWidth: getViewport() });
  }

  componentDidMount() {
    this.loadFactorNames();
    window.addEventListener("resize", this.updateWidth);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWidth);
  }

  loadFactorNames() {
    setTimeout(
      () =>
        Promise.all([json("FactorDatabase.json")]).then((data) => {
          this.factors = new Factors(data[0] as InputJson);
          this.factorOrder = this.factors.getRandomFactorOrder();
          this.setState(
            {
              factorAnswers: this.factors.getFactorsAsStateObject(),
              currentFactor: this.factorOrder[0],
            },
            () => this.initializeValidities()
          );
        }),
      500
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
      if (
        validity.status === "Missing" &&
        !(
          factorName in this.state.activelyIgnored &&
          this.state.activelyIgnored[factorName]
        ) &&
        (this.state.hasBeenAnswered.includes(factorName) ||
          this.state.currentFactor === factorName)
      ) {
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

  redoAllValidities(): void {
    this.setState((prevState: QuestionMenuStates) => {
      let new_validities: InputValidities = {};
      Object.entries(prevState.factorAnswers).forEach(
        ([factorname, factorval]) => {
          new_validities[factorname] = this.factors.getInputValidity(
            factorname,
            factorval as string,
            factorname in prevState.factorAnswerScales
              ? prevState.factorAnswerScales[factorname].unitName
              : undefined
          );
        }
      );
      return {
        validities: new_validities,
      };
    });
  }

  handleInputChange(ev: ChangeEvent<HTMLInputElement>): void {
    const { name, type } = ev.currentTarget;
    const value = ev.currentTarget.value;

    this.setState((prevState: QuestionMenuStates) => {
      const newFactorAnswers = { ...prevState.factorAnswers, [name]: value };
      this.factors.updateMasked(newFactorAnswers, name, prevState.factorMaskings);
      return {
        validities: {
          ...prevState.validities,
          [name]: this.factors.getInputValidity(
            name,
            value,
            name in prevState.factorAnswerScales
              ? prevState.factorAnswerScales[name].unitName
              : undefined
          ),
        },
        factorAnswers: newFactorAnswers,
      };
    });
  }

  handleIgnoreFactor(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name, type } = e.currentTarget;
    const factorname = name;
    const value = e.currentTarget.checked;
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
        activelyIgnored: {
          ...prevState.activelyIgnored,
          [factorname]: value,
        },
      };
    });
  }

  handleUnitChange(name: string, newUnitName: string): void {
    this.setState((prevState: QuestionMenuStates) => {
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
          [name]: this.factors.getInputValidity(
            name,
            this.state.factorAnswers[name] as string,
            newUnitName
          ),
        },
      };
    });
  }

  //handleValidityAndChangeUnits(factorname: string, newUnitName: string): void {
  //  return;
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
  //}

  //handleValidityAndIgnoreFactor(factorname: string): void {
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
  //}

  // handleCallback(event) {
  //   this.props.handleChange(event)
  // }

  // handleCallback2 = (event) => {
  //   this.props.handleChange(event)
  // }

  getHelpText(factorName: string): string {
    return this.factors.getHelpJson(factorName);
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
            phrasing={featured ? factor.phrasing : ""}
            unitOptions={Object.keys(
              (factor as NumericFactorPermanent).unitOptions
            )}
            handleChange={this.handleInputChange}
            handleIgnoreFactor={this.handleIgnoreFactor}
            inputvalidity={this.state.validities[factorName]}
            helpText={this.getHelpText(factorName)}
            featured={featured}
            handleUnitChange={this.handleUnitChange}
            ignore={this.state.activelyIgnored[factorName]}
            windowWidth={this.state.windowWidth}
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
            phrasing={featured ? factor.phrasing : ""}
            options={(factor as StringFactorPermanent).options}
            handleChange={this.handleInputChange}
            handleIgnoreFactor={this.handleIgnoreFactor}
            helpText={this.getHelpText(factorName)}
            inputvalidity={this.state.validities[factorName]}
            featured={featured}
            ignore={this.state.activelyIgnored[factorName]}
            windowWidth={this.state.windowWidth}
          />
        );
      }
      default: {
        break;
      }
    }
  }

  startOverQuestionnaire() {
    this.setState(
      {
        hasBeenAnswered: [],
        currentFactor: this.factorOrder[0],
        answeringProgress: "answering",
      },
      () => this.redoAllValidities()
    );
  }

  previousQuestion() {
    this.setState((previousState: QuestionMenuStates) => {
      const newCurrentFactor =
        previousState.hasBeenAnswered[previousState.hasBeenAnswered.length - 1];
      return {
        currentFactor: newCurrentFactor,
        hasBeenAnswered: previousState.hasBeenAnswered.slice(0, -1),
        answeringProgress: "answering",
        validities: {
          ...previousState.validities,
          [newCurrentFactor]: this.factors.getInputValidity(
            newCurrentFactor,
            previousState.factorAnswers[newCurrentFactor] as string,
            newCurrentFactor in previousState.factorAnswerScales
              ? previousState.factorAnswerScales[newCurrentFactor].unitName
              : undefined
          ),
        },
      };
    });
  }

  finishQuestionnaire() {
    this.setState({ answeringProgress: "finished" });
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
        if (this.state.hasBeenAnswered.includes(factorName)) {
          return this.getQuestion(factorName, factor);
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

          <div
            style={
              this.state.answeringProgress === "finished"
                ? {}
                : { height: "330px" }
            }
          >
            {this.getQuestionToAnswer()}
          </div>

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
