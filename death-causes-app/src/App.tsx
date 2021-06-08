import { observer } from "mobx-react";
import React from 'react';
import { Container } from 'react-bootstrap';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { AboutPage } from "./AboutPage";
import { ContactPage } from './ContactPage';
import Main from './Main';
import Navigation from './NavBar';
import { store, StoreContext } from "./stores/rootStore";


class AppWithoutObserver extends React.Component {

  constructor(props: any) {
    super(props);
  }

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
              <AboutPage />
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
