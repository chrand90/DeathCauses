import { observer } from "mobx-react";
import React, { ChangeEvent, ReactElement } from "react";
import { Col, Form, Tooltip } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import Label from "react-bootstrap/FormLabel";
import InputGroup from "react-bootstrap/InputGroup";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import MarkDown from "react-markdown";
import { RouteComponentProps, withRouter } from "react-router";
import { InputValidity } from "../models/FactorAbstract";
import RootStore, { withStore } from "../stores/rootStore";
import { Visualization } from "../stores/UIStore";
import "./Question.css";

export const BACKGROUNDCOLOR_DISABLED = "#c7c7c7";
export const TEXTCOLOR_DISABLED = "#999";
export const BACKGROUNDCOLOR_CHOICE = "#cef1f5";
export const ERROR_COLOR = "#fc0303";
export const WARNING_COLOR = "#bfa50d";
export const WARNING_COLOR_STRONGER = "#806e09";
export const SUCCESS_COLOR = "#3E713F";
export const CHANGED_COLOR = "#630396";

export interface QuestionProps<T>{
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
  descendantDeathCauses: string[];
}

export interface QuestionStates {}

export interface FormControlStyle {
  [key: string]: string;
}

interface QuestionContextProps extends RouteComponentProps{
  name: string;
  ignore: boolean;
  handleIgnoreFactor: (e: React.ChangeEvent<HTMLInputElement>) => void;
  helpText: string;
  phrasing: string;
  secondLine: ReactElement | string;
  featured: boolean;
  unitText: string | React.ReactNode;
  validityStatus: string;
  descendantDeathCauses: string[];
  store: RootStore;
}

class QuestionContextWithoutStoreWithoutRouter extends React.PureComponent<QuestionContextProps> {
  constructor(props: QuestionContextProps) {
    super(props);
  }

  helpBoxContent() {
    if (this.props.featured) {
      return (
        <div>
          <MarkDown>{this.props.helpText}</MarkDown>
          <hr></hr>
          {this.readMoreLink()}
          {this.props.name !== "Age" ? <hr></hr> : null}
          {this.props.name !== "Age" ? this.descendantMessage() : null}
        </div>
      );
    } else {
      return (
        <div>
          {this.questionPhrasing()}
          <hr></hr>
          <MarkDown>{this.props.helpText}</MarkDown>
          <hr></hr>
          {this.readMoreLink()}
          {this.props.name !== "Age" ? <hr></hr> : null}
          {this.props.name !== "Age" ? this.descendantMessage() : null}
        </div>
      );
    }
  }

  readMoreLink(){
    return(
      <Button 
        variant="link" 
        style={{fontSize:"14px"}}
        onClick={() => {
          this.props.history.push("/model/"+this.props.name)
        }}
        className="text-link-button"
      >Visit its page in the library</Button>
    )
  }

