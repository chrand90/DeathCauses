import React from "react";
import { Col, Container, Row } from "reactstrap";
import "./App.css";
import Header from "./components/Header";
import QuestionMenu from "./components/QuestionMenu";
import VizWindow from "./components/VizWindow";
import Spinner from "react-bootstrap/Spinner";
import {StoreContext, store} from "./stores/rootStore";
import {observer} from "mobx-react";


class AppWithoutObserver extends React.Component {

  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <div className="App">
        <StoreContext.Provider value={store}>
        <Header />
        <Container fluid>
          <Row>
            <Col lg={5} xl={4} style={{ padding: "0px" }}>
              {store.loadedQuestionMenuData ?  <QuestionMenu/> : <Spinner animation="grow" />}
            </Col>
            <Col lg={7} xl={8} style={{ padding: "0px" }}>
              { store.loadedVizWindowData 
                ? <VizWindow />
                : <Spinner animation="grow" />}
            </Col>
          </Row>
        </Container>
        </StoreContext.Provider >
      </div>
    );
  }

}

const App= observer(AppWithoutObserver);
export default App;
