import React, { ChangeEventHandler } from "react";

import Modal from "react-bootstrap/Modal";
import { Button, Form, Spinner } from "react-bootstrap";
import RootStore, { withStore } from "../stores/rootStore";
import { observer } from "mobx-react";
import { CHANGED_COLOR, ERROR_COLOR, SUCCESS_COLOR } from "./Question";
import { SendStatus } from "../stores/SendEmailStore";

interface SendEmailProps {
  toggler: () => void;
  store: RootStore;
}

class SendEmailWithoutStore extends React.Component<SendEmailProps, any> {
  getSubmitColor() {
    return this.props.store.sendEmailStore.ready ? CHANGED_COLOR : "";
  }

  sendButton() {
    return (
      <Button
        onClick={this.props.store.sendEmailStore.sendForm}
        style={{ backgroundColor: this.getSubmitColor() }}
        disabled={this.props.store.sendEmailStore.message.length > 10000 || this.props.store.sendEmailStore.email.length>1000 || this.props.store.sendEmailStore.username.length>1000}
      >
        Send
      </Button>
    );
  }

  exitButton() {
    return (
        <Button
          onClick={() => this.props.toggler()}
        >
          Exit
        </Button>
      );
  }

  finalButton() {
    if(this.props.store.sendEmailStore.sendStatus === SendStatus.SENDING ) {
        return <div>
                <span>Sending your message...</span>
                <Spinner animation="border" size="sm" ></Spinner>
            </div>
    }
    if (this.props.store.sendEmailStore.sendStatus === SendStatus.PREPARTION) {
        return this.sendButton()
    }
    if (this.props.store.sendEmailStore.sendStatus === SendStatus.SUCCESS) {
        return (
            <div>
                <span style={{color: SUCCESS_COLOR}}>Message sent!</span>
                {" "}
                {this.exitButton()}
            </div>
        )
    }
    if (this.props.store.sendEmailStore.sendStatus === SendStatus.ERROR) {
        return (
            <div>
                <span style={{color: ERROR_COLOR}}>Something went wrong</span>
                {" "}
                {this.exitButton()}
            </div>
        )
    }
  }

  render() {
    const textColor=this.props.store.sendEmailStore.sendStatus===SendStatus.SUCCESS ? SUCCESS_COLOR :
      (this.props.store.sendEmailStore.sendStatus === SendStatus.ERROR ? ERROR_COLOR : "");
    return (
      <Modal show={true} onHide={() => this.props.toggler()}>
        <Modal.Header closeButton>
          <Modal.Title>Send us an email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Label>Your Name</Form.Label>
            <Form.Control
              type="text"
              value={this.props.store.sendEmailStore.username}
              style={{color:textColor}}
              onChange={this.props.store.sendEmailStore.inputChangeWrapper}
              name={"username"}
            />
            <Form.Label>Your Email</Form.Label>
            <Form.Control
              type="text"
              value={this.props.store.sendEmailStore.email}
              style={{color:textColor}}
              onChange={this.props.store.sendEmailStore.inputChangeWrapper}
              name={"email"}
            />
            <Form.Label>Your Message</Form.Label>
            <Form.Control
              as="textarea"
              value={this.props.store.sendEmailStore.message}
              style={{color:textColor,  minHeight: "200px"}}
              onChange={this.props.store.sendEmailStore.inputChangeWrapper}
              name={"message"}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-end">
            {this.finalButton()}
          </div>
        </Modal.Footer>
      </Modal>
    );
  }
}

const SendEmail = withStore(observer(SendEmailWithoutStore));
export default SendEmail;
