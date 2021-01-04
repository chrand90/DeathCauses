import {
    QuestionProps,
    QuestionStates,
    FormControlStyle,
    BACKGROUNDCOLOR_DISABLED,
    ERROR_COLOR,
    WARNING_COLOR,
    QuestionContext
  } from "./Question";
  import React from "react";
  import {Form } from "react-bootstrap";
  


  interface NumericQuestionProps extends QuestionProps<number> {};
  
  export default class SimpleNumericQuestion extends React.PureComponent<
  NumericQuestionProps,
  QuestionStates
> {

  constructor(props: NumericQuestionProps) {
    super(props);
    this.state = {
      ignore: false,
    };
    this.handleIgnoreFactor = this.handleIgnoreFactor.bind(this);
  }

  TextInputBackgroundColor() {
    if (this.state.ignore) {
      return BACKGROUNDCOLOR_DISABLED;
    } else {
      return "";
    }
  }

  handleIgnoreFactor(event: React.ChangeEvent<HTMLInputElement>) {
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
      this.props.inputvalidity.status === "Warning" 
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

    return (
      <QuestionContext
        name={this.props.name}
        phrasing={this.props.phrasing}
        handleIgnoreFactor={this.handleIgnoreFactor}
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
      </QuestionContext>
    );
  }
}