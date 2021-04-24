import { json } from "d3";
import React, { ChangeEvent } from "react";
import Spinner from "react-bootstrap/Spinner";
import Collapse from "react-bootstrap/Collapse";
import Form from "react-bootstrap/Form";
import StringFactorPermanent from "../models/FactorString";
import NumericFactorPermanent from "../models/FactorNumber";
import GeneralFactor, { InputValidity } from "../models/FactorAbstract";
import InputJson from "../models/FactorJsonInput";
import Factors, {
  FactorAnswers,
  FactorAnswerUnitScalings,
  FactorMaskings,
} from "../models/Factors";
import HelpJsons from "../models/HelpJsons";
import "./QuestionMenu.css";
import SimpleNumericQuestion from "./QuestionNumber";
import SimpleStringQuestion from "./QuestionString";
import AskedQuestionFramed from "./AskedQuestionFrame";
import RelationLinks from "../models/RelationLinks";
import { OrderVisualization } from "./Helpers";
import QuestionListFrame from "./QuestionListFrame";
import factorDatabase from "../resources/FactorDatabase.json";
import DataPrivacyBox from "./DataPrivacyBox";

interface QuestionMenuProps extends OrderVisualization {
  handleSuccessfulSubmit: (f: FactorAnswers) => void;
  relationLinkData: RelationLinks;
}

enum AnswerProgress {
  ANSWERING = "answering",
  FINISHED = "finished",
}

enum QuestionView {
  QUESTION_MANAGER = "question-manager",
  NOTHING = "no-questions",
  QUESTION_LIST = "question-list",
}

interface QuestionMenuStates {
  validities: InputValidities;
  factorAnswers: FactorAnswers;
  factorAnswerScales: FactorAnswerUnitScalings;
  activelyIgnored: ignoreList;
  hasBeenAnswered: string[];
  answeringProgress: AnswerProgress;
  currentFactor: string;
  windowWidth: number;
  factorMaskings: FactorMaskings;
  view: QuestionView;
  changedSinceLastCommit: boolean;
}

interface InputValidities {
  [key: string]: InputValidity;
}

interface ignoreList {
  [key: string]: boolean;
}

