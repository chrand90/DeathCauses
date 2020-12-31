import React from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { ButtonToolbar } from "reactstrap";
import { InputValidity } from "../models/Factors";

interface AskedQuestionProps {
  factorName: string | undefined;
  validity: InputValidity | undefined;
  onSubmit: (event: React.FormEvent) => void;
  previousPossible: boolean;
  onPrevious: () => void;
  onStartOver: () => void;
}

class AskedQuestionFramed extends React.Component<AskedQuestionProps, any> {
  constructor(props: AskedQuestionProps) {
    super(props);
  }

  render() {
    return (
      <Card style={{ marginBottom: "40px" }}>
        <Card.Title>
          {this.props.factorName ? this.props.factorName : "No more questions"}
        </Card.Title>
        <Card.Body>{this.props.children}</Card.Body>
        <Card.Footer>
          <ButtonToolbar>
            <ButtonGroup>
              <Button onClick={this.props.onStartOver}>Start over</Button>
              <Button disabled={!this.props.previousPossible} onClick={this.props.onPrevious}>Previous</Button>
              <Button
                disabled={
                  this.props.validity === undefined ||
                  this.props.validity.status === "Error"
                }
                onClick={this.props.onSubmit}
              >
                Next
              </Button>
              <Button>Skip to end</Button>
            </ButtonGroup>
          </ButtonToolbar>
        </Card.Footer>
      </Card>
    );
  }
}

export default AskedQuestionFramed;
