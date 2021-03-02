import {
  QuestionProps,
  QuestionStates,
  FormControlStyle,
  BACKGROUNDCOLOR_DISABLED,
  BACKGROUNDCOLOR_CHOICE,
  TEXTCOLOR_DISABLED,
  WARNING_COLOR,
  QuestionContext
} from "./Question";
import { InputValidity } from '../models/FactorAbstract';
import React from "react";
import {Form} from "react-bootstrap";
import { OrderVisualization } from "./Helpers";

interface StringQuestionProps extends QuestionProps<string> {
  placeholder: string;
  inputvalidity: InputValidity;
  options: string[];
}
export default class SimpleStringQuestion extends React.PureComponent<
  StringQuestionProps,
  QuestionStates
> {

  getBackgroundColor() {
    if (this.props.ignore) {
      return BACKGROUNDCOLOR_DISABLED;
    } else {
      return BACKGROUNDCOLOR_CHOICE;
    }
  }

  getTextColor() {
    if (this.props.ignore) {
      return TEXTCOLOR_DISABLED;
    } else {
      return "";
    }
  }

  getErrorStyles() {
    let formControlStyle: FormControlStyle = {
      background: this.getBackgroundColor(),
      color: this.getTextColor(),
    };
    let showmessage: boolean = false;
    if (this.props.inputvalidity.status === "Warning") {
      showmessage = true;
      formControlStyle["borderColor"] = WARNING_COLOR;
    }
    return { formControlStyle, showmessage };
  }

  render() {
    console.log("Renders Question" + this.props.name);
    const {
      formControlStyle,
      showmessage,
    } = this.getErrorStyles();

    return (
      <QuestionContext
        name={this.props.name}
        phrasing={this.props.phrasing}
        handleIgnoreFactor={this.props.handleIgnoreFactor}
        featured={this.props.featured}
        unitText={null}
        ignore={this.props.ignore}
        helpText={this.props.helpText}
        validityStatus={this.props.inputvalidity.status}
        secondLine={showmessage ? this.props.inputvalidity.message : ""}
        windowWidth={this.props.windowWidth}
        descendantDeathCauses={this.props.descendantDeathCauses}
        orderVisualization={this.props.orderVisualization}
      >
        <Form.Control
          as="select"
          name={this.props.name}
          value={this.props.factorAnswer}
          onChange={this.props.handleChange}
          disabled={this.props.ignore}
          style={formControlStyle}
          autoFocus={this.props.featured}
        >
          <option value={this.props.placeholder} hidden>
            {this.props.placeholder}
          </option>
          {this.props.options.map((d: string) => {
            return <option value={d}>{d}</option>;
          })}
        </Form.Control>
      </QuestionContext>
    );
  }
}