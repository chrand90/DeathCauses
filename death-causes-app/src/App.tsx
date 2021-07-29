import { observer } from "mobx-react";
import React from 'react';
import { Container } from 'react-bootstrap';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import AboutEntry from "./AboutEntry";
import AboutPage from "./AboutPage";
import { ContactPage } from './ContactPage';
import Main from './Main';
import Navigation from './NavBar';
import { store, StoreContext } from "./stores/rootStore";


class AppWithoutObserver extends React.Component {

  render() {
    if (store.uIStore.verticalStacked) {
      document.body.style.overflow = "auto"
    }
    else {
      document.body.style.overflow = "hidden"
    }
    return (
      <StoreContext.Provider value={store}>
        <BrowserRouter>
          <Switch>
            <Route exact path="/">
              <Navigation fullWidth={true} />
              <Main />
            </Route>
            <Route exact path="/model/:subpage">
              <Navigation fullWidth={true} />
              <AboutPage />
            </Route>
            <Route exact path="/model">
              <Navigation fullWidth={true} />
              <AboutEntry />
            </Route>
            <Route exact path="/contact">
              <Navigation fullWidth={true} />
              <ContactPage />
            </Route>
            <Route exact>
              <Navigation fullWidth={true} />
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
