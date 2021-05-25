import React from "react";
import Collapse from "react-bootstrap/Collapse";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import "./AdvancedOptions.css";
import {
  BACKGROUNDCOLOR_DISABLED,
  CHANGED_COLOR,
  ERROR_COLOR,
  FormControlStyle,
  TEXTCOLOR_DISABLED,
} from "./Question";
import { FactorAnswers } from "../models/Factors";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import InputGroup from "react-bootstrap/InputGroup";
import { InputValidity } from "../models/FactorAbstract";
import { Spinner } from "react-bootstrap";
import RootStore, {withStore} from "../stores/rootStore";
import { observer } from "mobx-react";
import { ComputationState } from "../stores/ComputationStateStore";
import { Threading } from "../stores/AdvancedOptionsStore";


const ERROR_STYLE = { borderColor: ERROR_COLOR };
const INPUT_NOT_WHOLE = "Input should be a whole number";


interface AdvancedOptionsProps {
  store: RootStore
}

enum CollapseStatus {
  OPEN = "open",
  CLOSED = "closed",
}

interface AdvancedOptionsStates {
  open: boolean;
  collapseStatus: CollapseStatus;
}

class AdvancedOptionsMenuWithoutStore extends React.PureComponent<
  AdvancedOptionsProps,
  AdvancedOptionsStates
