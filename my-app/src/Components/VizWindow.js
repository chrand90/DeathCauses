import React from 'react';
import './VizWindow.css';
import BarChartWrapper from './BarChartWrapper';

class VizWindow extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            selected_visualization: "allcauses"
        };
    }

    renderVisualization() {
        //uses this.state.selcted_visualization and this.props.database and this.props.factor_answers to make the relevant revisualization.
    }

    handleChange = (selectObject) => {
        this.setState({ selected_visualization: selectObject.target.value });
    };

    render() {
        console.log(this.props)
        return (<div className='vizwindow'>
            <h4> Visualization Menu </h4>
                
            <select id="visualizations" onChange={this.handleChange} value={this.state.selected_visualization}>
                <option value="allcauses">Probability of dying of all causes</option>
                <option value="allages">Probability of dying at all ages</option>
            </select>
            <BarChartWrapper database={this.props.database} />
        </div>);
    };
}

export default VizWindow;