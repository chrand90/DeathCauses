import "./App.css";
import Header from "./components/Header";
import QuestionMenu from "./components/QuestionMenu";
import VizWindow from "./components/VizWindow";
import Spinner from "react-bootstrap/Spinner";
import { StoreContext, store } from "./stores/rootStore";
import { observer } from "mobx-react";
import React from 'react';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';
import { Switch, Route, Router, Link, BrowserRouter, withRouter } from 'react-router-dom';
import { ContactPage } from './ContactPage';
import Main from './Main';
import Navigation from './NavBar';
import NavBar from './NavBar';
var html = require('./resources/intro.nb.html')
var template = { __html: html }


class AppWithoutObserver extends React.Component {

  constructor(props: any) {
    super(props);
  }



  // <div className="App">
  //   <Header />
  //   <Container fluid>
  //     <Row>
  //       <Col lg={5} xl={4} style={{ padding: "0px" }}>
  //         {store.loadedQuestionMenuData ? <QuestionMenu /> : <Spinner animation="grow" />}
  //       </Col>
  //       <Col lg={7} xl={8} style={{ padding: "0px" }}>
  //         {store.loadedVizWindowData
  //           ? <VizWindow />
  //           : <Spinner animation="grow" />}
  //       </Col>
  //     </Row>
  //   </Container>

  // </div>
  //     );
  //   }

  // }

  render() {
    return (
      <StoreContext.Provider value={store}>

        <BrowserRouter>
          <Switch>
            <Route exact path="/">
              <Navigation fullWidth={true} />
              <Main />
            </Route>
            <Route exact path="/model">
              <Navigation fullWidth={false} />
              <About />
            </Route>
            <Route exact path="/contact">
              <Navigation fullWidth={false} />
              <ContactPage />
            </Route>
            <Route exact>
              <Navigation fullWidth={false} />
              <Error />
            </Route>
          </Switch>
        </BrowserRouter>
      </StoreContext.Provider >
    );
  }
}

function Home() {
  return (
    <Main />
  );
}

function About() {
  return (
    <Container>
      <h2>About</h2>
      <span dangerouslySetInnerHTML={template} />
    </Container>
  );
}

function Error() {
  return (
    <Container>
      <div>
        <h2>Error</h2>
      </div>
    </Container>

  );
}


const App = observer(AppWithoutObserver);
export default App;