function getViewport() {
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
    this.factorOrder = [];
    this.state = {
      validities: {},
      factorAnswers: {},
      factorAnswerScales: {},
      hasBeenAnswered: [],
      answeringProgress: AnswerProgress.ANSWERING,
      currentFactor: "",
      activelyIgnored: {},
      windowWidth: getViewport(),
      factorMaskings: {},
      view: QuestionView.QUESTION_MANAGER,
      changedSinceLastCommit: false,
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
    this.finishQuestionnaire = this.finishQuestionnaire.bind(this);
    this.insertRandom = this.insertRandom.bind(this);
    this.switchView = this.switchView.bind(this);
  }

  updateWidth() {
    this.setState({ windowWidth: getViewport() });
  }

  switchView() {
    this.setState({ view: QuestionView.NOTHING });
  }

  componentDidMount() {
    this.loadFactorNames();
    window.addEventListener("resize", this.updateWidth);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWidth);
  }

  loadFactorNames() {
    setTimeout(() => {
      this.factors = new Factors(factorDatabase as InputJson);
      this.factorOrder = this.factors.getSortedOrder(
        this.props.relationLinkData
      );
      this.setState(
        {
          factorAnswers: this.factors.getFactorsAsStateObject(),
          currentFactor: this.factorOrder[0],
        },
        () => this.initializeValidities()
      );
    }, 500);
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
          while (
            newAnswerProgress === AnswerProgress.ANSWERING &&
            (newCurrentFactor in prevState.factorMaskings ||
              newCurrentFactor === prevState.currentFactor)
          ) {
            if (!newHasBeenAnswered.includes(newCurrentFactor)) {
              newHasBeenAnswered.push(newCurrentFactor);
            }
            if (
              this.factorOrder.indexOf(newCurrentFactor) + 1 ===
              this.factorOrder.length
            ) {
              newAnswerProgress = AnswerProgress.FINISHED;
              newCurrentFactor = "";
            } else {
              newCurrentFactor = this.factorOrder[
                this.factorOrder.indexOf(newCurrentFactor) + 1
              ];
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
            changedSinceLastCommit: false,
          };
        },
        () => {
          let submittedAnswers = { ...this.state.factorAnswers };
          Object.entries(submittedAnswers).forEach(
            ([factorname, submittedValue]) => {
              if (factorname in this.state.factorMaskings) {
                submittedValue = this.state.factorMaskings[factorname]
                  .effectiveValue;
              } 
              else if (submittedValue === "") {
                return; // skipping because it already has the correct value
              }
              else if (factorname in this.state.factorAnswerScales) {
                submittedValue = (
                  parseFloat(submittedAnswers[factorname] as string) *
                  this.state.factorAnswerScales[factorname].scale
                ).toString();
              }
              submittedAnswers[factorname] = this.factors.factorList[
                factorname
              ].insertActualValue(submittedValue as string);
            }
          );
          this.props.handleSuccessfulSubmit(submittedAnswers);
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

  makeNewMasksUpdateObject(
    newFactorAnswers: FactorAnswers,
    updatedFactor: string,
    factorMaskings: FactorMaskings
  ) {
    const possiblyNewMasks:
      | FactorMaskings
      | "nothing changed" = this.factors.updateMasked(
      newFactorAnswers,
      updatedFactor,
      factorMaskings
    );
    let newMasks: any;
    if (possiblyNewMasks === "nothing changed") {
      newMasks = {};
    } else {
      newMasks = { factorMaskings: possiblyNewMasks };
    }
    return newMasks;
  }

  handleInputChange(ev: ChangeEvent<HTMLInputElement>): void {
    const { name } = ev.currentTarget;
    const value = ev.currentTarget.value;

    this.setState((prevState: QuestionMenuStates) => {
      const newFactorAnswers = { ...prevState.factorAnswers, [name]: value };
      const newMasks = this.makeNewMasksUpdateObject(
        newFactorAnswers,
        name,
        prevState.factorMaskings
      );
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
        changedSinceLastCommit: true,
        factorAnswers: newFactorAnswers,
        ...newMasks,
      };
    });
  }

  handleIgnoreFactor(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name } = e.currentTarget;
    const factorname = name;
    const value = e.currentTarget.checked;
    this.setState((prevState: QuestionMenuStates) => {
      const newFactorAnswers = { ...prevState.factorAnswers, [name]: "" };
      const newMasks = this.makeNewMasksUpdateObject(
        newFactorAnswers,
        name,
        prevState.factorMaskings
      );
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
        changedSinceLastCommit: true,
        ...newMasks,
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
        changedSinceLastCommit: true,
      };
    });
  }

  getHelpText(factorName: string): string {
    return this.factors.getHelpJson(factorName);
  }

  getQuestion(
    factorName: string,
    factor: GeneralFactor,
    featured: boolean = false
  ) {
    switch (factor.factorType) {
      case "number": {
        return (
          <SimpleNumericQuestion
            key={factorName + featured}
            name={factorName}
            factorAnswer={this.state.factorAnswers[factorName] as string}
            phrasing={factor.phrasing}
            unitOptions={(factor as NumericFactorPermanent).unitStrings}
            handleChange={this.handleInputChange}
            handleIgnoreFactor={this.handleIgnoreFactor}
            inputvalidity={this.state.validities[factorName]}
            helpText={this.getHelpText(factorName)}
            featured={featured}
            handleUnitChange={this.handleUnitChange}
            ignore={
              factorName in this.state.activelyIgnored
                ? this.state.activelyIgnored[factorName]
                : false
            }
            windowWidth={this.state.windowWidth}
            placeholder={
              factorName in this.state.factorAnswerScales
                ? this.state.factorAnswerScales[factorName].unitName
                : factor.placeholder
            }
            descendantDeathCauses={this.props.relationLinkData.getDeathCauseDescendants(
              factorName
            )}
            orderVisualization={this.props.orderVisualization}
          />
        );
      }
      case "string": {
        return (
          <SimpleStringQuestion
            key={factorName + featured}
            name={factorName}
            placeholder={factor.placeholder}
            factorAnswer={this.state.factorAnswers[factorName] as string}
            phrasing={factor.phrasing}
            options={(factor as StringFactorPermanent).options}
            handleChange={this.handleInputChange}
            handleIgnoreFactor={this.handleIgnoreFactor}
            helpText={this.getHelpText(factorName)}
            inputvalidity={this.state.validities[factorName]}
            featured={featured}
            ignore={
              factorName in this.state.activelyIgnored
                ? this.state.activelyIgnored[factorName]
                : false
            }
            windowWidth={this.state.windowWidth}
            descendantDeathCauses={this.props.relationLinkData.getDeathCauseDescendants(
              factorName
            )}
            orderVisualization={this.props.orderVisualization}
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
        answeringProgress: AnswerProgress.ANSWERING,
      },
      () => this.redoAllValidities()
    );
  }

  previousQuestion() {
    this.setState((previousState: QuestionMenuStates) => {
      let i = 0;
      if (previousState.hasBeenAnswered.includes(previousState.currentFactor)) {
        i =
          previousState.hasBeenAnswered.indexOf(previousState.currentFactor) -
          1;
      } else {
        i = previousState.hasBeenAnswered.length - 1;
      }
      while (
        previousState.hasBeenAnswered[i] in this.state.factorMaskings &&
        i > 0
      ) {
        i = i - 1;
      }
      const newCurrentFactor = previousState.hasBeenAnswered[i];
      return {
        currentFactor: newCurrentFactor,
        answeringProgress: AnswerProgress.ANSWERING,
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
    this.setState({
      answeringProgress: AnswerProgress.FINISHED,
      hasBeenAnswered: this.factorOrder,
      currentFactor: "",
    });
  }

  insertRandom() {
    const {
      factorAnswers,
      factorMaskings,
    } = this.factors.simulateFactorAnswersAndMaskings();
    this.setState(
      {
        answeringProgress: AnswerProgress.FINISHED,
        hasBeenAnswered: this.factorOrder,
        currentFactor: "",
        factorAnswers: factorAnswers,
        factorMaskings: factorMaskings,
      },
      () => this.redoAllValidities()
    );
  }

  getCounter() {
    let denominator =
      this.factorOrder.length - Object.keys(this.state.factorMaskings).length;
    let numerator =
      this.factorOrder
        .filter((factorAnswer) => {
          return !(factorAnswer in this.state.factorMaskings);
        })
        .indexOf(this.state.currentFactor) + 1;
    if (numerator === 0) {
      //at the time of implementation it could happen if a property is changed in questionlist
      return "-/" + denominator;
    }
    if (numerator > denominator) {
      return denominator + "/" + denominator;
    }
    return numerator + "/" + denominator;
  }

  getCurrentFactor() {
    return Object.keys(this.state.factorAnswers).find((factorName: string) => {
      return !(factorName in this.state.hasBeenAnswered);
    });
  }

  getQuestionToAnswer() {
    if (this.state.answeringProgress === AnswerProgress.FINISHED) {
      return (
        <AskedQuestionFramed
          factorName={undefined}
          validity={undefined}
          onSubmit={this.handleSubmit}
          previousPossible={
            this.factorOrder.indexOf(this.state.currentFactor) != 0
          }
          onPrevious={this.previousQuestion}
          onStartOver={this.startOverQuestionnaire}
          onFinishNow={this.finishQuestionnaire}
          onFinishRandomly={this.insertRandom}
          leftCornerCounter={this.getCounter()}
          onSwitchView={this.switchView}
          finished={true}
          isChanged={this.state.changedSinceLastCommit}
        />
      );
    }
    if (this.state.currentFactor) {
      return (
        <AskedQuestionFramed
          factorName={this.state.currentFactor}
          validity={this.state.validities[this.state.currentFactor]}
          onSubmit={this.handleSubmit}
          previousPossible={
            this.factorOrder.indexOf(this.state.currentFactor) !== 0
          }
          onPrevious={this.previousQuestion}
          onStartOver={this.startOverQuestionnaire}
          onFinishNow={this.finishQuestionnaire}
          onFinishRandomly={this.insertRandom}
          leftCornerCounter={this.getCounter()}
          onSwitchView={this.switchView}
          finished={false}
          isChanged={this.state.changedSinceLastCommit}
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
    const submittable: boolean = this.isSubmittable();
    const questionList = this.factorOrder.map((factorName) => {
      if (
        this.state.hasBeenAnswered.includes(factorName) &&
        !(factorName in this.state.factorMaskings)
      ) {
        return this.getQuestion(
          factorName,
          this.factors.factorList[factorName]
        );
      }
      return null;
    });
    return (
      <div>
        <p>
          Answer questions to get personalized risks of dying from different causes  
          <DataPrivacyBox></DataPrivacyBox>
        </p>
          <Collapse className="questionlistcollapser"
            in={this.state.view === QuestionView.QUESTION_MANAGER}
            onExited={() => {
              setTimeout(
                () => this.setState({ view: QuestionView.QUESTION_LIST }),
                250
              );
            }}
          >
            <Form onSubmit={this.handleSubmit}>
            <div
              id="collapse-asked-question-frame"
              style={{ justifyContent: "center" }}
            >
              {this.getQuestionToAnswer()}
            </div>
            </Form>
          </Collapse>
          <Collapse className="questionlistcollapser"
            in={this.state.view === QuestionView.QUESTION_LIST}
            onExited={() => {
              setTimeout(
                () => this.setState({ view: QuestionView.QUESTION_MANAGER }),
                250
              );
            }}
          >
            <Form onSubmit={this.handleSubmit}>
            <div
              id="collapse-question-list"
              style={{ justifyContent: "center" }}
            >
              <QuestionListFrame
                onSubmit={this.handleSubmit}
                onSwitchView={this.switchView}
                onFinishRandomly={this.insertRandom}
                hasError={!submittable}
                isChanged={this.state.changedSinceLastCommit}
              >
                {questionList}
              </QuestionListFrame>
            </div>
            </Form>
          </Collapse>
      </div>
    );
  }

  render() {
    if (Object.keys(this.state.validities).length === 0) {
      return <Spinner animation="border"></Spinner>;
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
