import React, { ChangeEvent, ReactElement } from "react";
import Button from "react-bootstrap/Button";
import Popover from "react-bootstrap/Popover";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import InputGroup from "react-bootstrap/InputGroup";
import { Col, Form, Tooltip } from "react-bootstrap";
import "./Question.css";
import MarkDown from "react-markdown";
import { InputValidity } from "../models/FactorAbstract";
import Dropdown from "react-bootstrap/Dropdown";
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

  helpBoxContent(){
    if(this.props.featured){
      return <MarkDown>{this.props.helpText}</MarkDown>
    }
    else{
      return <div>
        {this.questionPhrasing()}
        <hr></hr>
        <MarkDown>{this.props.helpText}</MarkDown>
      </div>
    }
  }

  helpBox() {
    return (
      <Popover id="popover-basic">
        <Popover.Title as="h3">{this.props.name}</Popover.Title>
        <Popover.Content>
          {this.helpBoxContent()}
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

  pixelsForFactorNameHeader(){
    let widthOfArea=this.props.windowWidth
    if(widthOfArea >= 1200){
      widthOfArea=widthOfArea * 1/3
    }
    else if(widthOfArea>=992){
      widthOfArea=widthOfArea*5/12
    }
    widthOfArea=widthOfArea * 1 /3
    return widthOfArea
  }

  fontSizeForFactorNameHeader(){
    const pixelHeight=1.6
    const minimumSize=13
    let l =this.props.name.length
    let writtenName=this.props.name
    const p= this.pixelsForFactorNameHeader()
    const pixelsPerLetter= p/l
    let fontSize=Math.min(pixelsPerLetter*pixelHeight, 17)
    if(fontSize<minimumSize){
      const sliceval=Math.floor((p*pixelHeight/minimumSize-3)/2)
      writtenName=writtenName.slice(0,sliceval)+"..."+writtenName.slice(-sliceval)
    }
    l =writtenName.length
    const pixelsPerLetterAlternative= p/l
    fontSize= Math.min(pixelsPerLetterAlternative*1.6, 17)
    return { fontSize , writtenName }
  }

  inLineFactorNameHeader() {  
    const {fontSize, writtenName} = this.fontSizeForFactorNameHeader()
    return (
      <div>
        <p
          style={{
            color: this.FactorNameColor(),
            fontWeight: "bold",
            marginBottom: "0px",
            textAlign: "left",
            fontSize: fontSize.toPrecision()+'px'
          }}
        >
          {writtenName}
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
            marginTop: "0px",
            textAlign: "left",
          }}
        >
          {this.props.phrasing}{this.props.unitText ? " " : ""}{this.props.unitText}?
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
