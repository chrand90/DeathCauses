import React from "react";
import { Card, CardDeck, Container, Row } from "react-bootstrap";
import { DEATHCAUSES_COLOR, DEATHCAUSES_LIGHT } from "./components/Helpers";
import { ContactCard } from "./ContactCard";
import Button from "react-bootstrap/Button"
import SendEmail from "./components/SendEmailToUs";
import {hideAllToolTips} from "./components/Helpers";


interface ContactPageStates {
    showContactMenu: boolean
}

export class ContactPage extends React.Component<any, ContactPageStates> {

    constructor(props: any){
        super(props);
        this.state={
            showContactMenu: false
        }
    }

    componentDidMount(){
        hideAllToolTips()
    }

    render() {
        return (
            <Container className="pt-3 " style={{backgroundColor: "lightgrey",  minHeight: "calc(100vh - 73px)" }} >
                <div className="pb-3">
                    <h2 style={{ textAlign: "center" }}>Who are we?</h2>
                </div>
                <Row>
                    <CardDeck className="justify-content-center mx-auto">
                        <ContactCard description="Codebase. Model development. Database curation." name="Svend V Nielsen" imageUrl="https://mdbootstrap.com/img/Photos/Avatars/img%20(31).jpg" />
                        <ContactCard description="Codebase." name="Christian Andersen" imageUrl="https://mdbootstrap.com/img/Photos/Avatars/img%20(31).jpg" />
                    </CardDeck>
                </Row>

                <div className="pb-3">
                    <h2 style={{ textAlign: "center" }}>Contact</h2>
                </div>

                <Row  className="justify-content-center mx-auto">
                <Card className="mx-auto" style={{ width: "80%",maxWidth:"800px", minWidth:"250px", borderColor: DEATHCAUSES_COLOR, marginBottom:"40px", borderWidth: "2px" }}>
                    <Card.Body >
                        <p className="justify-content-between"><strong>Twitter:</strong>
                        <Button variant="link" onClick={
                                () => {
                                    window.open("http://twitter.com/deathcausescom")
                                }
                            }>  twitter.com/deathcausescom  </Button></p>
                        <p className="justify-content-between"><strong>Email:</strong>
                        <Button variant="link" onClick={
                                () => {
                                    this.setState({showContactMenu: true})
                                }
                            }>  Open form  </Button></p>
                    </Card.Body>
                            
                        </Card>
                </Row>

                <div style={{textAlign: "left", color: "rgb(84,88,94)", marginTop:"50px"}}>
                    <h5 style={{textAlign: "center", color:"rg"}}>Thanks</h5>
                    <h6>Database</h6>
                    <ul>
                        <li>Maria Vendelbo Nielsen (HPV Vaccine)</li>
                    </ul>
                    <h6>Feedback</h6>
                    <ul>
                        <li>Anna Lauridsen</li>
                        <li>Louise Hørning Møller</li>
                        <li>Henrik Vendelbo Nielsen</li>
                        <li>Signe Vendelbo Nielsen</li>
                        <li>Århus Esperantoforening</li>
                    </ul>
                </div>
                {this.state.showContactMenu ? <SendEmail toggler={() => this.setState({showContactMenu: !this.state.showContactMenu})}></SendEmail> : null}
            </Container>
        );
    }
}