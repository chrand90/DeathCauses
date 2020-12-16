import React, { ChangeEvent, PureComponent, ReactElement } from "react";
import "./QuestionMenu.css";
import Button from "react-bootstrap/Button";
import Popover from "react-bootstrap/Popover";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import InputGroup from "react-bootstrap/InputGroup";
import { Row, Col, Form } from "react-bootstrap";
import "./Question.css";
import MarkDown from "react-markdown";
import { InputValidity } from "../models/Factors";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";

const BACKGROUNDCOLOR_DISABLED= "#c7c7c7";
const TEXTCOLOR_DISABLED="#999";
const BACKGROUNDCOLOR_CHOICE="#cef1f5";
const ERROR_COLOR="#fc0303";
const WARNING_COLOR="#bfa50d";

interface I_Question<T> {
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleIgnoreFactor: (factorname: string) => void;
  name: string;
  phrasing: string;
  factorAnswer: T;
  helpText: string;
}

interface I_QuestionStates {
  ignore: boolean;
}

interface NumericQuestionProps extends I_Question<number> {
  placeholder: string;
  inputvalidity: InputValidity;
  updateCycle: number;
}

interface StringQuestionProps extends I_Question<string> {
  placeholder: string;
  inputvalidity: InputValidity;
  updateCycle: number;
  options: string[];
}

interface FormControlStyle {
  [key: string]: string;
}

interface AbstractQuestionProps {
  name: string;
  ignore: boolean;
  handleIgnoreBox: (e: React.ChangeEvent<HTMLInputElement>) => void;
  helpText: string;
  phrasing: string;
  secondLine: ReactElement | string;
}

class Question extends React.PureComponent<AbstractQuestionProps> {
  constructor(props: any) {
    super(props);
  }

  helpBox() {
    return (
      <Popover id="popover-basic">
        <Popover.Title as="h3">{this.props.name}</Popover.Title>
        <Popover.Content>
          <MarkDown>{this.props.helpText}</MarkDown>
        </Popover.Content>
      </Popover>
    );
  }

  IgnoreCheckBox() {
    return (
      <div className="fixedWidth">
        <Form.Check
          onChange={this.props.handleIgnoreBox}
          checked={this.props.ignore}
          label="Ignore"
        />
      </div>
    );
  }

  helpBoxButton() {
    return (
      <OverlayTrigger
        trigger="click"
        rootClose={true}
        placement="right"
        overlay={this.helpBox()}
      >
        <Button variant="light" className="btn-helpbox">
          {" "}
          <strong>?</strong>
        </Button>
      </OverlayTrigger>
    );
  }

  FactorNameColor() {
    if (this.props.ignore) {
      return "#9c9c9c";
    } else {
      return "#000000";
    }
  }

  render() {
    return (
      <Form.Row>
        <Form.Label column xl={4} style={{ color: this.FactorNameColor() }}>
          {this.props.phrasing}
        </Form.Label>
        <Col xl={8}>
          <Form.Group>
            <InputGroup className="mb-2">
              {this.props.children}
              <InputGroup.Append>
                {this.helpBoxButton()}
                {this.IgnoreCheckBox()}
              </InputGroup.Append>
            </InputGroup>
            {this.props.secondLine}
          </Form.Group>
        </Col>
      </Form.Row>
    );
  }
}

export class SimpleStringQuestion extends React.PureComponent<
  StringQuestionProps,
  I_QuestionStates
