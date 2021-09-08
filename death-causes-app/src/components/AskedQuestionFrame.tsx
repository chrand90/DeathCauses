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
import QuestionOptions from "./QuestionOptions";
import { AnswerProgress, QuestionView } from "../stores/QuestionProgressStore";

interface AskedQuestionProps {
  factorName: string | undefined;
  validity: InputValidity | undefined;
  onSubmit: (event: React.FormEvent) => void;
  finished: boolean;
  store: RootStore;
}

class AskedQuestionFramedWithoutStore extends React.Component<AskedQuestionProps, any> {

  constructor(props: AskedQuestionProps){
    super(props);
    this.previousQuestion = this.previousQuestion.bind(this);
  }

  previousQuestion() {
    this.props.store.questionProgressStore.previousQuestion(this.props.store.factorInputStore.factorMaskings);
    this.props.store.factorInputStore.updateSpecificValidity(this.props.store.questionProgressStore.currentFactor);
  }

  previousPossible(){
    return this.props.store.loadedDataStore.factorOrder.indexOf(this.props.store.questionProgressStore.currentFactor) !== 0
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

  getMovingOnButton(){
    const disabled=(this.props.validity !== undefined  && 
        this.props.validity.status === "Error") || 
      this.props.store.computationStateStore.computationState===ComputationState.RUNNING ||
      !this.props.store.loadedDataStore.loadedVizWindowData
    let buttonStyle: FormControlStyle={};
    let onClick: (ev: React.FormEvent) => void;
    let buttonText: string;
    if(this.props.finished){
      onClick= (ev: React.FormEvent) => {
        ev.preventDefault()
        this.props.store.questionProgressStore.switchView(QuestionView.NOTHING);
       }
       buttonText="Overview"
    }
    else{
      onClick=this.props.onSubmit
      buttonText="Next"
    }
    if(this.props.store.computationStateStore.computationState!==ComputationState.READY && !this.props.finished){
      buttonStyle["backgroundColor"]=CHANGED_COLOR
      buttonText="Next*"
    }
    return (
      <Button
      className="submitbutton" 
      disabled={disabled} 
      onClick={onClick} 
      aria-contols="collapse-asked-question-frame"
      style={buttonStyle}>

        {this.props.store.computationStateStore.computationState===ComputationState.RUNNING ? <Spinner animation="border" size="sm"></Spinner> : buttonText}
      </Button>
    )
  }


  render() {
    const minHeight = this.props.store.uIStore.windowWidth<501 ? "360px" : "300px"
    return (
      <div>
      <Card style={{ marginBottom: "20px", minHeight: minHeight,maxWidth:"500px",marginRight:"auto", marginLeft:"auto" }}>
        <Card.Header>
        <div className="d-flex justify-content-between">
          <div>
            {this.getCounter()}
          </div>
          <Card.Title>
            {this.props.factorName ? this.props.store.loadedDataStore.descriptions.getDescription(this.props.factorName,25) : "No more questions"}
          </Card.Title>
        <div>
          {""}
        </div>
        </div>
        </Card.Header>
        <Card.Body>{this.props.children}</Card.Body>
        <Card.Footer>
          <ButtonToolbar className="d-flex justify-content-between flex-wrap">
            <ButtonGroup>
              <Button
                disabled={!this.previousPossible()}
                onClick={this.previousQuestion}
              >
                Previous
              </Button>
            </ButtonGroup>
            <ButtonGroup>
              <QuestionOptions disableGoToEnd={false}/>
            </ButtonGroup>
            <ButtonGroup>
              {this.getMovingOnButton()}
            </ButtonGroup>
          </ButtonToolbar>
        </Card.Footer>
      </Card>
      </div>
    );
  }
}
const AskedQuestionFramed= withStore(observer(AskedQuestionFramedWithoutStore));
export default AskedQuestionFramed;
