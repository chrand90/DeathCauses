import * as d3 from "d3";
import { DataPoint } from "../models/updateFormNodes/FinalSummary/SummaryView";

export interface LollipopChartInput {
    getXaxisFormatter(): (n: number | { valueOf(): number }) => string,
    getTooltipFormatter(): (value: any, name: any) => string,
    readonly data: DataPoint[],
    readonly tooltipFormatter: (value: any, name: any) => string,
}

export class LollipopChartYearsLostInput implements LollipopChartInput {
    data: DataPoint[]
    tooltipFormatter: (value: any, name: any) => string;

    constructor(dataPoints: DataPoint[]) {
        this.data = dataPoints
        this.tooltipFormatter = () => {return "HEJ"}
    }


    getXaxisFormatter() {
        return numberWithDecimalsFormatter();
    }

    getTooltipFormatter(): (value: any, name: any) => string  {
        return (value: any, name: any) => { return `<strong> ${value}} </strong> years lost<br/>
        to: <strong> ${name} </strong>`}
    }
}

export class LollipopChartProbabilityInput implements LollipopChartInput {
    data: DataPoint[]
    tooltipFormatter: (value: any, name: any) => string;

 
    constructor(dataPoints: DataPoint[]) {
        this.data = dataPoints
        this.tooltipFormatter = () => {return "HEJ"}

    }

    getXaxisFormatter() {
        return decimalAsPercentageFormatter();
    }
    
    getTooltipFormatter(): (value: any, name: any) => string {
        return (value: any, name: any) => {
            return `Probability: <strong> ${value} </strong><br/>
        of dying due to: <strong> ${name} </strong>`
        }
    }
}

const decimalAsPercentageFormatter = (): (n: number | { valueOf(): number }) => string => {
    return d3.format("." + 2 + "~p")
}

const numberWithDecimalsFormatter = (): (n: number | { valueOf(): number }) => string => {
    return d3.format("." + 2 + "f")
}