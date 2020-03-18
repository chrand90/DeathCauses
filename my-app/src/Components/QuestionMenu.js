import React from 'react';
import './QuestionMenu.css';

class QuestionMenu extends React.Component {

    renderQuestionList(){
        //this should make a list of questions. At its disposal, it has the this.props.factor_database and this.props.factor_answers.
        return (
            <div>
    <p>Please selcet your gender:</p> 
    <input type="radio" id="male" name="gender" value="Male" />
    <label htmlFor="male">Male</label>
    <input type="radio" id="female" name="gender" value="Female" />
    <label htmlFor="female">Female</label>
    <input type="radio" id="other" name="gender" vlaue="Other"/>
    <label htmlFor="other">Other</label>
  Age:
    <input type="date"/>

      What is your BMI?

        <input type="text" placeholder="BMI"/>


        Do you have depression?

        <input type="radio" id="yes" name="depression" value="yes"/>
        <label htmlFor="yes">Yes</label>

        <input type="radio" id="no" name="depression" value="no"/>
        <label htmlFor="no">No</label>


        Do you drink alcohol?

        <input type="radio" id="yes" name="alcohol" value="yes"/>
        <label htmlFor="yes">Yes</label>

        <input type="radio" id="no" name="alcohol" value="no"/>
        <label htmlFor="no">No</label>

          <li>If yes, how much do you maximum drink in a week?</li>
 <input type="text"/>
      Your waist circumference?

      <input type="text"/>
          </div>
        );
    }

    render() {
        return (<div className='questionmenu'> 
            <h4> Question Menu </h4>
            <button onClick={this.props.onNewVisualization}> Re-visualize </button>
            {this.renderQuestionList()}
        </div>);
    };
}

export default QuestionMenu;