> {

  constructor(props: AdvancedOptionsProps) {
    super(props);

    this.state = {
      open: false,
      collapseStatus: CollapseStatus.CLOSED,
    };
    this.handleAgeChange = this.handleAgeChange.bind(this);
    this.handleAgeFromSetting = this.handleAgeFromSetting.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleRadioChange = this.handleRadioChange.bind(this);
    this.setToDefault = this.setToDefault.bind(this);
  }

  handleAgeChange(ev: React.ChangeEvent<HTMLInputElement>): void {
    const { name: factorname } = ev.currentTarget;
    const value = ev.currentTarget.value;
    if(factorname==="ageFrom"){
      this.props.store.advancedOptionsStore.setAgeFrom(value);
    }
    else if(factorname==="ageTo"){
      this.props.store.advancedOptionsStore.setAgeTo(value);
    }
  }

  handleRadioChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const value = ev.currentTarget.value as Threading;
    this.props.store.advancedOptionsStore.setThreading(value);
  }


  handleAgeFromSetting(e: React.ChangeEvent<HTMLInputElement>): void {
    const checked = e.currentTarget.checked;
    this.props.store.advancedOptionsStore.setAgeFromSet(checked)
  }

  sameAsInputAgeFrom() {
    return (
      <div style={{ marginLeft: "30px" }}>
        <Form.Check
          name={"AgeFromNull"}
          onChange={this.handleAgeFromSetting}
          checked={!this.props.store.advancedOptionsStore.ageFromSet}
          label="Use age from user input"
        />
      </div>
    );
  }

  ageFromRow() {
    let style: FormControlStyle = {};
    if (this.props.store.advancedOptionsStore.validities["ageFrom"].status==="Error"){
      style["borderColor"] = ERROR_COLOR;
    }
    if (!this.props.store.advancedOptionsStore.ageFromSet) {
      style["backgroundColor"] = BACKGROUNDCOLOR_DISABLED;
      style["color"] = TEXTCOLOR_DISABLED;
    }
    return (
      <div style={{ marginLeft: "20px", marginRight: "20px" }}>
        <Form.Row>
          <Col md={6}>
            <Form.Label>Start computation at age</Form.Label>
          </Col>
          <Col md={6}>
            <InputGroup>
              {this.ageFromAgeToTextfield(
                "ageFrom",
                this.props.store.advancedOptionsStore.ageFrom,
                style,
                !this.props.store.advancedOptionsStore.ageFromSet
              )}
              <InputGroup.Append>{this.sameAsInputAgeFrom()}</InputGroup.Append>
            </InputGroup>
          </Col>
        </Form.Row>
      </div>
    );
  }

  handleSubmit() {
    if(this.props.store.advancedOptionsStore.submittable){
      this.props.store.advancedOptionsStore.submitOptions();
    }
    if(Object.keys(this.props.store.computationStore.submittedFactorAnswers).length>0){
      this.props.store.computationStore.compute(this.props.store.computationStore.submittedFactorAnswers);
    }
  }

  setToDefault() {
    this.props.store.advancedOptionsStore.setDefault();
  }

  ageToRow() {
    const style= this.props.store.advancedOptionsStore.validities["ageTo"].status==="Error" ? 
      ERROR_STYLE : {};
    return (
      <div style={{ marginLeft: "20px", marginRight: "20px" }}>
        <Form.Row>
          <Col>
            <Form.Label>End computation at age</Form.Label>
          </Col>
          <Col>
            <InputGroup>
              {this.ageFromAgeToTextfield(
                "ageTo",
                this.props.store.advancedOptionsStore.ageTo,
                style,
                false
              )}
            </InputGroup>
          </Col>
        </Form.Row>
      </div>
    );
  }

  ageFromAgeToTextfield(
    placeholder: string,
    value: string | number,
    formControlStyle: FormControlStyle,
    disabled: boolean
  ) {
    return (
      <div style={{ maxWidth: "100px" }}>
        <Form.Control
          type="text"
          placeholder="Years"
          defaultValue={value}
          name={placeholder}
          value={value}
          style={formControlStyle}
          onChange={this.handleAgeChange}
          disabled={disabled}
        />
      </div>
    );
  }

  buttons(errorMessage: string) {
    const nextButtonStyle: FormControlStyle = {};
    if (this.props.store.advancedOptionsStore.changedSetting) {
      nextButtonStyle["backgroundColor"] = CHANGED_COLOR;
    }
    return (
      <Row style={{ marginTop: "5px", marginBottom: "15px" }}>
        <Col style={{ textAlign: "right" }}>
          <Button onClick={this.props.store.advancedOptionsStore.setDefault} disabled={this.props.store.advancedOptionsStore.optionsEqualToDefault()}>Default values</Button>
        </Col>
        <Col style={{ textAlign: "left" }}>
          <Button
            className="submitbutton"
            style={nextButtonStyle}
            disabled={errorMessage !== ""}
            onClick={this.handleSubmit}
          >
            {this.props.store.computationStateStore.computationState === ComputationState.CHANGED ? (
              "Compute*"
            ) : this.props.store.computationStateStore.computationState === ComputationState.RUNNING ? (
              <Spinner animation="border" size="sm"></Spinner>
            ) : (
              "Compute"
            )}
          </Button>
          {errorMessage === "" ? (
            ""
          ) : (
            <Form.Label style={{ color: ERROR_COLOR, fontSize: "14px" }}>
              {" "}
              {errorMessage}
            </Form.Label>
          )}
        </Col>
      </Row>
    );
  }

  threadingRow() {
    return (
      <div style={{ marginLeft: "20px", marginRight: "20px" }}>
        <Form.Row>
          <Col md={6}>
            <Form.Label>Threading </Form.Label>
          </Col>
          <Col md={6}>
            <Form.Check
              type="radio"
              name="threading"
              id={Threading.SINGLE}
              label="One thread"
              value={Threading.SINGLE}
              onChange={this.handleRadioChange}
              checked={this.props.store.advancedOptionsStore.threading === Threading.SINGLE}
            />
            <Form.Check
              type="radio"
              name="threading"
              id={Threading.MULTI}
              label="Two threads"
              value={Threading.MULTI}
              onChange={this.handleRadioChange}
              checked={this.props.store.advancedOptionsStore.threading === Threading.MULTI}
            />
          </Col>
        </Form.Row>
      </div>
    );
  }

  render() {
    let errorMessage: string = "";
    Object.entries(this.props.store.advancedOptionsStore.validities).forEach(
      ([notImportant, validity]) => {
        if (validity.status === "Error") {
          errorMessage = validity.message;
        }
      }
    );
    return (
      <div
        style={{ paddingRight: "20px", paddingLeft: "40px", textAlign: "left" }}
      >
        <Button
          onClick={() => this.setState({ open: !this.state.open })}
          variant="link"
          className="collapsebutton"
          style={this.state.open ? {} : { backgroundColor: "white" }}
        >
          {this.state.open ? "\u25BC" : "\u25B6"} Advanced Options
        </Button>
        <Collapse
          in={this.state.open}
          onEntered={() => {
            this.setState({ collapseStatus: CollapseStatus.OPEN });
          }}
          onExit={() => {
            this.setState({ collapseStatus: CollapseStatus.CLOSED });
          }}
        >
          <div className={"bordereddiv " + this.state.collapseStatus}>
            {this.buttons(errorMessage)}
            <hr></hr>
            {this.ageFromRow()}
            <hr></hr>
            {this.ageToRow()}
            <hr></hr>
            {this.threadingRow()}
          </div>
        </Collapse>
      </div>
    );
  }
}

function orderValidity(smallerInput: string, largerInput: string) {
  return parseInt(smallerInput) <= parseInt(largerInput);
}

function wholeNumberValidity(input: string) {
  const numberRegex = new RegExp("^[0-9]+$");
  return numberRegex.test(input);
}

const AdvancedOptionsMenu= withStore(observer(AdvancedOptionsMenuWithoutStore)) 
export default AdvancedOptionsMenu;
