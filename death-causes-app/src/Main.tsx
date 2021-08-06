import { observer } from "mobx-react";
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import Spinner from "react-bootstrap/Spinner";
import QuestionMenu from "./components/QuestionMenu";
import VizWindow from "./components/VizWindow";
import "./Main.css";
import RootStore, { withStore } from "./stores/rootStore";

interface MainProps {
  store: RootStore
}

class MainWithoutObserver extends React.Component<MainProps> {

  render() {
    let styleObject: { [k: string]: string } = {}
    styleObject["padding"] = "0px"
    if (!this.props.store.uIStore.verticalStacked) {
      styleObject["height"] = "calc(100vh - 72px)"
      styleObject["overflow"] = "auto"
    } else {
      styleObject["overflow"] = "hidden"
    }
    return (
      <div className="Main">
        <Container fluid>
          <Row>
            <Col lg={5} xl={4} style={styleObject}>
              {this.props.store.loadedDataStore.loadedQuestionMenuData ? <QuestionMenu /> : <Spinner animation="grow" />}
            </Col>
            <Col lg={7} xl={8} style={styleObject}>
              {this.props.store.loadedDataStore.loadedVizWindowData && this.props.store.loadedDataStore.loadedQuestionMenuData
                ? <VizWindow />
                : <Spinner animation="grow" />}
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

}

const App = withStore(observer(MainWithoutObserver));
export default App;
