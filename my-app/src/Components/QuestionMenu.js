import React from 'react';
import './QuestionMenu.css';
import Button from 'react-bootstrap/Button';
import { Row, Col, Form } from 'react-bootstrap';


class QuestionMenu extends React.Component {

  constructor(props) {
    super(props)

    this.handleCallback = this.handleCallback.bind(this)
    // this.handleCallback = this.handleCallback.bind(this)
  }

  // handleChange(event) {
  //   const { name, value, type, checked } = event.target
  //   type === "checkbox" ? this.setState({ [name]: checked }) : this.setState({ [name]: value })
  // }

  handleCallback(event) {
    this.props.callbackFunction(event)
  }

  renderQuestionList() {
    //this should make a list of questions. At its disposal, it has the this.props.factor_database and this.props.factor_answers.
    return (

      <div><p>Input risk factors to calculate probability of dying of most diseases and expected lifespan</p>
        <form>
          <Form.Group >
            <Form.Row>
              <Form.Label column sm={4}>
                BMI</Form.Label>
              <Col>
                <Form.Control type="text" placeholder="BMI" name="bmi" value={this.props.bmi} onChange={this.props.callbackFunction} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column sm={4}>
                Fish consumed / week</Form.Label>
              <Col>
                <Form.Control type="text" placeholder="grams of fish" name="fish" value={this.props.bmi} onChange={this.props.callbackFunction} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column sm={4}>
                Waist circumference</Form.Label>
              <Col>
                <Form.Control type="text" placeholder="waist cm" name="waist" value={this.props.bmi} onChange={this.props.callbackFunction} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column sm={4}>
                BMI</Form.Label>
              <Col>
                <Form.Control type="text" placeholder="Age" name="age" value={this.props.bmi} onChange={this.props.callbackFunction} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column sm={4}>
                Gender</Form.Label>
              <Col>
                <Form.Control as="select" placeholder="Gender" name="gender" value={this.props.gender} onChange={this.props.callbackFunction}>
                  <option defaultValue disabled>Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Form.Control>
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column sm={4}>
                Diabetes</Form.Label>
              <Col>
                <Form.Control type="checkbox" name="diabetes" checked={this.props.diabetes} onChange={this.props.callbackFunction} />
              </Col>
            </Form.Row>
          </Form.Group>
          {/* <label>Gender
      <input type="radio" id="male" name="gender" value="Male" />
            <label htmlFor="male">Male</label> <br />
            <input type="radio" id="female" name="gender" value="Female" />
            <label htmlFor="female">Female</label> <br />
            <input type="radio" id="other" name="gender" vlaue="Other" />
            <label htmlFor="other">Other</label> <br />
          </label>
          <br />
      Age:
      <input type="date" />
          <br />
          <br />
          <br />
          <div class="line">
            <label for="input">What is your BMI?</label>
            <div>
              <input type="text" placeholder="BMI: 18-25" name="bmi" value={this.props.bmi} onChange={this.props.callbackFunction} />
            </div>
          </div>
          <br />
          <br />
          <br />
          <br />

      Do you have depression?

      <input type="radio" id="yes" name="depression" value="yes" />
          <label htmlFor="yes">Yes</label>

          <input type="radio" id="no" name="depression" value="no" />
          <label htmlFor="no">No</label>
          <br />


      Do you drink alcohol?

      <input type="radio" id="yes" name="alcohol" value="yes" />
          <label htmlFor="yes">Yes</label>

          <input type="radio" id="no" name="alcohol" value="no" />
          <label htmlFor="no">No</label>
          <br />
          <li>If yes, how much do you maximum drink in a week?</li>
          <br />
      Your waist circumference?
      <input type="text" name="waist" placeholder="cm" value={this.props.waist} onChange={this.handleCallback} /> */}
        </form></div >
    );
  }

  render() {
    return (<div className='questionmenu'>
      <h4> Risk factors  </h4>
      {this.renderQuestionList()}
      <Button variant="primary" onClick={this.props.test}> Re-visualize </Button>
    </div>);
  };
}

export default QuestionMenu;