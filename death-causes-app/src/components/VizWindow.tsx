import React from 'react';
import { Form } from "react-bootstrap";
import { FactorAnswers } from '../models/Factors';
import causesData from '../ressources/Causes.json';
import BarChartWrapper from './BarChartWrapper';
import { SurvivalCurveData } from './Calculations/SurvivalCurveData';
import { CalculationFacade } from './Calculations/CalculationsFacade';
import Deathcause from './database/Deathcause';
import './VizWindow.css';
import BarPlotWrapper from './BarPlotWrapper';

interface VizWindowProps {
    factorAnswersSubmitted: FactorAnswers | null
}

interface VizWindowState {
    selectedVisualization: any
    selectedVisualisation: string
    probabilities: any
    survivalCurve: SurvivalCurveData[]
}

class VizWindow extends React.PureComponent<VizWindowProps, VizWindowState> {
    calculationFacade: CalculationFacade | undefined;
    counter: number = 0;
    factorDatabase: Deathcause[] = [];

    constructor(props: any) {
        super(props);
        this.state = {
            selectedVisualization: "allcauses",
            selectedVisualisation: "Survival curve",
            probabilities: null,
            survivalCurve: []
        };
    }

    calculateProbabilies() {
        if (!this.props.factorAnswersSubmitted) {
            return;
        }

        let res = this.calculationFacade?.calculateInnerProbabilities(this.props.factorAnswersSubmitted, this.factorDatabase)
        let surv = this.calculationFacade!.calculateSurvivalCurve(this.props.factorAnswersSubmitted, this.factorDatabase)
        this.setState({
            probabilities: res,
            survivalCurve: surv 
        })
    }

    loadFactorDatabase() {
        let database: Deathcause[] = [];
        for (var key in causesData) {
            if (causesData.hasOwnProperty(key)) {
                database.push(new Deathcause(causesData[key as keyof typeof causesData], key))
            }
        }
        this.factorDatabase = database
        this.calculationFacade = new CalculationFacade(database);
    }

    componentDidMount() {
        this.loadFactorDatabase()
    }

    componentDidUpdate(prevProps: VizWindowProps) {
        if (prevProps.factorAnswersSubmitted !== this.props.factorAnswersSubmitted) {
            this.calculateProbabilies()
        }
    }

    renderVisualization() {
        //uses this.state.selcted_visualization and this.props.database and this.props.factor_answers to make the relevant revisualization.
    }

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
                        <Form.Control className='visualisation' as="select" defaultValue="Choose..." onChange={this.handleSelectedVisualisationChange}>
                            <option>Survival curve</option>
                            <option>Risk factor contributions</option>
                        </Form.Control>
                    </Form.Row>
                </Form.Group>
            </Form >
        )
    }

    renderGraph() {
        const visualisation = this.state.selectedVisualisation
        switch(visualisation) {
            case "Survival curve":
                 return <BarPlotWrapper data={this.state.survivalCurve}/>
            case "Risk factor contributions":
                return <BarChartWrapper database={this.state.probabilities}/>
        }
    }

    render(): React.ReactNode {
        console.log(this.props)
        return (<div className='vizwindow'>
            <h4> Visualization Menu </h4>
            {this.renderSelectOption()}
            {this.state.probabilities && this.renderGraph()}
        </div>);
    };
}

export default VizWindow;