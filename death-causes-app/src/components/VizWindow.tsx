import React from 'react';
import './VizWindow.css';
import BarChartWrapper from './BarChartWrapper';
import { DataRow, TEST_DATA, TEST_DATA2 } from './PlottingData';
import { FactorAnswers } from '../models/Factors';
import Deathcause from './database/Deathcause';
import { RiskRatioCalculationService } from './Calculations/RiskRatioCalculationService';
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
            data: [{ Country: 'test', Value: 12 }]
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


        let calc = new RiskRatioCalculationService();
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
                        <Form.Control className='visualisation' as="select" defaultValue="Choose..." onChange={this.handleSelectedVisualisationChange}>
                            <option>Survival curve</option>
                            <option>Risk factor contributions</option>
                        </Form.Control>
                    </Form.Row>
                </Form.Group>
            </Form >
        )
    }

    findingMinimumFactors = () => {
        this.factorDatabase.forEach(d => {
            let res: any = {}
            


            console.log(d.deathCauseName)
            d.riskFactorGroups.forEach(

                rfg =>
                    rfg.riskRatioTables.forEach(rrt => {
                        let tmp = rrt.getMinimumRRFactors()
                        for (let key of Object.keys(tmp)) {
                            if (res.hasOwnProperty(key) && res[key] !== tmp[key]) {
                                console.log("res already has different key for " + key)
                                console.log("old value: ")
                                console.log(res[key])
                                console.log("new value: ")
                                console.log(tmp[key])
                            }
                            res[key] = tmp[key]
                        }
                    }
                    )
            )
            console.log(res)
        })
    }

    uStarTesting = (): DataRow[] => {
        let res: DataRow[] = []
        let calculationService = new RiskRatioCalculationService()
        this.factorDatabase.forEach(dc => {
            if (!this.state.factorAnswersSubmitted) {
                return;
            }
            res.push(calculationService.calculateInnerProbabilities(testData, dc))
            // console.log(calculationService.calculateUStar(this.state.factorAnswersSubmitted, dc))
            // console.log(calculationService.calculateFirstOrderDecomposition(this.state.factorAnswersSubmitted, dc))
        })
        return res;
    }

    renderGraph() {
        let res = this.uStarTesting()
        if (this.state.selectedVisualisation !== 'Survival curve') { return (<BarChartWrapper database={res} />) }
        else {
            return <BarPlot data={this.state.data} />
        }
    }

    render(): React.ReactNode {
        console.log(this.props)
        return (<div className='vizwindow'>
            <h4> Visualization Menu </h4>
            <button onClick={this.findingMinimumFactors}>test</button>
            <button onClick={this.uStarTesting}>test2</button>
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

const testData = {
    "BMI": "30",
    "Age": "70",
    "Waist": "100",
    "Caffeine": "10",
    "Fish": "0",
    "Vegetables": "0",
    "Fluids": "1000",
    "HeadTrauma": "5",
    "Drinking": "90",
    "Gender": "Female",
    "OralContraceptiveTypicalAmmount": "No",
    "OralContraceptiveSinceStop": "0",
    "RedMeat": "200",
    "HCVHistory": "No",
    "HIVHistory": "Yes",
    "Diabetes": "Yes",
    "SmokeSinceStop": "0",
    "SmokeTypicalAmmount": "40",
    "SmokeIntensity": "40",
    "SmokeCumulative": "500",
    "IndoorTanning": "2",
    "Race": "White",
    "MaxDrinking": "10",
    "Greens": "1",
    "FamilyHistoryParkinson": "No",
    "PesticideExposureDays": "20",
    "Depression": "No",
    "PhysicalActivityTotal": "10",
    "PhysicalActivityHard": "0"
}