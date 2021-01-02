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

