import React from "react";
import Button from "react-bootstrap/Button";
import { Container, Spinner } from "react-bootstrap";
import { withRouter, RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import RootStore, { withStore } from "./stores/rootStore";
import { DeathCauseHierarchy, NodeType } from "./models/RelationLinks";
import { isReturnStatement } from "typescript";

enum LoadingStatus {
  LOADING = "loading",
  READY = "loaded",
}

interface PageInfo {
    linkText:string,
    direct: string
}

const SPECIAL_PAGES: PageInfo[]=[
    {linkText:"Introduction", direct:"intro"}
]

interface AboutEntryProps extends RouteComponentProps{
    store: RootStore
}

class AboutEntryWithoutRouterAndWithoutStore extends React.Component<AboutEntryProps> {
  constructor(props: AboutEntryProps) {
    super(props);
    this.redirect = this.redirect.bind(this);
  }

  redirect(target: string) {
    this.props.history.push("/model/" + target);
  }

  linkButton(text:string, direct:string, size:string | null=null){
    const styleObject= size ? {fontSize:size} : {}
    return (
        <Button 
            variant="link" 
            onClick={() => this.redirect(direct)}
            className="text-link-button"
            style={styleObject}>
            {text}
          </Button>
    )
  }

  recursiveNesting(d: DeathCauseHierarchy[]){
    return [...d].sort((a,b) => {
        const aName=this.props.store.loadedDataStore.descriptions.getDescription(a.key, 100)
        const bName=this.props.store.loadedDataStore.descriptions.getDescription(b.key, 100)
        return aName.localeCompare(bName)
    }).map( nestedList => {
        return (
                <li>
                {this.linkButton(
                    this.props.store.loadedDataStore.descriptions.getDescription(nestedList.key, 100),
                    nestedList.key)}
                {nestedList.children ? 
                    <ul>{this.recursiveNesting(nestedList.children)} </ul> : 
                    null 
                }
            </li>
        )
    })
  }

  makePlainList(nodetype: NodeType){
    if(!this.props.store.loadedDataStore.loadedVizWindowData ||
        !this.props.store.loadedDataStore.loadedQuestionMenuData){
        return <Spinner animation="border"></Spinner>
    }
    const nodeCodes=this.props.store.loadedDataStore.rdat.sortedNodes[nodetype]
    const nodeInfos=nodeCodes.map( nodeCode => {
        const longName=this.props.store.loadedDataStore.descriptions.getDescription(nodeCode, 100)
        return {longName: longName, shortName: nodeCode}
    }).sort((a,b) => {
        return a.longName.localeCompare(b.longName)
    })
    return (
        <ul>
            {nodeInfos.map(({longName, shortName}) => {
                return <li> {this.linkButton(longName, shortName)}  </li>
            })}
        </ul>
        
    )
  }

  makeNestedList(){
    if(!this.props.store.loadedDataStore.loadedVizWindowData ||
        !this.props.store.loadedDataStore.loadedQuestionMenuData){
        return <Spinner animation="border"></Spinner>
    }
    return (
        <ul>
            {this.recursiveNesting(this.props.store.loadedDataStore.rdat.deathCauseNesting)}
        </ul>
    )
    
  }

  render() {
    return (
        <div style={{backgroundColor:"#F0F0F0"}}>
      <Container style={{backgroundColor:"#F0F0F0"}}>
        <h1>About the model</h1>
        <p style={{fontSize:"22px"}}>
         Read first:{" "}
          {this.linkButton("Introduction", "intro", "22px")}
        </p>
        <hr></hr>
        <h3>All pages</h3>
        <h4>General concepts</h4>
        <ul>
            {SPECIAL_PAGES.map(({linkText, direct})=> {
                return <li> {this.linkButton(linkText, direct)} </li>
            })}
        </ul>
        <h4>Death causes</h4>
            {this.makeNestedList()}
        <h4>Conditions</h4>
            {this.makePlainList(NodeType.CONDITION)}
        <h4>Compted Factors</h4>
            {this.makePlainList(NodeType.COMPUTED_FACTOR)}
        <h4>Input Factors</h4>
            {this.makePlainList(NodeType.INPUT)}
      </Container>
      </div>
    );
  }
}

const AboutEntry = withRouter(withStore(observer(AboutEntryWithoutRouterAndWithoutStore)));
export default AboutEntry;
