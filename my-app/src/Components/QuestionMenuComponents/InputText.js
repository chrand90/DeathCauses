import React from 'react';
import { Col, Form } from 'react-bootstrap';


class InputText extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <Form.Row>
                <Form.Label column sm={4}>
                    {this.props.question.placeholder}
                </Form.Label>
                <Col>
                    <Form.Control type="text" placeholder={this.props.question.placeholder} name={this.props.question.factorName} checked={this.props.questionValue} onChange={this.props.handleChange} />
                </Col>
            </Form.Row>
        )
    }
}
export default InputText