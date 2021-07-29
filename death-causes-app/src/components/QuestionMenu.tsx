import { observer } from "mobx-react";
import React from "react";
import Collapse from "react-bootstrap/Collapse";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import GeneralFactor from "../models/FactorAbstract";
import NumericFactorPermanent from "../models/FactorNumber";
import StringFactorPermanent from "../models/FactorString";
import { AnswerProgress, QuestionView } from "../stores/QuestionProgressStore";
import RootStore, { withStore } from "../stores/rootStore";
import { Visualization } from "../stores/UIStore";
import AskedQuestionFramed from "./AskedQuestionFrame";
import DataPrivacyBox from "./DataPrivacyBox";
import QuestionListFrame from "./QuestionListFrame";
import "./QuestionMenu.css";
import SimpleNumericQuestion from "./QuestionNumber";
import SimpleStringQuestion from "./QuestionString";

interface QuestionMenuProps {
  store: RootStore;
}

class QuestionMenuWithoutStore extends React.Component<
  QuestionMenuProps
> {

  constructor(props: QuestionMenuProps) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.previousQuestion = this.previousQuestion.bind(this);
    this.startOverQuestionnaire = this.startOverQuestionnaire.bind(this);
    this.insertRandom = this.insertRandom.bind(this);
  }

  handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    this.props.store.factorInputStore.updateMissingValidities(
      this.props.store.questionProgressStore.hasBeenAnswered,
      this.props.store.questionProgressStore.currentFactor
    );
    if (this.props.store.factorInputStore.submittable) {
      this.props.store.questionProgressStore.nextQuestion(this.props.store.factorInputStore.factorMaskings);
      this.props.store.computationStore.compute(this.props.store.factorInputStore.computeSubmittedAnswers());
      if(this.props.store.uIStore.visualization===Visualization.NO_GRAPH){
        this.props.store.uIStore.setVisualization(Visualization.BAR_GRAPH);
      }
    }
  }

  getHelpText(factorName: string): string {
    return this.props.store.loadedDataStore.factors.getHelpJson(factorName);
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
            factorAnswer={this.props.store.factorInputStore.factorAnswers[factorName] as string}
            phrasing={factor.phrasing}
            unitOptions={(factor as NumericFactorPermanent).unitStrings}
            handleChange={this.props.store.factorInputStore.inputChangeWrapper}
            handleIgnoreFactor={this.props.store.factorInputStore.ignoreFactor}
            inputvalidity={this.props.store.factorInputStore.validities[factorName]}
            helpText={this.getHelpText(factorName)}
            featured={featured}
            handleUnitChange={this.props.store.factorInputStore.changeUnit}
            ignore={
              factorName in this.props.store.factorInputStore.activelyIgnored
                ? this.props.store.factorInputStore.activelyIgnored[factorName]
                : false
            }
            windowWidth={this.props.store.uIStore.windowWidth}
            placeholder={
              factorName in this.props.store.factorInputStore.factorAnswerScales
                ? this.props.store.factorInputStore.factorAnswerScales[factorName].unitName
                : factor.placeholder
            }
            descendantDeathCauses={this.props.store.loadedDataStore.factors.getDeathCauseDescendants(
              factorName
            )}
          />
        );
      }
      case "string": {
        return (
          <SimpleStringQuestion
            key={factorName + featured}
            name={factorName}
            placeholder={factor.placeholder}
            factorAnswer={this.props.store.factorInputStore.factorAnswers[factorName] as string}
            phrasing={factor.phrasing}
            options={(factor as StringFactorPermanent).options}
            handleChange={this.props.store.factorInputStore.inputChangeWrapper}
            handleIgnoreFactor={this.props.store.factorInputStore.ignoreFactor}
            helpText={this.getHelpText(factorName)}
            inputvalidity={this.props.store.factorInputStore.validities[factorName]}
            featured={featured}
            ignore={
              factorName in this.props.store.factorInputStore.activelyIgnored
                ? this.props.store.factorInputStore.activelyIgnored[factorName]
                : false
            }
            windowWidth={this.props.store.uIStore.windowWidth}
            descendantDeathCauses={this.props.store.loadedDataStore.rdat.getDeathCauseDescendants(
              factorName
            )}
          />
        );
      }
      default: {
        break;
      }
    }
  }

  startOverQuestionnaire() {
    this.props.store.questionProgressStore.startOverQuestionnaire();
    this.props.store.factorInputStore.resetValidities();
  }

  previousQuestion() {
    this.props.store.questionProgressStore.previousQuestion(this.props.store.factorInputStore.factorMaskings);
    this.props.store.factorInputStore.updateSpecificValidity(this.props.store.questionProgressStore.currentFactor);
  }

  insertRandom() {
    const {
      factorAnswers,
      factorMaskings,
    } = this.props.store.loadedDataStore.factors.simulateFactorAnswersAndMaskings();
    this.props.store.factorInputStore.setFactorAnswers(factorAnswers, factorMaskings)
    this.props.store.questionProgressStore.finishQuestionnaire();
  }

  getCounter() { //computed value that depends on two different stores and therefore easier just to put it here. 
    let denominator =
      this.props.store.loadedDataStore.factorOrder.length - Object.keys(this.props.store.factorInputStore.factorMaskings).length;
    let numerator =
      this.props.store.loadedDataStore.factorOrder
        .filter((factorAnswer) => {
          return !(factorAnswer in this.props.store.factorInputStore.factorMaskings);
        })
        .indexOf(this.props.store.questionProgressStore.currentFactor) + 1;
    if (numerator === 0) {
      //at the time of implementation it could happen if a property is changed in questionlist
      return "-/" + denominator;
    }
    if (numerator > denominator) {
      return denominator + "/" + denominator;
    }
    return numerator + "/" + denominator;
  }

  getQuestionToAnswer() {
    if (this.props.store.questionProgressStore.answeringProgress === AnswerProgress.FINISHED) {
      return (
        <AskedQuestionFramed
          factorName={undefined}
          validity={undefined}
          onSubmit={this.handleSubmit}
          previousPossible={
            this.props.store.loadedDataStore.factorOrder.indexOf(this.props.store.questionProgressStore.currentFactor) !== 0
          }
          onPrevious={this.previousQuestion}
          onStartOver={this.startOverQuestionnaire}
          onFinishNow={this.props.store.questionProgressStore.finishQuestionnaire}
          onFinishRandomly={this.insertRandom}
          leftCornerCounter={this.getCounter()}
          onSwitchView={() => {
            this.props.store.questionProgressStore.switchView(QuestionView.NOTHING);
          }}
          finished={true}
          computationState={this.props.store.computationStateStore.computationState}
        />
      );
    }
    if (this.props.store.questionProgressStore.currentFactor) {
      return (
        <AskedQuestionFramed
          factorName={this.props.store.questionProgressStore.currentFactor}
          validity={this.props.store.factorInputStore.validities[this.props.store.questionProgressStore.currentFactor]}
          onSubmit={this.handleSubmit}
          previousPossible={
            this.props.store.loadedDataStore.factorOrder.indexOf(this.props.store.questionProgressStore.currentFactor) !== 0
          }
          onPrevious={this.previousQuestion}
          onStartOver={this.startOverQuestionnaire}
          onFinishNow={this.props.store.questionProgressStore.finishQuestionnaire}
          onFinishRandomly={this.insertRandom}
          leftCornerCounter={this.getCounter()}
          onSwitchView={() => {
            this.props.store.questionProgressStore.switchView(QuestionView.NOTHING);
          }}
          finished={false}
          computationState={this.props.store.computationStateStore.computationState}
        >
          {this.getQuestion(
            this.props.store.questionProgressStore.currentFactor,
            this.props.store.loadedDataStore.factors.factorList[this.props.store.questionProgressStore.currentFactor],
            true
          )}
        </AskedQuestionFramed>
      );
    }
    return "Something went wrong";
  }

  renderQuestionList() {
    const questionList = this.props.store.loadedDataStore.factorOrder.map((factorName) => {
      if (
        this.props.store.questionProgressStore.hasBeenAnswered.includes(factorName) &&
        !(factorName in this.props.store.factorInputStore.factorMaskings)
      ) {
        return this.getQuestion(
          factorName,
          this.props.store.loadedDataStore.factors.factorList[factorName]
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
            in={this.props.store.questionProgressStore.view === QuestionView.QUESTION_MANAGER}
            onExited={() => this.props.store.questionProgressStore.switchView(QuestionView.QUESTION_LIST)}
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
            in={this.props.store.questionProgressStore.view === QuestionView.QUESTION_LIST}
            onExited={() => this.props.store.questionProgressStore.switchView(QuestionView.QUESTION_MANAGER)}
          >
            <Form onSubmit={this.handleSubmit}>
            <div
              id="collapse-question-list"
              style={{ justifyContent: "center" }}
            >
              <QuestionListFrame
                onSubmit={this.handleSubmit}
                onSwitchView={() => this.props.store.questionProgressStore.switchView(QuestionView.NOTHING)}
                onFinishRandomly={this.insertRandom}
                hasError={!this.props.store.factorInputStore.submittable}
                computationState={this.props.store.computationStateStore.computationState}
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
    if (Object.keys(this.props.store.factorInputStore.validities).length === 0) {
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

const QuestionMenu = withStore(observer(QuestionMenuWithoutStore));
export default QuestionMenu;
