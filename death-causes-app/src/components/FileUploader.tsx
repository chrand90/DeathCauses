import React from "react";

import RootStore, { withStore } from "../stores/rootStore";
import Modal from "react-bootstrap/Modal";
import { observer } from "mobx-react";
import { SAVE_FILE_NAME } from "./Helpers";
import { Button, Form, Spinner } from "react-bootstrap";
import {SUCCESS_COLOR, ERROR_COLOR} from "./Question";
import { AllNecessaryInputs } from "../stores/FactorInputStore";

interface FileUploaderProps {
  toggler: () => void;
  store: RootStore;
}

enum UploadStatus {
  NOTHING = "Nothing uploaded",
  CHECKING = "Checking",
  SUCCESS = "Success",
  INVALID = "Invalid input",
}

interface FileUploaderStates {
  status: UploadStatus;
  message: string;
  candidateJSON: AllNecessaryInputs | null;
}

class FileUploaderWithoutStore extends React.Component<FileUploaderProps, FileUploaderStates> {

  constructor(props: FileUploaderProps) {
    super(props);
    this.state = {
      candidateJSON: null,
      status: UploadStatus.NOTHING,
      message: "Upload file",
    };
    this.checkFile=this.checkFile.bind(this);
    this.handleFileUpload=this.handleFileUpload.bind(this);
    this.submitData=this.submitData.bind(this);
  }

  submitData(){
    this.props.store.factorInputStore.insertData(this.state.candidateJSON!)
    this.props.store.questionProgressStore.finishQuestionnaireStartOverview();
    this.props.toggler();
  }

  handleFileUpload(event: React.FormEvent<HTMLInputElement>){
    if(event.currentTarget){
      const uploadedFile=event.currentTarget.files && event.currentTarget.files.length>0 ? event.currentTarget.files[0] : null;
      if(uploadedFile){
        this.checkFile(uploadedFile)
      }
      else{
        this.setState({status: UploadStatus.NOTHING, message:"Upload file", candidateJSON: null})
      }
    }
  }

  checkIfRightType(object: any){
    const currentFactors=this.props.store.factorInputStore.getAllNecessaryInputs()
    if(Object.keys(object).sort().join("-")===Object.keys(currentFactors).sort().join("-")){
      this.setState({message: "Nothing seems wrong", status: UploadStatus.SUCCESS, candidateJSON: (object as AllNecessaryInputs)})
      return true;
    }
    else{
      this.setState({message:"Invalid keys in JSON file", status: UploadStatus.INVALID})
      return false;
    }
  }

  checkFile(fileCandidate: File){
    if(fileCandidate.size>100000){
      this.setState({
        status: UploadStatus.INVALID,
        message: "File too big to be checked",
        candidateJSON: null
      })
      return;
    }
    let reader = new FileReader();
    reader.readAsText(fileCandidate);
    this.setState({status: UploadStatus.CHECKING,message:"checking file...", candidateJSON:null})
    reader.onload = () => {
      if(typeof reader.result === "string"){
        try{
          const inputAsJSON= JSON.parse(reader.result);
          this.checkIfRightType(inputAsJSON)
        }
        catch(e: any){
          this.setState({
            status: UploadStatus.INVALID,
            message: "File could not be recognized as JSON",
            candidateJSON: null
          })
          return;
        }
      }
      else{
        this.setState({
          status: UploadStatus.INVALID,
          message: "File could not be recognized",
          candidateJSON: null
        })
        return;
      }
    };
  
    reader.onerror = () => {
      this.setState({
          status: UploadStatus.INVALID,
          message: "Error occured when loading file",
          candidateJSON: null
        })
        return;
    };
  }

  formLabelStyle():{[key:string]:string}{
    let res:{[key:string]:string}={"fontSize":"12px"};
    switch(this.state.status){
      case UploadStatus.CHECKING:
      case UploadStatus.NOTHING:{
        //nothing
        break;
      }
      case UploadStatus.INVALID:{
        res["color"]=ERROR_COLOR;
        break;
      }
      case UploadStatus.SUCCESS:{
        res["color"]=SUCCESS_COLOR;
        break;
      }
      default: {
        break;
      }
    }
    return res
  }

  render() {
    return (
      <Modal show={true} onHide={() => this.props.toggler()}>
        <Modal.Header closeButton>
          <Modal.Title>Use local file</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Upload a file that was previously saved from this website. When it
            was downloaded, it had the name "{SAVE_FILE_NAME}".
          </p>
          <p>
            The file will not be saved and if you refresh the page, you have to
            upload it again.
          </p>
          <div className="mb-3">
            <Form.File id="formcheck-api-regular">
              <Form.File.Input id="personalData" onChange={this.handleFileUpload}/>
            </Form.File>
            <Form.Label style={this.formLabelStyle()}>  {  this.state.status === UploadStatus.CHECKING ? <Spinner animation="border" size="sm"></Spinner>  :null } {this.state.message} </Form.Label>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-end">
            <Button onClick={() => this.props.toggler()}>
              Cancel
            </Button>
            <div style={{width:"10px"}}></div>
            <Button disabled={this.state.candidateJSON===null} onClick={this.submitData}>
              Insert data
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    );
  }
}

const FileUploader = withStore(observer(FileUploaderWithoutStore));
export default FileUploader;
