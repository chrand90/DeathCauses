import React from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { InputValidity } from "../models/FactorAbstract";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import { FormControlStyle, CHANGED_COLOR } from "./Question";
import ButtonToolbar from "react-bootstrap/esm/ButtonToolbar";
import { ComputationState } from "../stores/ComputationStateStore";
import RootStore, { withStore } from "../stores/rootStore";
import { Spinner } from "react-bootstrap";
import { observer } from "mobx-react";
import FileUploader from "./FileUploader";
import FileDownloader from "./FileDownloader";

interface QuestionOptionsProps {
  disableGoToEnd: boolean;
  store: RootStore;
}

interface QuestionOptionsStates {
  showInputFiles: boolean;
  showSaveFiles: boolean;
}

class QuestionOptionsWithoutStore extends React.Component<
  QuestionOptionsProps,
  QuestionOptionsStates
> {
  constructor(props: QuestionOptionsProps) {
    super(props);
    this.state = {
      showInputFiles: false,
      showSaveFiles: false,
    };
    this.startOverQuestionnaire=this.startOverQuestionnaire.bind(this);
    this.insertRandom = this.insertRandom.bind(this);
    this.insertRandomInUnanswered=this.insertRandomInUnanswered.bind(this);
  }

  toggleInputFileCard() {
    this.setState({ showInputFiles: !this.state.showInputFiles });
  }

  toggleSaveFileCard() {
    this.setState({ showSaveFiles: !this.state.showSaveFiles });
  }

  startOverQuestionnaire() {
    this.props.store.questionProgressStore.startOverQuestionnaire();
    this.props.store.factorInputStore.resetValidities();
  }

  insertRandom() {
    const {
      factorAnswers,
      factorMaskings,
    } = this.props.store.loadedDataStore.factors.simulateFactorAnswersAndMaskings();
    this.props.store.factorInputStore.setFactorAnswers(factorAnswers, factorMaskings)
    this.props.store.questionProgressStore.finishQuestionnaireStartOverview();
  }

  insertRandomInUnanswered() {
    const {
      factorAnswers,
      factorMaskings,
    } = this.props.store.loadedDataStore.factors.simulateNonAnswered(this.props.store.factorInputStore.factorAnswers);
    this.props.store.factorInputStore.setFactorAnswers(factorAnswers, factorMaskings)
    this.props.store.questionProgressStore.finishQuestionnaireStartOverview();
  }

  render() {
    return (
      <div>
        <DropdownButton id="dropdown-basic-button" title="Options" size="sm">
          <Dropdown.Item onClick={this.startOverQuestionnaire} id="startover">
            Start over
          </Dropdown.Item>
          <Dropdown.Item onClick={this.props.store.questionProgressStore.finishQuestionnaireStartOverview} disabled={this.props.disableGoToEnd} id="gotoend">
            Go to end
          </Dropdown.Item>
          <Dropdown.Item onClick={this.insertRandom} id="random-everything">
            Randomize everything
          </Dropdown.Item>
          <Dropdown.Item onClick={this.insertRandomInUnanswered} id="random-unanswered">
            Randomize unanswered
          </Dropdown.Item>
          <Dropdown.Item onClick={() => this.toggleInputFileCard()} id="uselocalfile">
            Use local file
          </Dropdown.Item>
          <Dropdown.Item onClick={() => this.toggleSaveFileCard()} id="savedata">
            Save your input data
          </Dropdown.Item>
        </DropdownButton>
        {this.state.showInputFiles ? (
          <FileUploader toggler={() => this.toggleInputFileCard()} />
        ) : null}
        {this.state.showSaveFiles ? (
            <FileDownloader toggler={()=> this.toggleSaveFileCard()}/>
        ) : null}
      </div>
    );
  }
}
const QuestionOptions = observer(withStore(QuestionOptionsWithoutStore));
export default QuestionOptions;
