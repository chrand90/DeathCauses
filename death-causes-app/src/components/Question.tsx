import React, { ChangeEvent, ReactElement } from "react";
import "./QuestionMenu.css";
import Button from "react-bootstrap/Button";
import Popover from "react-bootstrap/Popover";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import InputGroup from "react-bootstrap/InputGroup";
import { Col, Form } from "react-bootstrap";
import "./Question.css";
import MarkDown from "react-markdown";
import { InputValidity } from "../models/Factors";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import { DropdownToggle } from "reactstrap";

export const BACKGROUNDCOLOR_DISABLED= "#c7c7c7";
export const TEXTCOLOR_DISABLED="#999";
export const BACKGROUNDCOLOR_CHOICE="#cef1f5";
export const ERROR_COLOR="#fc0303";
export const WARNING_COLOR="#bfa50d";

export interface QuestionProps<T> {
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleIgnoreFactor: (factorname: string) => void;
  name: string;
  phrasing: string;
  factorAnswer: T;
  helpText: string;
  placeholder: string;
  inputvalidity: InputValidity;
  featured: boolean;
}

export interface QuestionStates {
  ignore: boolean;
}

export interface FormControlStyle {
  [key: string]: string;
}

interface QuestionContextProps {
  name: string;
  ignore: boolean;
  handleIgnoreFactor: (e: React.ChangeEvent<HTMLInputElement>) => void;
  helpText: string;
  phrasing: string;
  secondLine: ReactElement | string;
  featured: boolean
  unitText: string | React.ReactNode;
}

