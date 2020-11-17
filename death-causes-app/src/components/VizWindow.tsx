import React from 'react';
import './VizWindow.css';
import BarChartWrapper from './BarChartWrapper';
import { TEST_DATA, TEST_DATA2 } from './PlottingData';

class VizWindow extends React.PureComponent<any, any> {
    counter: number = 0;
    constructor(props: any) {
        super(props);
        this.state = {
            selected_visualization: "allcauses",
            database: TEST_DATA
        };
    }

    renderVisualization() {
        //uses this.state.selcted_visualization and this.props.database and this.props.factor_answers to make the relevant revisualization.
    }

    handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        //this.setState({ });
        if (this.counter % 2 === 0) {
            this.counter++;
            this.setState({ database: TEST_DATA2, selected_visualization: event.currentTarget.value });
        }
        else {
            this.counter++;
            this.setState({ database: TEST_DATA, selected_visualization: event.currentTarget.value });
        }
    };

    render(): React.ReactNode {
        console.log(this.props)
        return (<div className='vizwindow'>
            <h4> Visualization Menu </h4>

            <select id="visualizations" onChange={this.handleChange} value={this.state.selected_visualization}>
                <option value="allcauses">TEST_DATA</option>
                <option value="allages">TEST_DATA2</option>
            </select>
            <BarChartWrapper database={this.state.database} />
        </div>);
    };
}

export default VizWindow;