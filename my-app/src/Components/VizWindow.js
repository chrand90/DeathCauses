import React from 'react';
import './VizWindow.css';
import BarChartWrapper from './BarChartWrapper';
import {Database} from './ComputationEngine';

class VizWindow extends React.Component {

    constructor(){
        super();
        this.state={
            selected_visualization: "allcauses",
            selected_causes: 'all',
            database: null,
        };
    }


    renderVisualization(){
        if(this.state.database===null){
            this.state.database= new Database(this.props.database)
        }
        switch(this.state.selected_visualization){
            case 'allcauses':
                let c=this.state.database.compute_bar_chart_probs(null,null,null);
                return <BarChartWrapper database={c}/>
        }
        
    }

    handleChange= (selectObject) => {
        this.setState({selected_visualization:selectObject.target.value});
    };

    render() {
        return (<div className='vizwindow'> 
            <h4> Visualization Menu </h4>
            <select id="visualizations" onChange={this.handleChange} value={this.state.selected_visualization}>
                <option value="allcauses">Probability of dying of all causes</option>
                <option value="allages">Probability of dying at all ages</option>
            </select>
            {this.renderVisualization()}
            
        </div>);
    };
}

export default VizWindow;