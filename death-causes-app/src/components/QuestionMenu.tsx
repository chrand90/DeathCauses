import React, { ChangeEvent } from 'react';
import './QuestionMenu.css';
import Button from 'react-bootstrap/Button';
import { Row, Col, Form } from 'react-bootstrap';
import Factors from '../models/Factors';

interface I_QuestionMenu {
  factors: Factors,
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void,
  handleSubmit: (e: React.MouseEvent) => void;
}

class QuestionMenu extends React.Component<I_QuestionMenu> {
  constructor(props: I_QuestionMenu) {
    super(props)

    // this.handleCallback = this.handleCallback.bind(this)
  }

  // handleCallback(event) {
  //   this.props.handleChange(event)
  // }

  // handleCallback2 = (event) => {
  //   this.props.handleChange(event)
  // }

  renderQuestionList() {
    let factorAnswers = this.props.factors
    //this should make a list of questions. At its disposal, it has the this.props.factor_database and this.props.factor_answers.
    return (

      <div><p>Input risk factors to calculate probability of dying of most diseases and expected lifespan</p>
        <form>
          <Form.Group >
            <Form.Row>
              <Form.Label column sm={4}>
                BMI</Form.Label>
              <Col>
                <Form.Control type="text" placeholder="BMI" name="bmi" value={factorAnswers.bmi} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column sm={4}>
                Fish consumed / week</Form.Label>
              <Col>
                <Form.Control type="text" placeholder="grams of fish" name="fish" value={factorAnswers.fish} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column sm={4}>
                Waist circumference</Form.Label>
              <Col>
                <Form.Control type="text" placeholder="waist cm" name="waist" value={factorAnswers.waist} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column sm={4}>
                BMI</Form.Label>
              <Col>
                <Form.Control type="text" placeholder="Age" name="age" value={factorAnswers.age} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column sm={4}>
                Gender</Form.Label>
              <Col>
                <Form.Control as="select" placeholder="Gender" name="gender" value={factorAnswers.gender} onChange={this.props.handleChange}>
                  <option selected disabled>Select gender</option>
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
                <Form.Control type="checkbox" name="diabetes" checked={factorAnswers.diabetes} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
          </Form.Group>
          <Button variant="primary" type="submit" onClick={this.props.handleSubmit}> Re-visualize </Button>
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
              <input type="text" placeholder="BMI: 18-25" name="bmi" value={this.props.bmi} onChange={this.props.handleChange} />
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
    </div>);
  };
}

export default QuestionMenu;