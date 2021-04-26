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

export interface AdvancedOptions {
  ageFrom: number | null;
  ageTo: number;
  threading: Threading;
}

export enum Threading {
  SINGLE = "single",
  MULTI = "multi",
}

const ERROR_STYLE = { borderColor: ERROR_COLOR };
const INPUT_NOT_WHOLE = "Input should be a whole number";

interface AdvancedOptionsWithoutNull extends AdvancedOptions {
  ageFrom: number;
}

interface AdvancedOptionsProps {
  updateAdvancedOptions: (op: AdvancedOptions) => void;
  optionsSubmitted: AdvancedOptions;
  factorAnswers: FactorAnswers | null;
  reset: () => void;
}

enum CollapseStatus {
  OPEN = "open",
  CLOSED = "closed",
}

interface AdvancedOptionsStates {
  options: AdvancedOptionsWithoutNull;
  open: boolean;
  changedSinceLastCommit: boolean;
  disabledAgeFrom: boolean;
  collapseStatus: CollapseStatus;
  validities: { [inputfield: string]: InputValidity };
}

export default class AdvancedOptionsMenu extends React.PureComponent<
  AdvancedOptionsProps,
  AdvancedOptionsStates
> {
  constructor(props: AdvancedOptionsProps) {
    super(props);

    this.state = {
      options: {
        ...props.optionsSubmitted,
        ageFrom: props.optionsSubmitted.ageFrom
          ? props.optionsSubmitted.ageFrom
          : props.factorAnswers
          ? props.factorAnswers["Age"] !== ""
            ? (props.factorAnswers["Age"] as number)
            : 0
          : 0,
      },
      validities: {},
      open: false,
      changedSinceLastCommit: false,
      disabledAgeFrom: props.optionsSubmitted.ageFrom ? false : true,
      collapseStatus: CollapseStatus.CLOSED,
    };
    this.handleAgeChange = this.handleAgeChange.bind(this);
    this.handleAgeFromSetting = this.handleAgeFromSetting.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleRadioChange=this.handleRadioChange.bind(this);
    this.abort = this.abort.bind(this);
  }

  handleAgeChange(ev: React.ChangeEvent<HTMLInputElement>): void {
    const { name: factorname } = ev.currentTarget;
    const value = ev.currentTarget.value;
    this.setState(
      (prevState: AdvancedOptionsStates) => {
        return {
          options: { ...prevState.options, [factorname]: value },
          changedSinceLastCommit: true,
          validities: {
            ...prevState.validities,
            [factorname]: this.makeInputValidity(value),
          },
        };
      },
      () => {
        this.setAgeConsistencyValidity();
      }
    );
  }

  handleRadioChange(ev: React.ChangeEvent<HTMLInputElement>){
    const value = ev.currentTarget.value as Threading;
    this.setState(
      (prevState: AdvancedOptionsStates) => {
        return {
          options: { ...prevState.options, 
                    threading: value},
          changedSinceLastCommit: true
        };
      }
    );
  }

  getValidity(key: string): InputValidity {
    if (!(key in this.state.validities)) {
      return { status: "Success", message: "" };
    } else {
      return this.state.validities[key];
    }
  }

  setAgeConsistencyValidity() {
    if (
      this.getValidity("ageFrom").message !== INPUT_NOT_WHOLE &&
      this.getValidity("ageTo").message !== INPUT_NOT_WHOLE
    ) {
      if (
        parseInt(this.state.options.ageFrom.toString()) >
        parseInt(this.state.options.ageTo.toString())
      ) {
        this.setState((prevState: AdvancedOptionsStates) => {
          return {
            validities: {
              ...prevState.validities,
              ageFrom: {
                status: "Error",
                message: "Start age must not be higher than End age",
              },
              ageTo: {
                status: "Error",
                message: "Start age must not be higher than End age",
              },
            },
          };
        });
      } else {
        this.setState((prevState: AdvancedOptionsStates) => {
          return {
            validities: {
              ...prevState.validities,
              ageFrom: {
                status: "Success",
                message: "",
              },
              ageTo: {
                status: "Success",
                message: "",
              },
            },
          };
        });
      }
    }
  }

  makeInputValidity(value: string): InputValidity {
    if (wholeNumberValidity(value)) {
      return { status: "Success", message: "" };
    } else {
      return { status: "Error", message: INPUT_NOT_WHOLE };
    }
  }

  getDefaultAgeFrom() {
    return this.props.factorAnswers
      ? this.props.factorAnswers["Age"] !== ""
        ? (this.props.factorAnswers["Age"] as number)
        : 0
      : 0;
  }

  handleAgeFromSetting(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name } = e.currentTarget;
    const factorname = name;
    const checked = e.currentTarget.checked;
    if (checked) {
      this.setState((prevState: AdvancedOptionsStates) => {
        return {
          options: {
            ...prevState.options,
            ageFrom: this.getDefaultAgeFrom(),
          },
          disabledAgeFrom: checked,
          changedSinceLastCommit: true,
        };
      });
    } else {
      this.setState({ disabledAgeFrom: checked, changedSinceLastCommit: true });
    }
  }

  sameAsInputAgeFrom() {
    return (
      <div style={{ marginLeft: "30px" }}>
        <Form.Check
          name={"AgeFromNull"}
          onChange={this.handleAgeFromSetting}
          checked={this.state.disabledAgeFrom}
          label="Use age from user input"
        />
      </div>
    );
  }

  ageFromRow() {
    let style: FormControlStyle = {};
    if (this.getValidity("ageFrom").status === "Error") {
      style["borderColor"] = ERROR_COLOR;
    }
    if (this.state.disabledAgeFrom) {
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
                this.state.options.ageFrom,
                style,
                this.state.disabledAgeFrom
              )}
              <InputGroup.Append>{this.sameAsInputAgeFrom()}</InputGroup.Append>
            </InputGroup>
          </Col>
        </Form.Row>
      </div>
    );
  }

  handleSubmit() {
    this.setState({ changedSinceLastCommit: false }, () => {
      if (this.state.disabledAgeFrom) {
        this.props.updateAdvancedOptions({
          ...this.state.options,
          ageFrom: null,
        });
      } else {
        this.props.updateAdvancedOptions(this.state.options);
      }
    });
  }

  abort() {
    this.props.reset();
  }

  ageToRow() {
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
                this.state.options.ageTo,
                this.getValidity("ageTo").status === "Error" ? ERROR_STYLE : {},
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
    if (this.state.changedSinceLastCommit) {
      nextButtonStyle["backgroundColor"] = CHANGED_COLOR;
    }
    return (
      <Row style={{ marginTop: "5px", marginBottom: "15px" }}>
        <Col style={{ textAlign: "right" }}>
          <Button onClick={this.abort}>Abort changes</Button>
        </Col>
        <Col style={{ textAlign: "left" }}>
          <Button
            style={nextButtonStyle}
            disabled={!this.state.changedSinceLastCommit && errorMessage !== ""}
            onClick={this.handleSubmit}
          >
            {this.state.changedSinceLastCommit ? "Compute*" : "Compute"}
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
                checked={this.state.options.threading===Threading.SINGLE}
              />
              <Form.Check
                type="radio"
                name="threading"
                id={Threading.MULTI}
                label="Two threads"
                value={Threading.MULTI}
                onChange={this.handleRadioChange}
                checked={this.state.options.threading===Threading.MULTI}
              />
          </Col>
        </Form.Row>
      </div>
    );
  }

  render() {
    let errorMessage: string = "";
    Object.entries(this.state.validities).forEach(
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
