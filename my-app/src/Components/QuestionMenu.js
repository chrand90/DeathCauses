import React from 'react';
import './QuestionMenu.css';
import Button from 'react-bootstrap/Button';
import { Col, Form, Row, FormGroup } from 'react-bootstrap';
import Checkbox from "./QuestionMenuComponents/Checkbox"
import Select from "./QuestionMenuComponents/Select"
import InputText from "./QuestionMenuComponents/InputText"

const tmper = {
  checkbox: Checkbox,
  select: Select,
  inputText: InputText
}

const data = {
  questions: [
    {
      "factorName": "gender",
      "type": "select",
      "placeholder": "Select gender",
      "options": [
        {
          "value": "male",
          "text": "Male"
        },
        {
          "value": "female",
          "text": "Female"
        }
      ]
    },
    {
      "factorName": "bmi",
      "type": "inputText",
      "placeholder": "Choose BMI"
    },
    {
      "factorName": "waist",
      "type": "inputText",
      "placeholder": "Waist size [cm]"
    },
    {
      "factorName": "caffeine",
      "type": "inputText",
      "placeholder": "Daily consumption of coffee [cups]"
    },
    {
      "factorName": "fish",
      "type": "inputText",
      "placeholder": "Grams of fish / week"
    },
    {
      "factorName": "vegetables",
      "type": "inputText",
      "placeholder": "Grams of vegetables / week"
    },
    {
      "factorName": "bmi",
      "type": "inputText",
      "placeholder": "Choose BMI"
    },
  ]
}

class QuestionMenu extends React.Component {

  constructor(props) {
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
    //this should make a list of questions. At its disposal, it has the this.props.factor_database and this.props.factor_answers.
    return (
      <div>
        <p>Input risk factors to calculate probability of dying of most diseases and expected lifespan</p>
        <Form>
          <div class="mx-5">
          <Row form>
            <Col >
              <FormGroup>
                <Form.Label>BMI</Form.Label>
                <Form.Control type="text" placeholder="BMI" name="bmi" value={this.props.bmi} onChange={this.props.handleChange} />
              </FormGroup>
            </Col>
            <Col>
              <FormGroup>
                <Form.Label>Fish per week</Form.Label>
                <Form.Control type="text" placeholder="Fish" name="fish" value={this.props.fish} onChange={this.props.handleChange} />
              </FormGroup>
            </Col>
          </Row>
          </div>
          <Button variant="primary" type="submit" onClick={this.props.handleSubmit}> Re-visualize </Button>
        </Form>
      </div >
    );
  }
  parse(question, index) {
    const SpecificComponent = tmper[question.type]
    const currentFactorValue = this.props.factor_answers[question.factorName]
    return (
      <SpecificComponent key={index} questionValue={currentFactorValue} question={question} handleChange={this.props.handleChange} />
    )
  }

  render() {
    return (<div className='questionmenu'>
      <h4> Risk factors</h4>
      {/* {data.questions.map((question, index) => this.parse(question, index))} */}
      {this.renderQuestionList()}
    </div>);
  };


}



export default QuestionMenu;