  helpBox() {
    return (
      <Popover id="popover-basic">
        <Popover.Title as="h3">{this.props.store.loadedDataStore.descriptions.getDescription(this.props.name,30)}</Popover.Title>
        <Popover.Content>{this.helpBoxContent()}</Popover.Content>
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
          overlay={<Tooltip id="tmp">Ignore</Tooltip>}
        >
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

  validityBoxStyling() {
    let style: FormControlStyle = {};
    let boxContent: string = "";
    style["backgroundColor"] = this.props.ignore
      ? BACKGROUNDCOLOR_DISABLED
      : "white";
    switch (this.props.validityStatus) {
      case "Success": {
        style["color"] = SUCCESS_COLOR;
        boxContent = "\u2713";
        break;
      }
      case "Warning": {
        style["color"] = WARNING_COLOR;
        style["borderColor"] = WARNING_COLOR;
        boxContent = "\u25B2";
        break;
      }
      case "Missing": {
        style["color"] = "white";
        break;
      }
      case "Error": {
        style["color"] = ERROR_COLOR;
        style["borderColor"] = ERROR_COLOR;
        boxContent = "\u2716";
        break;
      }
      default:
        break;
    }
    return { style, boxContent };
  }

  validityBox() {
    const { style, boxContent } = this.validityBoxStyling();
    const tooltipID = "validity-tooltip-" + this.props.name;
    const tooltipClass =
      "validity-tooltip-" + this.props.validityStatus.toLowerCase();
    return (
      <OverlayTrigger
        placement="bottom-end"
        show={
          this.props.validityStatus === "Error" ||
          this.props.validityStatus === "Warning"
            ? undefined
            : false
        }
        overlay={
          <Tooltip id={tooltipID} className={tooltipClass}>
            {this.props.secondLine}
          </Tooltip>
        }
      >
        <Label className="validity-box" style={style}>
          {" "}
          <strong>{boxContent}</strong>
        </Label>
      </OverlayTrigger>
    );
  }

  helpBoxButton() {
    return (
      <OverlayTrigger
        trigger="click"
        rootClose={true}
        placement={this.props.store.uIStore.windowWidth <= 992 ? 
          (this.props.store.uIStore.windowWidth<=400 ?  "bottom" : "left") : "right"}
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

  pixelsForFactorNameHeader() {
    let widthOfArea = this.props.store.uIStore.windowWidth;
    if (widthOfArea >= 1200) {
      widthOfArea = (widthOfArea * 1) / 3;
    } else if (widthOfArea >= 992) {
      widthOfArea = (widthOfArea * 5) / 12;
    }
    widthOfArea = Math.min(600, (widthOfArea * 1) / 3);
    return widthOfArea - 20; //20 is to account for the extra padding
  }

  fontSizeForFactorNameHeader() {
    const pixelHeight = 1.6;
    const minimumSize = 13;
    let l = this.props.name.length;
    let writtenName = this.props.name;
    const p = this.pixelsForFactorNameHeader();
    const pixelsPerLetter = p / l;
    let fontSize = Math.min(pixelsPerLetter * pixelHeight, 17);
    if (fontSize < minimumSize) {
      const sliceval = Math.floor(((p * pixelHeight) / minimumSize - 3) / 2);
      writtenName =
        writtenName.slice(0, sliceval) + "..." + writtenName.slice(-sliceval);
    }
    l = writtenName.length;
    const pixelsPerLetterAlternative = p / l;
    fontSize = Math.min(pixelsPerLetterAlternative * 1.6, 17);
    return { fontSize, writtenName };
  }

  inLineFactorNameHeader() {
    //const { fontSize, writtenName } = this.fontSizeForFactorNameHeader();
    const fontSize=17;
    const writtenName=this.props.store.loadedDataStore.descriptions.getDescription(this.props.name, 14)
    return (
      <div>
        <p
          style={{
            color: this.FactorNameColor(),
            fontWeight: "bold",
            marginBottom: "0px",
            textAlign: "left",
            fontSize: fontSize.toPrecision() + "px",
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
          {this.props.phrasing}
          {this.props.unitText ? " " : ""}
          {this.props.unitText}?
        </div>
      </div>
    );
  }

  rightPluralOfCause() {
    if (this.props.descendantDeathCauses.length === 1) {
      return "";
    }
    return "s";
  }

  descendantMessage() {
    return (
      <div>
        <span className="text-with-button">This risk factor is used for </span>
        <Button
          variant="link"
          className="inline-text-button"
          onClick={() => {
            this.props.store.relationLinkVizStore.setElementInFocus(this.props.name)
            this.props.store.uIStore.setVisualization(Visualization.RELATION_GRAPH)
          }}
        >
          {this.props.descendantDeathCauses.length} death cause
          {this.rightPluralOfCause()}
        </Button>
        .
      </div>
    );
  }


  getErrorMessageStyle() {
    let errorMessageStyle: FormControlStyle = {};
    errorMessageStyle["color"] =  "";
    return errorMessageStyle;
  }

  render() {
    console.log("rendering question context" + this.props.name);
    return (
      <Form.Row
        className={"formrow-narrow-" + (!this.props.featured).toString()}
      >
        <Col xs={this.props.featured ? 12 : 4}>
          {this.props.featured ? (
            this.questionPhrasing()
          ) : (
            <div
              style={{
                height: "34px",
                lineHeight: "34px",
                overflow: "hidden",
              }}
            >
              {this.inLineFactorNameHeader()}
            </div>
          )}
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
            {this.props.featured ? (
              <Form.Label
                className="ErrorLabel"
                style={this.getErrorMessageStyle()}
              >
                {this.props.secondLine}
              </Form.Label>
            ) : null}
          </Form.Group>
        </Col>
      </Form.Row>
    );
  }
}

export const QuestionContext = withRouter(withStore(observer(QuestionContextWithoutStoreWithoutRouter)));
