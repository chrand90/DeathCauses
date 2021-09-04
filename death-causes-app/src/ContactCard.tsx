import React from "react";
import { Card } from "react-bootstrap";
import { DEATHCAUSES_COLOR, hideAllToolTips } from "./components/Helpers";

interface ContactCardProps {
    name: string,
    description: string,
    imageUrl: string,
}

export class ContactCard extends React.Component<ContactCardProps> {
    //<img width="80%" style={{ display: "inline-block" }} className="mx-auto mb-3 mt-4 " alt="50x50" src={this.props.imageUrl} data-holder-rendered="true" />
    render() {
        return (
            <Card className="mx-5" style={{  width: "40%", maxWidth:"500px", minWidth:"250px", borderWidth:"2px", borderColor: DEATHCAUSES_COLOR, marginBottom:"30px"}}>
                <Card.Body>
                    <h4 className="card-title mx-auto mb-0" style={{ fontWeight: 700, textAlign: "center" }}>{this.props.name}</h4>
                    <div className="card-body">
                        <p className="card-text">{this.props.description}</p>
                    </div>
                </Card.Body>
            </Card>
        )
    }



}