import React from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import ButtonToolbar from "react-bootstrap/esm/ButtonToolbar";
import "./QuestionMenu.css";
import { ERROR_COLOR, FormControlStyle, CHANGED_COLOR } from "./Question";
import { ComputationState } from "../stores/ComputationStateStore";
import Spinner from "react-bootstrap/Spinner";
import RootStore, { withStore } from "../stores/rootStore";
import { observer } from "mobx-react";
import {SAVE_FILE_NAME} from "./Helpers";
import FileDownloader from "./FileDownloader";
import { QuestionView } from "../stores/QuestionProgressStore";
import QuestionOptions from "./QuestionOptions";

interface QuestionListFrameProps {
  onSubmit: (event: React.FormEvent) => void;
  store: RootStore;
}

interface QuestionListFrameStates {
  showSaveMenu: boolean;
}

//the following is the minimum header width for the card. The variables are
//1200 is the screen size for which the questionmenu is most narrow.
// 5/7 is the proportion of the screen covered by question menu
// 18*2 are the padding of the questionmenu-div
// 1*2 are the borders of Card.
// 20*2 are the padding of the Card.Title
const MIN_HEADER_WIDTH = (1200 * 5) / 7 - 18 * 2 - 1 * 2 - 20 * 2;
const MAX_BUTTON_WIDTH = (MIN_HEADER_WIDTH / 2 - 20).toPrecision() + "px";

class QuestionListFrameWithoutStore extends React.Component<QuestionListFrameProps, QuestionListFrameStates> {
  
  constructor(props: QuestionListFrameProps){
    super(props);
    this.state = {
      showSaveMenu: false
    }
  }
  
  submitButtonMessage() {
    if (!this.props.store.factorInputStore.submittable) {
      return (
        <span style={{ color: ERROR_COLOR, fontSize: "small" }}>
          {" "}
          *Errors in the inputs{" "}
        </span>
      );
    }
    if (this.props.store.computationStateStore.computationState === ComputationState.CHANGED) {
      return (
        <span style={{ color: CHANGED_COLOR, fontSize: "small" }}>
          {" "}
          *Submit changes{" "}
        </span>
      );
    }
    return <span style={{ fontSize: "small" }}>No changes</span>;
  }

  toggleSaveMenu(){
    this.setState({showSaveMenu: !this.state.showSaveMenu})
  }

  makeSubmitButton() {
    let buttonStyle: FormControlStyle = {};
    let buttonText = "Compute";
    if (
      this.props.store.computationStateStore.computationState !== ComputationState.READY ||
      !this.props.store.factorInputStore.submittable
    ) {
      buttonStyle["backgroundColor"] = CHANGED_COLOR;
      buttonText = "*" + buttonText;
    }
    return (
      <div>
        <div>
          <Button
            className="submitbutton"
            onClick={this.props.onSubmit}
            style={buttonStyle}
            disabled={
              !this.props.store.factorInputStore.submittable ||
              this.props.store.computationStateStore.computationState === ComputationState.RUNNING
            }
          >
            {this.props.store.computationStateStore.computationState !== ComputationState.RUNNING ? (
              buttonText
            ) : (
              <Spinner animation="border" size="sm"></Spinner>
            )}
          </Button>
        </div>
        <div style={{ float: "right" }}>{this.submitButtonMessage()}</div>
      </div>
    );
  }

  download(){
    if(!window.confirm("Are you sure you want to download your input data to your local machine?")){
      return false;
    }
    const bigObject = this.props.store.factorInputStore.getAllNecessaryInputs()
    const blob= new Blob([JSON.stringify(bigObject)], {type : 'application/json'});
    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);
    element.download =  SAVE_FILE_NAME;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }

  render() {
    return (
      <div>
      <Card
        style={{
          marginBottom: "20px",
          maxWidth: "600px",
          marginRight: "auto",
          marginLeft: "auto",
        }}
      >
        <Card.Header>
          <div className="d-flex justify-content-between">
            <div>
              <Button onClick={()=> this.props.store.questionProgressStore.switchView(QuestionView.NOTHING)}>
                Back to the questions
              </Button>
            </div>
            <QuestionOptions disableGoToEnd={true}/>
            {this.makeSubmitButton()}
          </div>
        </Card.Header>
        <Card.Body>{this.props.children}</Card.Body>
        <Card.Footer>
          <ButtonToolbar className="justify-content-between">
            <ButtonGroup>
              <Button onClick={() => this.toggleSaveMenu()}>Save personal data</Button>
            </ButtonGroup>
            <QuestionOptions disableGoToEnd={true}></QuestionOptions>
            <ButtonGroup>{this.makeSubmitButton()}</ButtonGroup>
          </ButtonToolbar>
        </Card.Footer>
      </Card>
      {this.state.showSaveMenu ? <FileDownloader toggler={() => this.toggleSaveMenu()}></FileDownloader> : null}
      </div>
    );
  }
}

const QuestionListFrame = withStore(observer(QuestionListFrameWithoutStore));
export default QuestionListFrame;
