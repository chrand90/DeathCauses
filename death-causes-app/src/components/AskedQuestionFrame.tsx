import React from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { ButtonToolbar } from "reactstrap";
import { InputValidity } from "../models/FactorAbstract";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import { FormControlStyle, CHANGED_COLOR } from "./Question";
import { ComputationState } from "../stores/ComputationStateStore";
import Spinner from "react-bootstrap/Spinner";
import RootStore, { StoreContext, withStore } from "../stores/rootStore";
import { observer } from "mobx-react";

interface AskedQuestionProps {
  factorName: string | undefined;
  validity: InputValidity | undefined;
  onSubmit: (event: React.FormEvent) => void;
  previousPossible: boolean;
  onPrevious: () => void;
  onStartOver: () => void;
  onFinishNow: () => void;
  onFinishRandomly: () => void;
  leftCornerCounter: string;
  onSwitchView: () => void;
  finished: boolean;
  computationState: ComputationState;
}

class AskedQuestionFramedWithoutStore extends React.Component<AskedQuestionProps, any> {

  getMovingOnButton(){
    const disabled=(this.props.validity !== undefined  && this.props.validity.status === "Error") || this.props.computationState===ComputationState.RUNNING
    let buttonStyle: FormControlStyle={};
    let onClick: (ev: React.FormEvent) => void;
    let buttonText: string;
    if(this.props.finished){
      onClick= (ev: React.FormEvent) => {
        ev.preventDefault()
        this.props.onSwitchView()
       }
       buttonText="Overview"
    }
    else{
      onClick=this.props.onSubmit
      buttonText="Next"
    }
    if(this.props.computationState!==ComputationState.READY && !this.props.finished){
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

        {this.props.computationState===ComputationState.RUNNING ? <Spinner animation="border" size="sm"></Spinner> : buttonText}
      </Button>
    )
  }

  render() {
    return (
      <Card style={{ marginBottom: "20px", minHeight: "300px", maxHeight:"300px",maxWidth:"500px",marginRight:"auto", marginLeft:"auto" }}>
        <Card.Header>
        <div className="d-flex justify-content-between">
          <div>
            {this.props.leftCornerCounter}
          </div>
          <Card.Title>
            {this.props.factorName ? this.props.factorName : "No more questions"}
          </Card.Title>
        <div>
          {""}
        </div>
        </div>
        </Card.Header>
        <Card.Body>{this.props.children}</Card.Body>
        <Card.Footer>
          <ButtonToolbar className="justify-content-between">
            <ButtonGroup>
              <Button
                disabled={!this.props.previousPossible}
                onClick={this.props.onPrevious}
              >
                Previous
              </Button>
            </ButtonGroup>
            <ButtonGroup>
              <DropdownButton
                id="dropdown-basic-button"
                title="Options"
                size="sm"
              >
                <Dropdown.Item onClick={this.props.onStartOver}>Start over</Dropdown.Item>
                <Dropdown.Item onClick={this.props.onFinishNow}>Go to end</Dropdown.Item>
                <Dropdown.Item onClick={this.props.onFinishRandomly}>Random</Dropdown.Item>
              </DropdownButton>
            </ButtonGroup>
            <ButtonGroup>
              {this.getMovingOnButton()}
            </ButtonGroup>
          </ButtonToolbar>
        </Card.Footer>
      </Card>
    );
  }
}
const AskedQuestionFramed= observer(withStore(AskedQuestionFramedWithoutStore));
export default AskedQuestionFramed;
