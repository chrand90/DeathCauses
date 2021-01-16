import React from 'react';
import './VizWindow.css';
import BarChartWrapper from './BarChartWrapper';
import { TEST_DATA, TEST_DATA2 } from './PlottingData';
import { FactorAnswers } from '../models/Factors';
import Deathcause from './database/Deathcause';
import { ProbabilityOfDeathCauseCalculation } from './database/ProbabilityOfDeathCauseCalculation';
import causesData from '../resources/Causes.json';
import { Col, Form } from "react-bootstrap";
import './VizWindow.css';
import { BarPlot } from './BarPlot';

interface VizWindowProps {
    factorAnswersSubmitted: FactorAnswers | null
}

export interface data {
    Country: string,
    Value: number;
}


interface VizWindowState {
    selected_visualization: any
    database: any
    factorAnswersSubmitted: FactorAnswers | null
    selectedVisualisation: string
    data: data[]
}

class VizWindow extends React.PureComponent<VizWindowProps, VizWindowState> {
    counter: number = 0;
    factorDatabase: Deathcause[] = [];

    constructor(props: any) {
        super(props);
        this.state = {
            selected_visualization: "allcauses",
            database: TEST_DATA,
            factorAnswersSubmitted: this.props.factorAnswersSubmitted,
            selectedVisualisation: "Survival curve",
            data: [{Country: 'test', Value: 12}]
        };
    }

    calculateRR() {
        let database: Deathcause[] = this.factorDatabase

        if (database === []) {
            return;
        }
        if (!this.state.factorAnswersSubmitted) {
            return;
        }

        let currentAge = +this.state.factorAnswersSubmitted['Age']
        if (!currentAge) {
            return;
        }


        let calc = new ProbabilityOfDeathCauseCalculation();
        console.log(calc.calculateRRForAllCausesAndAges(this.state.factorAnswersSubmitted, currentAge, database))
    }

    loadFactorDatabase() {
        let res: Deathcause[] = [];
        let database = causesData;

        for (var key in database) {
            if (database.hasOwnProperty(key)) {
                res.push(new Deathcause(database[key as keyof typeof database], key))
            }
        }
        this.factorDatabase = res
    }

    componentDidMount() {
        this.loadFactorDatabase()
        this.calculateRR()
    }

    componentDidUpdate() {
        this.setState({
            factorAnswersSubmitted: this.props.factorAnswersSubmitted
        }, () => this.calculateRR())
    }

    renderVisualization() {
        //uses this.state.selcted_visualization and this.props.database and this.props.factor_answers to make the relevant revisualization.
    }

    handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        //this.setState({ });
        if (this.counter % 2 === 0) {
            this.counter++;
            let tmp: data[] = [
                { Country: 'United States', Value: 12394 },
                { Country: 'Russia', Value: 6148 },
                { Country: 'Germany (FRG)', Value: 1653 }]
    
            this.setState({ database: TEST_DATA2, selected_visualization: event.currentTarget.value, data: tmp });
        }
        else {
            this.counter++;
            
            let tmp: data[] = [
                { Country: 'fiji', Value: 124 },
                { Country: 'Russia', Value: 6148 },
                { Country: 'Germany (FRG)', Value: 1653 }]
    
            this.setState({ database: TEST_DATA, selected_visualization: event.currentTarget.value, data: tmp });
        }
    };

    handleSelectedVisualisationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({
            selectedVisualisation: event.currentTarget.value
        })
    } 

    renderSelectOption() {
        return (
            <Form>
                <Form.Group className='visualisation' >
                    <Form.Row>
                        <Form.Control className='visualisation' as="select" defaultValue="Choose..." onChange ={this.handleSelectedVisualisationChange}>
                            <option>Survival curve</option>
                            <option>Risk factor contributions</option>
                        </Form.Control>
                    </Form.Row>
                </Form.Group>
            </Form >
        )
    }

    renderGraph() {
        if(this.state.selectedVisualisation !== 'Survival curve'){ return (<BarChartWrapper database={this.state.database} />)}
        else{
        return <BarPlot data = {this.state.data}/>}
    }

    render(): React.ReactNode {
        console.log(this.props)
        return (<div className='vizwindow'>
            <h4> Visualization Menu </h4>
            {this.renderSelectOption()}
            <select id="visualizations" onChange={this.handleChange} value={this.state.selected_visualization}>
                <option value="allcauses">TEST_DATA</option>
                <option value="allages">TEST_DATA2</option>
            </select>
            {this.renderGraph()}
            {/* <BarChartWrapper database={this.state.database}/> */}
            
        </div>);
    };
}

export default VizWindow;