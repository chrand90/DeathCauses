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
import { withRouter, RouteComponentProps } from "react-router";
import { QUERY_STRING_START } from "./Helpers";
import { AllNecessaryInputs } from "../stores/FactorInputStore";

interface QuestionMenuProps extends RouteComponentProps{
  store: RootStore;
}

class QuestionMenuWithoutStoreWithoutRouter extends React.Component<
  QuestionMenuProps
> {

  constructor(props: QuestionMenuProps) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount(){
    const queryString=this.props.location.search;
    if(queryString.startsWith(QUERY_STRING_START)){
      const afterStart = queryString.slice(QUERY_STRING_START.length)
      try {
        const urlJSON=JSON.parse(decodeURIComponent(afterStart)) as AllNecessaryInputs
        //Waiting for the next update cycle to apply the changes:
        setTimeout( 
          () => {
            this.props.store.factorInputStore.insertData(urlJSON);
            this.props.store.questionProgressStore.finishQuestionnaireStartOverview();
          },
          0
        )
              }
      catch(e: any){
        console.error("Could not decode the URL query string")
      }
      
    }
  }

  handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    this.props.store.factorInputStore.updateMissingValidities(
      this.props.store.questionProgressStore.hasBeenAnswered,
      this.props.store.questionProgressStore.currentFactor
    );
    if (this.props.store.factorInputStore.submittable && this.props.store.loadedDataStore.loadedVizWindowData) {
      this.props.store.questionProgressStore.nextQuestion(this.props.store.factorInputStore.factorMaskings);
      this.props.store.computationStore.compute(this.props.store.factorInputStore.computeSubmittedAnswers());
      if(this.props.store.uIStore.visualization===Visualization.NO_GRAPH){
        this.props.store.uIStore.setVisualization(Visualization.SUMMARY_VIEW);
      }
    }
  }

  getHelpText(factorName: string): string | null{
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

  getQuestionToAnswer() {
    if (this.props.store.questionProgressStore.answeringProgress === AnswerProgress.FINISHED) {
      return (
        <AskedQuestionFramed
          factorName={undefined}
          validity={undefined}
          onSubmit={this.handleSubmit}
          finished={true}
          />
      );
    }
    if (this.props.store.questionProgressStore.currentFactor) {
      return (
        <AskedQuestionFramed
          factorName={this.props.store.questionProgressStore.currentFactor}
          validity={this.props.store.factorInputStore.validities[this.props.store.questionProgressStore.currentFactor]}
          onSubmit={this.handleSubmit}
          finished={false}
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
      <div className="questionmenu" >
        <h4> Risk factors </h4>
        {this.renderQuestionList()}
      </div>
    );
  }
}

const QuestionMenu = withRouter(withStore(observer(QuestionMenuWithoutStoreWithoutRouter)));
export default QuestionMenu;
