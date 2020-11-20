import React from 'react';
import './VizWindow.css';
import BarChartWrapper from './BarChartWrapper';
import { TEST_DATA, TEST_DATA2 } from './PlottingData';
import { json } from 'd3';
import compute_causes from './ReadDataBase';

class VizWindow extends React.PureComponent<any, any> {
    counter: number = 0;
    constructor(props: any) {
        super(props);
        this.state = {
            selected_visualization: "allcauses",
            database: TEST_DATA,
            hasLoadedDatabase: false,
            raw_data_base: null
        };
        
    }

    componentDidMount(){
        this.loadDatabase();
    }

    loadDatabase(){
        json( "Causes.json").then((loaded_data) => {
            this.setState({hasLoadedDatabase: true, raw_data_base: loaded_data});
        });
    }

    make_database_computations(loaded_data: any, factor_answers:any){
        const ages: number[]=Array.from(Array(100).keys())
        let j=compute_causes(loaded_data, factor_answers, ages)
        return j;
    }

    renderVisualization() {
        return <BarChartWrapper database={this.make_database_computations(this.state.raw_data_base, this.props.factorAnswersSubmitted)} />
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
            {this.state.hasLoadedDatabase ? this.renderVisualization() : "Loading..."}
        </div>);
    };
}

export default VizWindow;