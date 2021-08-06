import * as d3 from "d3";
import { LollipopChartFormatting } from "./LollipopChart";

export const probabilityLollipopChartFormatter: LollipopChartFormatting = {
    getTooltipText: (value: any, name: any) => { return probabilityTooltipTemplate(value, name) },
    xAxisFormatter: (d: any) => { return formatDecimalAsPercentage(d) }
}

export const yearLostLollipopChartFormatter: LollipopChartFormatting = {
    getTooltipText: (value: any, name: any) => { return probabilityTooltipTemplate(value, name) },
    xAxisFormatter: (d: any) => { return formatDecimalAsPercentage(d) }
}

const formatDecimalAsPercentage = (d: any, numberOfDecimals: number = 2) => {
    return d3.format("." + numberOfDecimals + "~p")(d)
}

const probabilityTooltipTemplate = (value: any, name: any) => {
    return `Probability: <strong> ${formatDecimalAsPercentage(value, 3)} </strong><br/>
    of dying due to: <strong> ${name} </strong>`
}

const yearsLostTooltipTemplate = (value: any, name: any) => {
    return `<strong> ${formatDecimalAsPercentage(value, 3)} </strong> years lost<br/>
    to: <strong> ${name} </strong>`
}