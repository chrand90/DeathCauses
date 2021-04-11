import React from 'react';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';
import { Switch, Route, Router, Link, BrowserRouter, withRouter } from 'react-router-dom';
import { ContactPage } from './ContactPage';
import Main from './Main';
import Navigation from './NavBar';
import NavBar from './NavBar';
var html = require('./resources/intro.nb.html')
var template = { __html: html }



export default class App extends React.Component {

    render() {
        return (
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