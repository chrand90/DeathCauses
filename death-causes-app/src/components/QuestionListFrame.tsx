import React from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { ButtonToolbar } from "reactstrap";
import "./QuestionMenu.css";
import { ERROR_COLOR, FormControlStyle, CHANGED_COLOR } from "./Question";

interface QuestionListFrameProps {
  onSubmit: (event: React.FormEvent) => void;
  onSwitchView: () => void;
  onFinishRandomly: () => void;
  isChanged: boolean;
  hasError: boolean;
}

//the following is the minimum header width for the card. The variables are
//1200 is the screen size for which the questionmenu is most narrow.
// 5/7 is the proportion of the screen covered by question menu
// 18*2 are the padding of the questionmenu-div
// 1*2 are the borders of Card.
// 20*2 are the padding of the Card.Title
const MIN_HEADER_WIDTH= 1200*5/7-18*2-1*2-20*2;
const MAX_BUTTON_WIDTH=(MIN_HEADER_WIDTH/2-20).toPrecision()+'px';


class QuestionListFrame extends React.Component<QuestionListFrameProps, any> {

  submitButtonMessage(){
    if(this.props.hasError){
      return <span style={{color: ERROR_COLOR, fontSize:"small"}}> *Errors in the inputs </span>
    }
    if(this.props.isChanged){
      return <span style={{color: CHANGED_COLOR, fontSize:"small"}}> *Submit changes </span>
    }
    return <span style={{fontSize:"small"}}>No changes</span>
  }

  makeSubmitButton(){
    let buttonStyle: FormControlStyle={}
    let buttonText="Compute"
    if(this.props.isChanged || this.props.hasError){
      buttonStyle["backgroundColor"]=CHANGED_COLOR;
      buttonText="*"+buttonText
    }
    return (
      <div>
        <div>
        <Button onClick={this.props.onSubmit} style={buttonStyle} disabled={this.props.hasError}>
          {buttonText}
        </Button>
        </div>
       <div style={{float:"right"}}>
       {this.submitButtonMessage()}
       </div>
      </div>
    )
  }

  render() {
    return (
      <Card style={{ marginBottom: "20px", maxWidth:"600px" }}>
        <Card.Header>
          <div className="d-flex justify-content-between">
            <div>
              <Button onClick={this.props.onSwitchView}>Back to the questions</Button>
            </div>
            {this.makeSubmitButton()}
          </div>
        </Card.Header>
        <Card.Body>
          {this.props.children}
        </Card.Body>
        <Card.Footer>
          <ButtonToolbar className="justify-content-between">
            <ButtonGroup>
              <Button>Something</Button>
            </ButtonGroup>
            <ButtonGroup>
            {this.makeSubmitButton()}
            </ButtonGroup>
          </ButtonToolbar>
        </Card.Footer>
      </Card>
    );
  }
}

export default QuestionListFrame;
