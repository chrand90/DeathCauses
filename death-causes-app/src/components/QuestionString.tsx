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
import { InputValidity } from '../models/Factors';
import React from "react";
import {Form} from "react-bootstrap";


interface StringQuestionProps extends QuestionProps<string> {
  placeholder: string;
  inputvalidity: InputValidity;
  options: string[];
}



export default class SimpleStringQuestion extends React.PureComponent<
  StringQuestionProps,
  QuestionStates
> {
  constructor(props: StringQuestionProps) {
    super(props);
    this.state = {
      ignore: false,
    };
    this.handleIgnoreFactor = this.handleIgnoreFactor.bind(this);
  }

  handleIgnoreFactor(event: React.ChangeEvent<HTMLInputElement>) {
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
      color: this.getTextColor(),
    };
    let showmessage: boolean = false;
    let errorMessageStyle: FormControlStyle = {};
    if (this.props.inputvalidity.status === "Warning") {
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

    return (
      <QuestionContext
        name={this.props.name}
        phrasing={this.props.phrasing}
        handleIgnoreFactor={this.handleIgnoreFactor}
        featured={this.props.featured}
        unitText=""
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
      </QuestionContext>
    );
  }
}