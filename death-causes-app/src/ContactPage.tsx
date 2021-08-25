import React from "react";
import { CardDeck, Container, Row } from "react-bootstrap";
import { ContactCard } from "./ContactCard";

export class ContactPage extends React.Component {
    render() {
        return (
            <Container className="pt-3 " style={{ backgroundColor: "lightgrey" }} >
                <div className="pb-3">
                    <h2 style={{ textAlign: "center" }}>Who are we?</h2>
                </div>
                <Row>
                    <CardDeck className="justify-content-center mx-auto">
                        <ContactCard description="Codebase. Model development. Database curation." name="Svend V Nielsen" imageUrl="https://mdbootstrap.com/img/Photos/Avatars/img%20(31).jpg" />
                        <ContactCard description="Codebase." name="Christian Andersen" imageUrl="https://mdbootstrap.com/img/Photos/Avatars/img%20(31).jpg" />
                    </CardDeck>
                </Row>
                
                <div style={{textAlign: "left"}}>
                    <h5>Thanks for</h5>
                    <h6>Database</h6>
                    <ul>
                        <li>Maria Vendelbo Nielsen (HPV Vaccine)</li>
                    </ul>
                    <h6>Feedback</h6>
                    <ul>
                        <li>Anna Lauridsen</li>
                        <li>Henrik Vendelbo Nielsen</li>
                        <li>Signe Vendelbo Nielsen</li>
                        <li>Århus Esperantoforening</li>
                    </ul>
                </div>
            </Container>
        );
    }
}