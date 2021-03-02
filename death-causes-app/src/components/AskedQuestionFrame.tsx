import React from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { ButtonToolbar } from "reactstrap";
import { InputValidity } from "../models/FactorAbstract";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import { FormControlStyle, CHANGED_COLOR } from "./Question";

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
  isChanged: boolean;
}

class AskedQuestionFramed extends React.Component<AskedQuestionProps, any> {

  getMovingOnButton(){
    const disabled=(this.props.validity !== undefined  && this.props.validity.status === "Error")
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
    if(this.props.isChanged && !this.props.finished){
      buttonStyle["backgroundColor"]=CHANGED_COLOR
    }
    return (
      <Button disabled={disabled} 
      onClick={onClick} 
      aria-contols="collapse-asked-question-frame"
      style={buttonStyle}>
        {buttonText}
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

export default AskedQuestionFramed;
