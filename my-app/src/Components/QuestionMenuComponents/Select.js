import React from "react"
import { Col, Form } from 'react-bootstrap';

class Select extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <Form.Row>
                <Form.Label column sm={4}>
                {this.props.question.placeholder}</Form.Label>
                <Col>
                    <Form.Control as="select" key={this.props.question.key} placeholder={this.props.question.placeholder} name={this.props.question.factorName} value={this.props.questionValue} onChange={this.props.handleChange}>
                        <option defaultValue disabled></option>
                        {this.generateSelectList(this.props.question.options)}
                    </Form.Control>
                </Col>
            </Form.Row>
        )
    }

    generateSelectList(selections) {
        return selections.map((selection, index) => <option key={index} value={selection.value}>{selection.text}</option>)
    }
}
export default Select