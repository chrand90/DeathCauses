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

interface QuestionMenuProps extends OrderVisualization {
  handleSuccessfulSubmit: (f: FactorAnswers) => void;
  relationLinkData: RelationLinks;
  questionMenuStates: QuestionMenuStates
  updateQuestionMenuStates: (updatedStates: QuestionMenuStates, callback: () => void) => void
}

export enum AnswerProgress {
  ANSWERING = "answering",
  FINISHED = "finished",
}

export enum QuestionView {
  QUESTION_MANAGER = "question-manager",
  NOTHING = "no-questions",
  QUESTION_LIST = "question-list",
}

export interface QuestionMenuStates {
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
  QuestionMenuProps> {
  factors: Factors;
  factorOrder: string[];

  constructor(props: QuestionMenuProps) {
    super(props);
    this.factorOrder = [];
    // this.state = {
    //   validities: {},
    //   factorAnswers: {},
    //   factorAnswerScales: {},
    //   hasBeenAnswered: [],
    //   answeringProgress: AnswerProgress.ANSWERING,
    //   currentFactor: "",
    //   activelyIgnored: {},
    //   windowWidth: getViewport(),
    //   factorMaskings: {},
    //   view: QuestionView.QUESTION_MANAGER,
    //   changedSinceLastCommit: false,
    // };
    // this.state = this.props.questionMenuStates
    this.factors = new Factors(null);
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

    this.setQuestionMenuState = this.setQuestionMenuState.bind(this)
    this.setQuestionMenuStateWithCallback = this.setQuestionMenuStateWithCallback.bind(this)

    this.setQuestionMenuState({ ...this.props.questionMenuStates })
  }

  setQuestionMenuState(updatedState: QuestionMenuStates) {
    this.props.updateQuestionMenuStates(updatedState, () => { })
  }

  setQuestionMenuStateWithCallback(updatedState: QuestionMenuStates, callback: () => void) {
    this.props.updateQuestionMenuStates(updatedState, callback)
  }

  updateWidth() {
    this.setQuestionMenuState({ ...this.props.questionMenuStates, windowWidth: getViewport() });
  }

  switchView() {
    this.setQuestionMenuState({ ...this.props.questionMenuStates, view: QuestionView.NOTHING });
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
      if (Object.keys(this.props.questionMenuStates.factorAnswers).length === 0) {
        this.setQuestionMenuStateWithCallback(
          {
            ...this.props.questionMenuStates,
            factorAnswers: this.factors.getFactorsAsStateObject(),
            currentFactor: this.factorOrder[0],
          },
          () => this.initializeValidities()
        );
      }
    }, 500);
  }


  initializeValidities() {
    let res: InputValidities = {};
    for (let factorName in this.props.questionMenuStates.factorAnswers) {
      res[factorName] = this.factors.getInputValidity(
        factorName,
        this.props.questionMenuStates.factorAnswers[factorName] as string
      );
    }
    this.setQuestionMenuState({ ...this.props.questionMenuStates, validities: res })
    // console.log(questionMenuStates)
    // console.log({...questionMenuStates, validities: res })
    // this.props.updateQuestionMenuStates({...questionMenuStates, validities: res });
  }

  checkAllFormsForErrorAndMissing() {
    let submittable = true;
    let validitiesToBeChanged: InputValidities = {};
    for (let factorName in this.props.questionMenuStates.validities) {
      //checking if there can be submitted a form.
      let validity = this.props.questionMenuStates.validities[factorName];
      if (validity.status === "Error") {
        submittable = false;
      }
      if (
        validity.status === "Missing" &&
        !(
          factorName in this.props.questionMenuStates.activelyIgnored &&
          this.props.questionMenuStates.activelyIgnored[factorName]
        ) &&
        (this.props.questionMenuStates.hasBeenAnswered.includes(factorName) ||
          this.props.questionMenuStates.currentFactor === factorName)
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
    return Object.values(this.props.questionMenuStates.validities).every((d: InputValidity) => {
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
      let newAnswerProgress = this.props.questionMenuStates.answeringProgress;
      let newHasBeenAnswered = [...this.props.questionMenuStates.hasBeenAnswered];
      let newCurrentFactor = this.props.questionMenuStates.currentFactor;
      while (
        newAnswerProgress === AnswerProgress.ANSWERING &&
        (newCurrentFactor in this.props.questionMenuStates.factorMaskings ||
          newCurrentFactor === this.props.questionMenuStates.currentFactor)
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
      this.setQuestionMenuStateWithCallback(
        {
          ...this.props.questionMenuStates,
          validities: {
            ...this.props.questionMenuStates.validities,
            ...missingWarnings,
          },
          hasBeenAnswered: newHasBeenAnswered,
          answeringProgress: newAnswerProgress,
          currentFactor: newCurrentFactor,
          changedSinceLastCommit: false,
        },
        () => {
          let submittedAnswers = { ...this.props.questionMenuStates.factorAnswers };
          Object.entries(submittedAnswers).forEach(
            ([factorname, submittedValue]) => {
              if (factorname in this.props.questionMenuStates.factorMaskings) {
                submittedValue = this.props.questionMenuStates.factorMaskings[factorname]
                  .effectiveValue;
              }
              else if (submittedValue === "") {
                return; // skipping because it already has the correct value
              }
              else if (factorname in this.props.questionMenuStates.factorAnswerScales) {
                submittedValue = (
                  parseFloat(submittedAnswers[factorname] as string) *
                  this.props.questionMenuStates.factorAnswerScales[factorname].scale
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
    let new_validities: InputValidities = {};
    Object.entries(this.props.questionMenuStates.factorAnswers).forEach(
      ([factorname, factorval]) => {
        new_validities[factorname] = this.factors.getInputValidity(
          factorname,
          factorval as string,
          factorname in this.props.questionMenuStates.factorAnswerScales
            ? this.props.questionMenuStates.factorAnswerScales[factorname].unitName
            : undefined
        );
      }
    );
    this.setQuestionMenuState({
      ...this.props.questionMenuStates,
      validities: new_validities
    })
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

    const newFactorAnswers = { ...this.props.questionMenuStates.factorAnswers, [name]: value };
    const newMasks = this.makeNewMasksUpdateObject(
      newFactorAnswers,
      name,
      this.props.questionMenuStates.factorMaskings
    );

    this.setQuestionMenuState({
      ...this.props.questionMenuStates,
      validities: {
        ...this.props.questionMenuStates.validities,
        [name]: this.factors.getInputValidity(
          name,
          value,
          name in this.props.questionMenuStates.factorAnswerScales
            ? this.props.questionMenuStates.factorAnswerScales[name].unitName
            : undefined
        ),
      },
      changedSinceLastCommit: true,
      factorAnswers: newFactorAnswers,
      ...newMasks,
    })
  }

  handleIgnoreFactor(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name } = e.currentTarget;
    const factorname = name;
    const value = e.currentTarget.checked;
    let prevState = this.props.questionMenuStates

    const newFactorAnswers = { ...this.props.questionMenuStates.factorAnswers, [name]: "" };
    const newMasks = this.makeNewMasksUpdateObject(
      newFactorAnswers,
      name,
      this.props.questionMenuStates.factorMaskings
    );

    this.setQuestionMenuState({
      ...prevState,
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
    })
  }

  handleUnitChange(name: string, newUnitName: string): void {
    let questionMenuStates = this.props.questionMenuStates

    this.setQuestionMenuState({
      ...questionMenuStates, factorAnswerScales: {
        ...this.props.questionMenuStates.factorAnswerScales,
        [name]: {
          unitName: newUnitName,
          scale: this.factors.getScalingFactor(name, newUnitName),
        },
      },
      validities: {
        ...this.props.questionMenuStates.validities,
        [name]: this.factors.getInputValidity(
          name,
          this.props.questionMenuStates.factorAnswers[name] as string,
          newUnitName
        ),
      },
      changedSinceLastCommit: true,
    })

    // this.setState((prevState: QuestionMenuStates) => {
    //   return {
    //     factorAnswerScales: {
    //       ...prevState.factorAnswerScales,
    //       [name]: {
    //         unitName: newUnitName,
    //         scale: this.factors.getScalingFactor(name, newUnitName),
    //       },
    //     },
    //     validities: {
    //       ...prevState.validities,
    //       [name]: this.factors.getInputValidity(
    //         name,
    //         this.state.factorAnswers[name] as string,
    //         newUnitName
    //       ),
    //     },
    //     changedSinceLastCommit: true,
    //   };
    // });
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
            factorAnswer={this.props.questionMenuStates.factorAnswers[factorName] as string}
            phrasing={factor.phrasing}
            unitOptions={(factor as NumericFactorPermanent).unitStrings}
            handleChange={this.handleInputChange}
            handleIgnoreFactor={this.handleIgnoreFactor}
            inputvalidity={this.props.questionMenuStates.validities[factorName]}
            helpText={this.getHelpText(factorName)}
            featured={featured}
            handleUnitChange={this.handleUnitChange}
            ignore={
              factorName in this.props.questionMenuStates.activelyIgnored
                ? this.props.questionMenuStates.activelyIgnored[factorName]
                : false
            }
            windowWidth={this.props.questionMenuStates.windowWidth}
            placeholder={
              factorName in this.props.questionMenuStates.factorAnswerScales
                ? this.props.questionMenuStates.factorAnswerScales[factorName].unitName
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
            factorAnswer={this.props.questionMenuStates.factorAnswers[factorName] as string}
            phrasing={factor.phrasing}
            options={(factor as StringFactorPermanent).options}
            handleChange={this.handleInputChange}
            handleIgnoreFactor={this.handleIgnoreFactor}
            helpText={this.getHelpText(factorName)}
            inputvalidity={this.props.questionMenuStates.validities[factorName]}
            featured={featured}
            ignore={
              factorName in this.props.questionMenuStates.activelyIgnored
                ? this.props.questionMenuStates.activelyIgnored[factorName]
                : false
            }
            windowWidth={this.props.questionMenuStates.windowWidth}
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
    this.setQuestionMenuStateWithCallback(
      {
        ...this.props.questionMenuStates,
        hasBeenAnswered: [],
        currentFactor: this.factorOrder[0],
        answeringProgress: AnswerProgress.ANSWERING,
      },
      () => this.redoAllValidities()
    );
  }

  previousQuestion() {
    let previousState = this.props.questionMenuStates
    let i = 0;
    if (previousState.hasBeenAnswered.includes(previousState.currentFactor)) {
      i =
        previousState.hasBeenAnswered.indexOf(previousState.currentFactor) -
        1;
    } else {
      i = previousState.hasBeenAnswered.length - 1;
    }
    while (
      previousState.hasBeenAnswered[i] in this.props.questionMenuStates.factorMaskings &&
      i > 0
    ) {
      i = i - 1;
    }
    const newCurrentFactor = previousState.hasBeenAnswered[i];

    this.setQuestionMenuState({
      ...previousState,
      currentFactor: newCurrentFactor,
      answeringProgress: AnswerProgress.ANSWERING,
      validities: {
        ...previousState.validities,
        [newCurrentFactor]: this.factors.getInputValidity(
          newCurrentFactor,
          previousState.factorAnswers[newCurrentFactor] as string,
          newCurrentFactor in previousState.factorAnswerScales
            ? previousState.factorAnswerScales[newCurrentFactor].unitName
            : undefined),
      },
    }
    )
  }

  finishQuestionnaire() {
    this.setQuestionMenuState({
      ...this.props.questionMenuStates,
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
    this.setQuestionMenuStateWithCallback(
      {
        ...this.props.questionMenuStates,
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
      this.factorOrder.length - Object.keys(this.props.questionMenuStates.factorMaskings).length;
    let numerator =
      this.factorOrder
        .filter((factorAnswer) => {
          return !(factorAnswer in this.props.questionMenuStates.factorMaskings);
        })
        .indexOf(this.props.questionMenuStates.currentFactor) + 1;
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
    return Object.keys(this.props.questionMenuStates.factorAnswers).find((factorName: string) => {
      return !(factorName in this.props.questionMenuStates.hasBeenAnswered);
    });
  }

  getQuestionToAnswer() {
    if (this.props.questionMenuStates.answeringProgress === AnswerProgress.FINISHED) {
      return (
        <AskedQuestionFramed
          factorName={undefined}
          validity={undefined}
          onSubmit={this.handleSubmit}
          previousPossible={
            this.factorOrder.indexOf(this.props.questionMenuStates.currentFactor) != 0
          }
          onPrevious={this.previousQuestion}
          onStartOver={this.startOverQuestionnaire}
          onFinishNow={this.finishQuestionnaire}
          onFinishRandomly={this.insertRandom}
          leftCornerCounter={this.getCounter()}
          onSwitchView={this.switchView}
          finished={true}
          isChanged={this.props.questionMenuStates.changedSinceLastCommit}
        />
      );
    }
    if (this.props.questionMenuStates.currentFactor) {
      return (
        <AskedQuestionFramed
          factorName={this.props.questionMenuStates.currentFactor}
          validity={this.props.questionMenuStates.validities[this.props.questionMenuStates.currentFactor]}
          onSubmit={this.handleSubmit}
          previousPossible={
            this.factorOrder.indexOf(this.props.questionMenuStates.currentFactor) !== 0
          }
          onPrevious={this.previousQuestion}
          onStartOver={this.startOverQuestionnaire}
          onFinishNow={this.finishQuestionnaire}
          onFinishRandomly={this.insertRandom}
          leftCornerCounter={this.getCounter()}
          onSwitchView={this.switchView}
          finished={false}
          isChanged={this.props.questionMenuStates.changedSinceLastCommit}
        >
          {this.getQuestion(
            this.props.questionMenuStates.currentFactor,
            this.factors.factorList[this.props.questionMenuStates.currentFactor],
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
        this.props.questionMenuStates.hasBeenAnswered.includes(factorName) &&
        !(factorName in this.props.questionMenuStates.factorMaskings)
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
          Input risk factors to calculate probability of dying of most diseases
          and expected lifespan
        </p>
        <Collapse
          in={this.props.questionMenuStates.view === QuestionView.QUESTION_MANAGER}
          onExited={() => {
            setTimeout(
              () => this.setQuestionMenuState({ ...this.props.questionMenuStates, view: QuestionView.QUESTION_LIST }),
              250
            );
          }}
          timeout={500}
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
        <Collapse
          in={this.props.questionMenuStates.view === QuestionView.QUESTION_LIST}
          onExited={() => {
            this.setQuestionMenuState({ ...this.props.questionMenuStates, view: QuestionView.QUESTION_MANAGER });
          }}
          timeout={500}
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
                isChanged={this.props.questionMenuStates.changedSinceLastCommit}
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
    if (Object.keys(this.props.questionMenuStates.validities).length === 0 || Object.keys(this.props.questionMenuStates.factorAnswers).length === 0) {
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
