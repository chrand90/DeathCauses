import React from 'react';
import { Container } from 'react-bootstrap';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { AboutPage } from './AboutPage';
import { AnswerProgress, QuestionMenuStates, QuestionView } from './components/QuestionMenu';
import { ContactPage } from './ContactPage';
import Main from './Main';
import Navigation from './NavBar';

interface AppState {
    questionMenuState: QuestionMenuStates
}

export default class App extends React.Component<{}, AppState> {

    constructor(props: any) {
        super(props)
        this.state = {
            questionMenuState: {
                validities: {},
                factorAnswers: {},
                factorAnswerScales: {},
                hasBeenAnswered: [],
                answeringProgress: AnswerProgress.ANSWERING,
                currentFactor: "",
                activelyIgnored: {},
                windowWidth: Math.max(
                    document.documentElement.clientWidth,
                    window.innerWidth || 0
                  ),
                factorMaskings: {},
                view: QuestionView.QUESTION_MANAGER,
                changedSinceLastCommit: false,
            }
        }

        this.updateQuestionMenuState = this.updateQuestionMenuState.bind(this)
    }

    updateQuestionMenuState(updatedState: QuestionMenuStates, callback: () => void) {
        this.setState({
            questionMenuState: updatedState
        }, callback)
    }

    render() {
        return (
            <BrowserRouter>
                <Navigation />
                <Switch>
                    <Route exact path="/">
                        <Main questionMenuState={this.state.questionMenuState} updateQuestionMenuStates={this.updateQuestionMenuState} />
                    </Route>
                    <Route exact path="/model">
                        <AboutPage />
                    </Route>
                    <Route exact path="/contact">
                        <ContactPage />
                    </Route>
                    <Route exact>
                        <Error />
                    </Route>
                </Switch>
            </BrowserRouter>
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