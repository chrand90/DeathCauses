import React from "react";

import RootStore, { withStore } from "../stores/rootStore";
import Modal from "react-bootstrap/Modal";
import { observer } from "mobx-react";
import { SAVE_FILE_NAME, QUERY_STRING_START } from "./Helpers";
import { Button, Form } from "react-bootstrap";


interface FileDownloaderProps {
  toggler: () => void;
  store: RootStore;
}

class FileDownloaderWithoutStore extends React.Component<
  FileDownloaderProps,
  any
> {
  constructor(props: FileDownloaderProps) {
    super(props);
    this.downloadAsJSON = this.downloadAsJSON.bind(this);
    this.selectTextField = this.selectTextField.bind(this);
  }

  selectTextField(event: React.FocusEvent<HTMLTextAreaElement>) {
    if (event.currentTarget) {
      event.currentTarget.select();
    }
  }

  downloadAsJSON() {
    const bigObject = this.props.store.factorInputStore.getAllNecessaryInputs();
    const blob = new Blob([JSON.stringify(bigObject)], {
      type: "application/json",
    });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);
    element.download = SAVE_FILE_NAME;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }

  constructLink() {
    const inputData = this.props.store.factorInputStore.getAllNecessaryInputs();
    let url =
      process.env.NODE_ENV === "production"
        ? "http://deathcauses.com"
        : "http://localhost:3000";
    url += QUERY_STRING_START + encodeURIComponent(JSON.stringify(inputData));
    return url;
  }

  render() {
    return (
      <Modal show={true} onHide={() => this.props.toggler()}>
        <Modal.Header closeButton>
          <Modal.Title>Save input data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p> Download your data in a file. </p>
          <Button onClick={this.downloadAsJSON}>Download</Button>
          <hr></hr>
          <p>
            {" "}
            You can also use this link which contains your input data. It may be
            too long for some browsers.
          </p>
          <Form.Control
            as="textarea"
            aria-label="text area"
            rows={5}
            readOnly
            autoFocus
            onFocus={this.selectTextField}
          >
            {this.constructLink()}
          </Form.Control>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-end">
            <Button onClick={() => this.props.toggler()}>Exit</Button>
          </div>
        </Modal.Footer>
      </Modal>
    );
  }
}

const FileDownloader = withStore(observer(FileDownloaderWithoutStore));
export default FileDownloader;
