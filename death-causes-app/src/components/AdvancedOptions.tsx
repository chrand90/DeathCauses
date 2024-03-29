import { observer } from "mobx-react";
import React from "react";
import { Spinner } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Collapse from "react-bootstrap/Collapse";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row";
import { EVALUATION_UNIT, Threading } from "../stores/AdvancedOptionsStore";
import { ComputationState } from "../stores/ComputationStateStore";
import RootStore, { withStore } from "../stores/rootStore";
import InternalRedirectButton from "./InternalRedirectButton";
import "./AdvancedOptions.css";
import {
  BACKGROUNDCOLOR_DISABLED,
  CHANGED_COLOR,
  ERROR_COLOR,
  FormControlStyle,
  TEXTCOLOR_DISABLED
} from "./Question";


const ERROR_STYLE = { borderColor: ERROR_COLOR };
interface AdvancedOptionsProps {
  store: RootStore
}

enum CollapseStatus {
  OPEN = "open",
  CLOSED = "closed",
}

interface AdvancedOptionsStates {
  collapseStatus: CollapseStatus;
}

class AdvancedOptionsMenuWithoutStore extends React.PureComponent<
  AdvancedOptionsProps,
  AdvancedOptionsStates
> {

  constructor(props: AdvancedOptionsProps) {
    super(props);

    this.state = {
      collapseStatus: CollapseStatus.CLOSED,
    };
    this.handleAgeChange = this.handleAgeChange.bind(this);
    this.handleAgeFromSetting = this.handleAgeFromSetting.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleRadioChange = this.handleRadioChange.bind(this);
    this.setToDefault = this.setToDefault.bind(this);
    this.handleUpdateEvaluationUnit = this.handleUpdateEvaluationUnit.bind(this);
  }

  handleAgeChange(ev: React.ChangeEvent<HTMLInputElement>): void {
    const { name: factorname } = ev.currentTarget;
    const value = ev.currentTarget.value;
    if (factorname === "ageFrom") {
      this.props.store.advancedOptionsStore.setAgeFrom(value);
    }
    else if (factorname === "ageTo") {
      this.props.store.advancedOptionsStore.setAgeTo(value);
    }
  }

  handleRadioChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const value = ev.currentTarget.value as Threading;
    this.props.store.advancedOptionsStore.setThreading(value);
  }


  handleAgeFromSetting(e: React.ChangeEvent<HTMLInputElement>): void {
    const checked = e.currentTarget.checked;
    this.props.store.advancedOptionsStore.setAgeFromSet(!checked)
  }

  handleUpdateEvaluationUnit(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.currentTarget.value as EVALUATION_UNIT
    this.props.store.advancedOptionsStore.setEvaluationUnit(value)
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
    if (this.props.store.advancedOptionsStore.validities["ageFrom"].status === "Error") {
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
            <Form.Label>Start <InternalRedirectButton direct={"advancedOptions#computation-period"}> computation</InternalRedirectButton> at age</Form.Label>
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
    if (this.props.store.advancedOptionsStore.submittable) {
      this.props.store.advancedOptionsStore.submitOptions();
      this.props.store.computationStore.reset();
    }
    if (Object.keys(this.props.store.computationStore.submittedFactorAnswers).length > 0) {
      this.props.store.computationStore.compute();
    }
  }

  setToDefault() {
    this.props.store.advancedOptionsStore.setDefault();
  }

  ageToRow() {
    const style = this.props.store.advancedOptionsStore.validities["ageTo"].status === "Error" ?
      ERROR_STYLE : {};
    return (
      <div style={{ marginLeft: "20px", marginRight: "20px" }}>
        <Form.Row>
          <Col>
            <Form.Label>End <InternalRedirectButton direct={"advancedOptions#computation-period"}> computation</InternalRedirectButton> at age</Form.Label>
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
            className="submitbutton wider"
            style={nextButtonStyle}
            disabled={!this.props.store.advancedOptionsStore.submittable || !this.props.store.advancedOptionsStore.changedSetting}
            onClick={this.handleSubmit}
          >
            {this.props.store.advancedOptionsStore.changedSetting ? (
              "Apply changes*"
            ) : this.props.store.computationStateStore.computationState === ComputationState.RUNNING ? (
              <Spinner animation="border" size="sm"></Spinner>
            ) : (
              "Apply changes"
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
            <Form.Label><InternalRedirectButton direct={"advancedOptions#threading"}> Threading</InternalRedirectButton> </Form.Label>
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

  evaluationUnitRow() {
    const value = this.props.store.advancedOptionsStore.evaluationUnit
    return (
      <div style={{ marginLeft: "20px", marginRight: "20px" }}>
        <Form.Row>
          <Col>
            <Form.Label><InternalRedirectButton direct={"advancedOptions#evaluation-unit"}> Evaluation</InternalRedirectButton> method</Form.Label>
          </Col>
          <Col>
            <InputGroup>
              <div style={{ maxWidth: "100%" }}>
                <Form.Control
                  as="select"
                  defaultValue={EVALUATION_UNIT.PROBABILITY}
                  name={"test"}
                  value={value}
                  onChange={this.handleUpdateEvaluationUnit}
                >
                  {(Object.keys(EVALUATION_UNIT) as (keyof typeof EVALUATION_UNIT)[]).map(key => {
                  return <option value = {EVALUATION_UNIT[key]}>{EVALUATION_UNIT[key]} </option> 
                })}
                </Form.Control>
              </div>
            </InputGroup>
          </Col>
        </Form.Row>
      </div>
    )
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
          onClick={() => this.setState({ collapseStatus: this.state.collapseStatus === CollapseStatus.CLOSED ? CollapseStatus.OPEN : CollapseStatus.CLOSED })}
          variant="link"
          className="collapsebutton"
          style={this.state.collapseStatus === CollapseStatus.OPEN ? {} : { backgroundColor: "white" }}
        >
          {this.state.collapseStatus === CollapseStatus.OPEN ? "\u25BC" : "\u25B6"} Advanced Options
        </Button>
        <Collapse
          in={this.state.collapseStatus === CollapseStatus.OPEN}
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
            {this.evaluationUnitRow()}
            <hr></hr>
            {this.threadingRow()}
          </div>
        </Collapse>
      </div>
    );
  }
}

const AdvancedOptionsMenu = withStore(observer(AdvancedOptionsMenuWithoutStore))
export default AdvancedOptionsMenu;
