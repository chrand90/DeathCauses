import React from "react";
import { Card } from "react-bootstrap";
import { hideAllToolTips } from "./components/Helpers";

interface ContactCardProps {
    name: string,
    description: string,
    imageUrl: string,
}

export class ContactCard extends React.Component<ContactCardProps> {

    render() {
        return (
            <Card className="mx-5 border border-white mb-5" style={{ width: "22rem" }}>
                <img width="80%" style={{ display: "inline-block" }} className="mx-auto mb-3 mt-4 " alt="50x50" src={this.props.imageUrl} data-holder-rendered="true" />
                <Card.Body>
                    <h4 className="card-title mx-auto mb-0" style={{ fontWeight: 700, textAlign: "center" }}>{this.props.name}</h4>
                    <div className="card-body">
                        <p className="card-text">{this.props.description}</p>
                        <ul>
                            <li>Contact: </li>
                        </ul>
                    </div>
                </Card.Body>
            </Card>
        )
    }

    componentDidMount(){
        hideAllToolTips()
    }
}