export class QuestionContext extends React.PureComponent<QuestionContextProps> {
  constructor(props: QuestionContextProps) {
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
          onChange={this.props.handleIgnoreFactor}
          checked={this.props.ignore}
          label="Ignore"
        />
      </div>
    );
  }

  helpBoxButton() {//Popover til venstre for små skærme.
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

  inLineFactorNameHeader() {
    return (
      <div>
        <p
          style={{
            color: this.FactorNameColor(),
            fontWeight: "bold",
            marginBottom: "0px",
            textAlign: "left",
          }}
        >
          {this.props.name}
        </p>
      </div>
    );
  }

  unitButtonOrText() {
    return (
      <Dropdown>
        <Dropdown.Toggle variant="success" id="dropdown-basic">
          Dropdown Button
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item href="#/action-1">Action</Dropdown.Item>
          <Dropdown.Item href="#/action-2">Another action</Dropdown.Item>
          <Dropdown.Item href="#/action-3">Something else</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  questionPhrasing() {
    return (
      <div>
        <div
          style={{
            color: this.FactorNameColor(),
            fontSize: this.props.featured ? "" : "11px",
            marginTop: "0px",
            textAlign: "left",
          }}
        >
          {this.props.phrasing} {this.props.unitText}
          {this.props.featured ? "?" : ""}
        </div>
      </div>
    );
  }

  render() {
    return (
      <Form.Row>
        <Col xl={this.props.featured ? 12 : 4}>
          {this.props.featured ? "" : this.inLineFactorNameHeader()}
          {this.questionPhrasing()}
        </Col>
        <Col xl={this.props.featured ? 12 : 8}>
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

// export class SimpleStringQuestion extends React.PureComponent<
//   StringQuestionProps,
//   I_QuestionStates
// > {
//   constructor(props: StringQuestionProps) {
//     super(props);
//     this.state = {
//       ignore: false,
//     };
//     this.handleIgnoreBox = this.handleIgnoreBox.bind(this);
//   }
//   handleIgnoreBox(event: React.ChangeEvent<HTMLInputElement>) {
//     this.setState({ ignore: event.currentTarget.checked }, (): void => {
//       if (this.state.ignore) {
//         this.props.handleIgnoreFactor(this.props.name);
//       }
//     });
//   }

//   getBackgroundColor() {
//     if (this.state.ignore) {
//       return BACKGROUNDCOLOR_DISABLED;
//     } else {
//       return BACKGROUNDCOLOR_CHOICE;
//     }
//   }

//   getTextColor() {
//     if (this.state.ignore) {
//       return TEXTCOLOR_DISABLED;
//     } else {
//       return "";
//     }
//   }

//   getErrorStyles() {
//     let formControlStyle: FormControlStyle = {
//       background: this.getBackgroundColor(),
//       color: this.getTextColor(),
//     };
//     let showmessage: boolean = false;
//     let errorMessageStyle: FormControlStyle = {};
//     if (this.props.inputvalidity.status === "Warning") {
//       showmessage = true;
//       formControlStyle["border-color"] = WARNING_COLOR;
//       errorMessageStyle["color"] = WARNING_COLOR;
//     }
//     return { formControlStyle, showmessage, errorMessageStyle };
//   }

//   render() {
//     console.log("Renders Question" + this.props.name);
//     const {
//       formControlStyle,
//       showmessage,
//       errorMessageStyle,
//     } = this.getErrorStyles();

//     return (
//       <Question
//         name={this.props.name}
//         phrasing={this.props.phrasing}
//         handleIgnoreBox={this.handleIgnoreBox}
//         ignore={this.state.ignore}
//         helpText={this.props.helpText}
//         secondLine={
//           showmessage ? (
//             <Form.Label className="ErrorLabel" style={errorMessageStyle}>
//               {this.props.inputvalidity.message}
//             </Form.Label>
//           ) : (
//             ""
//           )
//         }
//         featured={this.props.featured}
//         unitText=""
//       >
//         <Form.Control
//           as="select"
//           name={this.props.name}
//           value={this.props.factorAnswer}
//           onChange={this.props.handleChange}
//           disabled={this.state.ignore}
//           style={formControlStyle}
//           autoFocus={this.props.featured}
//         >
//           <option value={this.props.placeholder} hidden>
//             {this.props.placeholder}
//           </option>
//           {this.props.options.map((d: string) => {
//             return <option value={d}>{d}</option>;
//           })}
//         </Form.Control>
//       </Question>
//     );
//   }
// }

// export class SimpleNumericQuestion extends React.PureComponent<
//   NumericQuestionProps,
//   I_QuestionStates
// > {
//   constructor(props: NumericQuestionProps) {
//     super(props);
//     this.state = {
//       ignore: false,
//     };
//     this.handleIgnoreBox = this.handleIgnoreBox.bind(this);
//   }

//   TextInputBackgroundColor() {
//     if (this.state.ignore) {
//       return BACKGROUNDCOLOR_DISABLED;
//     } else {
//       return "";
//     }
//   }

//   handleIgnoreBox(event: React.ChangeEvent<HTMLInputElement>) {
//     this.setState({ ignore: event.currentTarget.checked }, (): void => {
//       if (this.state.ignore) {
//         this.props.handleIgnoreFactor(this.props.name);
//       }
//     });
//   }

//   getErrorStyles() {
//     let formControlStyle: FormControlStyle = {
//       background: this.TextInputBackgroundColor(),
//     };
//     let showmessage: boolean = false;
//     let errorMessageStyle: FormControlStyle = {};
//     if (this.props.inputvalidity.status === "Error") {
//       showmessage = true;
//       //formControlStyle["border-width"]="4px";
//       formControlStyle["border-color"] = ERROR_COLOR;
//       formControlStyle["color"] = ERROR_COLOR;
//       errorMessageStyle["color"] = ERROR_COLOR;
//     }
//     console.log("this.state.ignore");
//     console.log(this.state.ignore);
//     if (this.props.inputvalidity.status === "Warning") {
//       showmessage = true;
//       formControlStyle["border-color"] = WARNING_COLOR;
//       errorMessageStyle["color"] = WARNING_COLOR;
//     }
//     return { formControlStyle, showmessage, errorMessageStyle };
//   }

//   unitButtonOrText() {
//     if (this.props.unitOptions.length > 0) {
//       return (
//         <UnitPicker
//           onChoice={(newUnit: string) =>
//             this.props.handleChangeUnit(this.props.name, newUnit)
//           }
//           options={this.props.unitOptions}
//           size={this.props.featured ? "": '11px'}
//         >
//           {this.props.placeholder}
//         </UnitPicker>
//       );
//     } else {
//       return ` (${this.props.placeholder})`;
//     }
//   }

//   render() {
//     console.log("Renders Question" + this.props.name);

//     const {
//       formControlStyle,
//       showmessage,
//       errorMessageStyle,
//     } = this.getErrorStyles();

//     return (
//       <Question
//         name={this.props.name}
//         phrasing={this.props.phrasing}
//         handleIgnoreBox={this.handleIgnoreBox}
//         ignore={this.state.ignore}
//         helpText={this.props.helpText}
//         secondLine={
//           showmessage ? (
//             <Form.Label className="ErrorLabel" style={errorMessageStyle}>
//               {this.props.inputvalidity.message}
//             </Form.Label>
//           ) : (
//             ""
//           )
//         }
//         unitText={this.unitButtonOrText()}
//         featured={this.props.featured}
//       >
//         <Form.Control
//           type="text"
//           placeholder={this.props.placeholder}
//           name={this.props.name}
//           value={this.props.factorAnswer}
//           style={formControlStyle}
//           onChange={this.props.handleChange}
//           disabled={this.state.ignore}
//           autoFocus={this.props.featured}
//         />
//       </Question>
//     );
//   }
// }
// {
//   /* <Button variant="link">?</Button>
// <InputGroup className="mb-2">
// <InputGroup.Prepend>
//   <InputGroup.Text>@</InputGroup.Text>
// </InputGroup.Prepend>
// <FormControl id="inlineFormInputGroup" placeholder="Username" />
// </InputGroup> */
// }
