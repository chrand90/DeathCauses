import { observer } from "mobx-react";
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import Spinner from "react-bootstrap/Spinner";
import Header from "./components/Header";
import QuestionMenu from "./components/QuestionMenu";
import VizWindow from "./components/VizWindow";
import "./Main.css";
import RootStore, { withStore } from "./stores/rootStore";

interface MainProps {
  store: RootStore
}

class MainWithoutObserver extends React.Component<MainProps> {

  constructor(props: MainProps) {
    super(props);
  }

  render() {
    return (
      <div className="Main">
        <Container fluid>
          <Row>
            <Col lg={5} xl={4} style={{ padding: "0px" }}>
              {this.props.store.loadedQuestionMenuData ? <QuestionMenu /> : <Spinner animation="grow" />}
            </Col>
            <Col lg={7} xl={8} style={{ padding: "0px" }}>
              {this.props.store.loadedVizWindowData
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
