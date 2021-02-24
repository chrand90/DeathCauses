import React from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { ButtonToolbar } from "reactstrap";
import { InputValidity } from "../models/FactorAbstract";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";

interface AskedQuestionProps {
  factorName: string | undefined;
  validity: InputValidity | undefined;
  onSubmit: (event: React.FormEvent) => void;
  previousPossible: boolean;
  onPrevious: () => void;
  onStartOver: () => void;
  onFinishNow: () => void;
  onFinishRandomly: () => void;
  leftCornerCounter: string;
}

class AskedQuestionFramed extends React.Component<AskedQuestionProps, any> {

  render() {
    return (
      <Card style={{ marginBottom: "20px", height: "90%" }}>
        <Card.Header>
        <div className="d-flex justify-content-between">
          <div>
            {this.props.leftCornerCounter}
          </div>
          <Card.Title>
            {this.props.factorName ? this.props.factorName : "No more questions"}
          </Card.Title>
        <div>
          {""}
        </div>
        </div>
        </Card.Header>
        <Card.Body>{this.props.children}</Card.Body>
        <Card.Footer>
          <ButtonToolbar className="justify-content-between">
            <ButtonGroup>
              <Button
                disabled={!this.props.previousPossible}
                onClick={this.props.onPrevious}
              >
                Previous
              </Button>
            </ButtonGroup>
            <ButtonGroup>
              <DropdownButton
                id="dropdown-basic-button"
                title="Options"
                size="sm"
              >
                <Dropdown.Item onClick={this.props.onStartOver}>Start over</Dropdown.Item>
                <Dropdown.Item onClick={this.props.onFinishNow}>Go to end</Dropdown.Item>
                <Dropdown.Item onClick={this.props.onFinishRandomly}>Random</Dropdown.Item>
              </DropdownButton>
            </ButtonGroup>
            <ButtonGroup>
              <Button
                disabled={
                  this.props.validity === undefined ||
                  this.props.validity.status === "Error"
                }
                onClick={this.props.onSubmit}
              >
                Next
              </Button>
            </ButtonGroup>
          </ButtonToolbar>
        </Card.Footer>
      </Card>
    );
  }
}

export default AskedQuestionFramed;
