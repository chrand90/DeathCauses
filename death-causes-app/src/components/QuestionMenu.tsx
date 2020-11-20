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
        <Button variant="primary" type="submit" onClick={this.props.handleSubmit}> Re-visualize </Button>
          <Form.Group >
            <Form.Row>
              <Form.Label column>
                BMI</Form.Label>
              <Col>
                <Form.Control type="text" placeholder="BMI" name="bmi" value={factorAnswers.bmi} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column >
                Fish consumed / week</Form.Label>
              <Col>
                <Form.Control data-toggle="tooltip" data-placement="right" title="One fish is 100g" type="text" placeholder="grams of fish" name="fish" value={factorAnswers.fish} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column >
                Cups of Coffees / day</Form.Label>
              <Col>
                <Form.Control data-toggle="tooltip" data-placement="right" title="caffeiene in cola also counts" type="text" placeholder="cups of coffee" name="caffeine" value={factorAnswers.caffeine} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column >
                Vegetables / day</Form.Label>
              <Col>
                <Form.Control data-toggle="tooltip" data-placement="right" title="a vegetable is 100g. This excludes fruit" type="text" placeholder="grams of vegetables" name="vegetables" value={factorAnswers.vegetables} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column >
                Greens / day</Form.Label>
              <Col>
                <Form.Control data-toggle="tooltip" data-placement="right" title="a green is 100g. This includes both vegetables and fruit" type="text" placeholder="grams of vegetables" name="greens" value={factorAnswers.greens} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column >
                Waist circumference (cm)</Form.Label>
              <Col>
                <Form.Control type="text" placeholder="waist cm" name="waist" value={factorAnswers.waist} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column >
                Fluids (ml) / day</Form.Label>
              <Col>
                <Form.Control data-toggle="tooltip" data-placement="right" title="the total volume of fluids drunk in a day" type="text" placeholder="ml of fluids" name="fluids" value={factorAnswers.fluids} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column >
                total cigarettes smoked / 365</Form.Label>
              <Col>
                <Form.Control data-toggle="tooltip" data-placement="right" title="This is the same Number of cigarettes per day times year smoked" type="text" placeholder="totalsmoke" name="smokecumulative" value={factorAnswers.smokecumulative} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column >
                cigarettes per day</Form.Label>
              <Col>
                <Form.Control data-toggle="tooltip" data-placement="right" title="This is all types of smoking" type="text" placeholder="totalsmoke" name="smokeintensity" value={factorAnswers.smokeintensity} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column >
                Concussions</Form.Label>
              <Col>
                <Form.Control data-toggle="tooltip" data-placement="right" title="Total number of concussion during your life" type="text" placeholder="conc" name="headtrauma" value={factorAnswers.headtrauma} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column >
                Alcoholic units / day</Form.Label>
              <Col>
                <Form.Control data-toggle="tooltip" data-placement="right" title="a unit is 14 ml of pure alcohol" type="text" placeholder="alcohol" name="drinking" value={factorAnswers.drinking} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column >
                Red meat grams/ day</Form.Label>
              <Col>
                <Form.Control data-toggle="tooltip" data-placement="right" title="red meat is meat from cow, pork and lamb" type="text" placeholder="redmeat" name="redmeat" value={factorAnswers.redmeat} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column >
                Indoor tanning hours</Form.Label>
              <Col>
                <Form.Control data-toggle="tooltip" data-placement="right" title="The total number of hours in tanning bed" type="text" placeholder="tanning" name="indoortanning" value={factorAnswers.indoortanning} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column >
                Days exposed to pesticides</Form.Label>
              <Col>
                <Form.Control data-toggle="tooltip" data-placement="right" title="The total number of days where you have worked with pesticides" type="text" placeholder="Pesticides" name="pesticideexposuredays" value={factorAnswers.pesticideexposuredays} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column >
                Gender</Form.Label>
              <Col>
                <Form.Control as="select" placeholder="Gender" name="gender" value={factorAnswers.gender} onChange={this.props.handleChange}>
                  <option selected disabled>Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </Form.Control>
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column>
                Diabetes</Form.Label>
              <Col>
                <Form.Control type="checkbox" name="diabetes" checked={factorAnswers.diabetes} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column>
                HIV</Form.Label>
              <Col>
                <Form.Control type="checkbox" name="hivhistory" checked={factorAnswers.hivhistory} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column>
                Hepatitis C</Form.Label>
              <Col>
                <Form.Control type="checkbox" name="hcvhistory" checked={factorAnswers.hcvhistory} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>

            <Form.Row>
              <Form.Label column>
                Depression</Form.Label>
              <Col>
                <Form.Control type="checkbox" name="depression" checked={factorAnswers.depression} onChange={this.props.handleChange} />
              </Col>
            </Form.Row>
            <Form.Row>
              <Form.Label column>
                Parkinsons in family</Form.Label>
              <Col>
                <Form.Control type="checkbox" name="familyhistoryparkinson" checked={factorAnswers.familyhistoryparkinson} onChange={this.props.handleChange} />
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