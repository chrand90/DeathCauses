import React, { ChangeEvent, ReactElement } from "react";
import "./QuestionMenu.css";
import Button from "react-bootstrap/Button";
import Popover from "react-bootstrap/Popover";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import InputGroup from "react-bootstrap/InputGroup";
import { Col, Form, Tooltip } from "react-bootstrap";
import "./Question.css";
import MarkDown from "react-markdown";
import { InputValidity } from "../models/Factors";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import { DropdownToggle } from "reactstrap";
import Label from "react-bootstrap/FormLabel";

export const BACKGROUNDCOLOR_DISABLED = "#c7c7c7";
export const TEXTCOLOR_DISABLED = "#999";
export const BACKGROUNDCOLOR_CHOICE = "#cef1f5";
export const ERROR_COLOR = "#fc0303";
export const WARNING_COLOR = "#bfa50d";
export const SUCCESS_COLOR = "#3E713F";

export interface QuestionProps<T> {
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleIgnoreFactor: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  phrasing: string;
  factorAnswer: T;
  helpText: string;
  placeholder: string;
  inputvalidity: InputValidity;
  featured: boolean;
  ignore: boolean;
  windowWidth: number;
}

export interface QuestionStates {}

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
  featured: boolean;
  unitText: string | React.ReactNode;
  validityStatus: string;
  windowWidth: number;
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
          name={this.props.name}
          onChange={this.props.handleIgnoreFactor}
          checked={this.props.ignore}
          label="Ignore"
        />
      </div>
    );
  }

  renderToolTipCheckBox(injected: any): React.ReactNode {
    return (
      <Tooltip id="button-tooltip" {...injected}>
        Ignore factor
      </Tooltip>
    );
  }

  IgnoreCheckBoxSmall() {
    return (
      <div className="fixedWidthSmall">
        <OverlayTrigger
         placement="left"
         overlay={<Tooltip id= "tmp">
           Ignore
         </Tooltip>}>
        <Form.Check
            className="form-check-small"
            name={this.props.name}
            onChange={this.props.handleIgnoreFactor}
            checked={this.props.ignore}
          />
        </OverlayTrigger>

      </div>
    );
  }

  validityBoxStyling(){
    let style: FormControlStyle={};
    let boxContent: string="";
    style['background-color'] = this.props.ignore ? BACKGROUNDCOLOR_DISABLED : "white"
    switch(this.props.validityStatus){
      case "Success" : {
        style["color"]=SUCCESS_COLOR
        boxContent="\u2713"
        break;
      }
      case "Warning" : {
        style["color"]=WARNING_COLOR
        style["border-color"]=WARNING_COLOR
        boxContent="\u25B2"
        break;
      }
      case "Missing" : {
        style["color"]="white"
        break;
      }
      case "Error" : {
        style["color"]=ERROR_COLOR
        style["border-color"]=ERROR_COLOR
        boxContent="\u2716"
        break;
      }
      default:
        break;
    }
    return {style, boxContent}

  }

  renderToolTipValidityBox(injected: any, message:string, style: FormControlStyle): React.ReactNode{
    return (
      <Tooltip id="button-tooltip-validity" {...injected} style={style}>
        {message}
      </Tooltip>
    );
  }
  //
  validityBox(){
    const {style, boxContent} = this.validityBoxStyling()
    const tooltipID='validity-tooltip-'+this.props.name
    const tooltipClass="validity-tooltip-"+this.props.validityStatus.toLowerCase()
    return (
      <OverlayTrigger
       placement='bottom-end'
       show={ this.props.validityStatus==='Error'|| this.props.validityStatus==='Warning' ? undefined : false}
       overlay={
        <Tooltip id={tooltipID} className={tooltipClass}>
        {this.props.secondLine}
      </Tooltip> 
       }>
         <Label className="validity-box" style={style}>
          {" "}
          <strong>{boxContent}</strong>
        </Label>
      </OverlayTrigger>
         
    )
  }

  helpBoxButton() {
    //Popover til venstre for små skærme.
    return (
      <OverlayTrigger
        trigger="click"
        rootClose={true}
        placement={this.props.windowWidth <= 992 ? "left" : "right"}
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

  getErrorMessageStyle(){
    let errorMessageStyle: FormControlStyle = {};
    if (this.props.validityStatus === "Error") {
      errorMessageStyle["color"] = ERROR_COLOR;
    }
    if (this.props.validityStatus === "Warning") {
      errorMessageStyle["color"] = WARNING_COLOR;
    }
    return errorMessageStyle
  }

  render() {
    return (
      <Form.Row>
        <Col xs={this.props.featured ? 12 : 4}>
          {this.props.featured ? this.questionPhrasing() : 
            <div style={{height:"34px", lineHeight:"34px"}}>{this.inLineFactorNameHeader()}</div>}
        </Col>
        <Col xs={this.props.featured ? 12 : 8}>
          <Form.Group>
            <InputGroup>
              {this.props.children}
              <InputGroup.Append>
                {this.props.featured ? null : this.validityBox()}
                {this.helpBoxButton()}
                {this.props.featured
                  ? this.IgnoreCheckBox()
                  : this.IgnoreCheckBoxSmall()}
              </InputGroup.Append>
            </InputGroup>
            {this.props.featured ? 
              <Form.Label className="ErrorLabel" style={this.getErrorMessageStyle()}>
                {this.props.secondLine} 
              </Form.Label>
              : null}
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
