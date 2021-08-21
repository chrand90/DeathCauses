import React from "react";
import Button from "react-bootstrap/Button";
import { Container, Spinner } from "react-bootstrap";
import { withRouter, RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import RootStore, { withStore } from "./stores/rootStore";
import { hideAllToolTips } from "./components/Helpers";
import InternalRedirectButton from "./components/InternalRedirectButton";
import { NodeType } from "./models/RelationLinks";

enum LoadingStatus {
  LOADING = "loading",
  READY = "loaded",
}

class ICDPageWithoutStore extends React.Component<{ store: RootStore }> {
  componentDidMount() {
    hideAllToolTips();
    if (!this.props.store.loadedDataStore.loadedICD) {
      this.props.store.loadedDataStore.loadICDfiles();
    }
  }

  listAllCauses(){
    const causeOrder = this.props.store.loadedDataStore.rdat.sortedNodes[NodeType.CAUSE].concat().sort()
    return causeOrder.map(cause => this.specificCause(cause))
  }

  specificCause(causeName: string) {
    const description=this.props.store.loadedDataStore.descriptions.getDescription(causeName,50)
    return (
        <div>
            <h4> {description}</h4>
            <p>All the ICD codes assigned to <InternalRedirectButton direct={causeName}>{description}</InternalRedirectButton>:</p>
            {this.props.store.loadedDataStore.loadedICD ? 
                <p> <small>{this.props.store.loadedDataStore.icdDict[causeName].join(", ")} </small></p> : 
                <div><Spinner animation="border"></Spinner><small>Loading ICD codes...</small></div>}
        </div>
    )
  }

  render() {
    return (
      <div style={{ backgroundColor: "#F0F0F0" }}>
        <Container style={{ backgroundColor: "#F0F0F0" , minHeight:"calc(100vh - 72px)"}}>
          <h1>ICD codes</h1>
          <p>This page lists all ICD codes to which health professionals assigned at least one death in 2014. 
              The ICD codes are divided into death causes. 
              If you are looking for a specific ICD code, you can search for the code using your browser's 
              build-in search tool (possibly CTRL+F).</p>
          <hr></hr>
          {this.props.store.loadedDataStore.loadedRelationLinks ? 
            this.listAllCauses() :
            <div><Spinner animation="grow"></Spinner><small>Loading the list of death causes...</small></div>}
        </Container>
      </div>
    );
  }
}

const ICDPage = withStore(observer(ICDPageWithoutStore));
export default ICDPage;