> {
  updateCycle: number;
  constructor(props: StringQuestionProps) {
    super(props);
    this.state = {
      ignore: false,
    };
    this.updateCycle=0;
    this.handleIgnoreBox = this.handleIgnoreBox.bind(this);
  }
  handleIgnoreBox(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ ignore: event.currentTarget.checked }, (): void => {
      if (this.state.ignore) {
        this.props.handleIgnoreFactor(this.props.name);
      }
    });
  }

  getBackgroundColor() {
    if (this.state.ignore) {
      return BACKGROUNDCOLOR_DISABLED;
    } else {
      return BACKGROUNDCOLOR_CHOICE;
    }
  }

  getTextColor() {
    if (this.state.ignore) {
      return TEXTCOLOR_DISABLED;
    } else {
      return "";
    }
  }

  getErrorStyles() {
    let formControlStyle: FormControlStyle = {
      background: this.getBackgroundColor(),
      color: this.getTextColor()
    };
    let showmessage: boolean = false;
    let errorMessageStyle: FormControlStyle = {};
    if (
      this.props.inputvalidity.status === "Warning" ||
      (this.props.inputvalidity.status === "Missing" &&
        !this.state.ignore &&
        this.updateCycle !== this.props.updateCycle)
    ) {
      showmessage = true;
      formControlStyle["border-color"] = WARNING_COLOR;
      errorMessageStyle["color"] = WARNING_COLOR;
    }
    return { formControlStyle, showmessage, errorMessageStyle };
  }

  render() {
    console.log("Renders Question" + this.props.name);
    const { formControlStyle, showmessage, errorMessageStyle } = this.getErrorStyles();

    return (
      <Question
        name={this.props.name}
        phrasing={this.props.phrasing}
        handleIgnoreBox={this.handleIgnoreBox}
        ignore={this.state.ignore}
        helpText={this.props.helpText}
        secondLine={
          showmessage ? (
            <Form.Label className="ErrorLabel" style={errorMessageStyle}>
              {this.props.inputvalidity.message}
            </Form.Label>
          ) : (
            ""
          )
        }
      >
        <Form.Control
          as="select"
          name={this.props.name}
          value={this.props.factorAnswer}
          onChange={this.props.handleChange}
          disabled={this.state.ignore}
          style={formControlStyle}
        >
          <option value={this.props.placeholder} hidden>
            {this.props.placeholder}
          </option>
          {this.props.options.map((d: string) => {
            return <option value={d}>{d}</option>;
          })}
        </Form.Control>
      </Question>
    );
  }
}

export class SimpleNumericQuestion extends React.PureComponent<
  NumericQuestionProps,
  I_QuestionStates
> {
  updateCycle: number;

  constructor(props: NumericQuestionProps) {
    super(props);
    this.state = {
      ignore: false,
    };
    this.updateCycle = 0;
    this.handleIgnoreBox = this.handleIgnoreBox.bind(this);
  }

  TextInputBackgroundColor() {
    if (this.state.ignore) {
      return BACKGROUNDCOLOR_DISABLED;
    } else {
      return "";
    }
  }

  handleIgnoreBox(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ ignore: event.currentTarget.checked }, (): void => {
      if (this.state.ignore) {
        this.props.handleIgnoreFactor(this.props.name);
      }
    });
  }

  getErrorStyles() {
    let formControlStyle: FormControlStyle = {
      background: this.TextInputBackgroundColor(),
    };
    let showmessage: boolean = false;
    let errorMessageStyle: FormControlStyle = {};
    if (this.props.inputvalidity.status === "Error") {
      showmessage = true;
      //formControlStyle["border-width"]="4px";
      formControlStyle["border-color"] = ERROR_COLOR;
      formControlStyle["color"] =ERROR_COLOR;
      errorMessageStyle["color"] = ERROR_COLOR;
    }
    console.log("this.state.ignore");
    console.log(this.state.ignore);
    if (
      this.props.inputvalidity.status === "Warning" ||
      (this.props.inputvalidity.status === "Missing" &&
        !this.state.ignore &&
        this.updateCycle !== this.props.updateCycle)
    ) {
      showmessage = true;
      formControlStyle["border-color"] = WARNING_COLOR;
      errorMessageStyle["color"] = WARNING_COLOR;
    }
    return { formControlStyle, showmessage, errorMessageStyle };
  }

  render() {
    console.log("Renders Question" + this.props.name);

    const {
      formControlStyle,
      showmessage,
      errorMessageStyle,
    } = this.getErrorStyles();

    this.updateCycle = this.props.updateCycle; //At rerender the warning must have been seen and we will therefore remove it.

    return (
      <Question
        name={this.props.name}
        phrasing={this.props.phrasing}
        handleIgnoreBox={this.handleIgnoreBox}
        ignore={this.state.ignore}
        helpText={this.props.helpText}
        secondLine={
          showmessage ? (
            <Form.Label className="ErrorLabel" style={errorMessageStyle}>
              {this.props.inputvalidity.message}
            </Form.Label>
          ) : (
            ""
          )
        }
      >
        <Form.Control
          type="text"
          placeholder={this.props.placeholder}
          name={this.props.name}
          value={this.props.factorAnswer}
          style={formControlStyle}
          onChange={this.props.handleChange}
          disabled={this.state.ignore}
        />
      </Question>
    );
  }
}
{
  /* <Button variant="link">?</Button>
<InputGroup className="mb-2">
<InputGroup.Prepend>
  <InputGroup.Text>@</InputGroup.Text>
</InputGroup.Prepend>
<FormControl id="inlineFormInputGroup" placeholder="Username" />
</InputGroup> */
}
