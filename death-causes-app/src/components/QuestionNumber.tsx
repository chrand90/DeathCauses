import {
  QuestionProps,
  QuestionStates,
  FormControlStyle,
  BACKGROUNDCOLOR_DISABLED,
  ERROR_COLOR,
  WARNING_COLOR,
  QuestionContext,
} from "./Question";
import { InputValidity } from "../models/Factors";
import React from "react";
import { Form } from "react-bootstrap";
import UnitPicker from "./UnitPicker";

interface NumericQuestionProps extends QuestionProps<number> {
  placeholder: string;
  inputvalidity: InputValidity;
  unitOptions: string[];
  handleUnitChange: (fname: string, newUnitName: string) => void;
}

export default class SimpleNumericQuestion extends React.PureComponent<
  NumericQuestionProps,
  QuestionStates
> {
  constructor(props: NumericQuestionProps) {
    super(props);
  }

  TextInputBackgroundColor() {
    if (this.props.ignore) {
      return BACKGROUNDCOLOR_DISABLED;
    } else {
      return "";
    }
  }

  // handleIgnoreFactor(event: React.ChangeEvent<HTMLInputElement>) {
  //   this.setState({ ignore: event.currentTarget.checked }, (): void => {
  //       this.props.handleIgnoreFactor(this.props.name, event.currentTarget.checked);
  //   });
  // }

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
      formControlStyle["color"] = ERROR_COLOR;
      errorMessageStyle["color"] = ERROR_COLOR;
    }
    console.log("this.state.ignore");
    console.log(this.props.ignore);
    if (this.props.inputvalidity.status === "Warning") {
      showmessage = true;
      formControlStyle["border-color"] = WARNING_COLOR;
      errorMessageStyle["color"] = WARNING_COLOR;
    }
    return { formControlStyle, showmessage, errorMessageStyle };
  }

  compare(a:any,b:any){
    return String(a)+'==='+String(b)+': '+String(a===b)
  }

  // shouldComponentUpdate(nextProps: Readonly<NumericQuestionProps>, nextState: Readonly<QuestionStates>, nextContext: any){
  //   console.log("deciding whether to render " + this.props.name)
  //   console.log('Props:');
  //   console.log("featured "+this.compare(this.props.featured, nextProps.featured))
  //   console.log("ignore "+this.compare(this.props.ignore, nextProps.ignore))
  //   console.log("inputvalidity "+this.compare(this.props.inputvalidity, nextProps.inputvalidity))
  //   console.log("windowWidth "+this.compare(this.props.windowWidth, nextProps.windowWidth))
  //   console.log("unitOptions "+this.compare(this.props.unitOptions, nextProps.unitOptions))
  //   console.log('States:');
    
    
    
    
    
  //   return true;
  // }

  unitButtonOrText() {
    if (this.props.unitOptions.length > 0) {
      return (
        <UnitPicker
          onChoice={(newUnit: string) =>
            this.props.handleUnitChange(this.props.name, newUnit)
          }
          options={this.props.unitOptions}
          size={this.props.featured ? "" : "11px"}
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
      errorMessageStyle,
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
