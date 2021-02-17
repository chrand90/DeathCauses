import {
  QuestionProps,
  QuestionStates,
  FormControlStyle,
  BACKGROUNDCOLOR_DISABLED,
  ERROR_COLOR,
  WARNING_COLOR,
  QuestionContext,
} from "./Question";
import { InputValidity } from "../models/FactorAbstract";
import React from "react";
import { Form } from "react-bootstrap";
import UnitPicker from "./UnitPicker";
import { OrderVisualization } from "./Helpers";

interface NumericQuestionProps extends QuestionProps<string> {
  placeholder: string;
  inputvalidity: InputValidity;
  unitOptions: string[];
  handleUnitChange: (fname: string, newUnitName: string) => void;
}

export default class SimpleNumericQuestion extends React.PureComponent<
  NumericQuestionProps,
  QuestionStates
> {

  TextInputBackgroundColor() {
    if (this.props.ignore) {
      return BACKGROUNDCOLOR_DISABLED;
    } else {
      return "";
    }
  }

  getErrorStyles() {
    let formControlStyle: FormControlStyle = {
      background: this.TextInputBackgroundColor(),
    };
    let showmessage: boolean = false;
    if (this.props.inputvalidity.status === "Error") {
      showmessage = true;
      formControlStyle["border-color"] = ERROR_COLOR;
      formControlStyle["color"] = ERROR_COLOR;
    }
    console.log("this.state.ignore");
    console.log(this.props.ignore);
    if (this.props.inputvalidity.status === "Warning") {
      showmessage = true;
      formControlStyle["border-color"] = WARNING_COLOR;
    }
    return { formControlStyle, showmessage };
  }

  compare(a:any,b:any){
    return String(a)+'==='+String(b)+': '+String(a===b)
  }

  unitButtonOrText() {
    if (this.props.unitOptions.length > 0) {
      return (
        <UnitPicker
          onChoice={(newUnit: string) =>
            this.props.handleUnitChange(this.props.name, newUnit)
          }
          options={this.props.unitOptions}
          size={""}
        >
          {this.props.placeholder}
        </UnitPicker>
      );
    } else {
      return ` (${this.props.placeholder})`;
    }
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
        ignore={this.props.ignore}
        helpText={this.props.helpText}
        unitText={this.unitButtonOrText()}
        featured={this.props.featured}
        validityStatus={this.props.inputvalidity.status}
        secondLine={showmessage ? this.props.inputvalidity.message : ""}
        windowWidth={this.props.windowWidth}
        descendantDeathCauses={this.props.descendantDeathCauses}
        orderVisualization={this.props.orderVisualization}
      >
        <Form.Control
          type="text"
          placeholder={this.props.placeholder}
          name={this.props.name}
          value={this.props.factorAnswer}
          style={formControlStyle}
          onChange={this.props.handleChange}
          disabled={this.props.ignore}
          autoFocus={this.props.featured}
        />
      </QuestionContext>
    );
  }
}
