import * as d3 from "d3";
import { EVALUATION_UNIT } from "../stores/AdvancedOptionsStore";

export interface LollipopChartFormatting {
    getTooltipText: (value: number, name: string) => string,
    xAxisFormatter: (value: number) => string,
    getHeaderTitle: () => string
}

export const probabilityLollipopChartFormatter: LollipopChartFormatting = {
    getTooltipText: (value: number, name: string) => { return probabilityTooltipTemplate(value, name) },
    xAxisFormatter: (d: number) => { return formatDecimalAsPercentage(d) },
    getHeaderTitle: () => {return "Most likely deathcause"}
}

export const yearLostLollipopChartFormatter: LollipopChartFormatting = {
    getTooltipText: (value: number, name: string) => { return yearsLostTooltipTemplate(value, name) },
    xAxisFormatter: (d: number) => { return formatNumberToDecimals(d, 1) },
    getHeaderTitle: () => {return "Most years lost to deathcause"}
}

export const getLollipopChartFormatting = (evaluationUnit: EVALUATION_UNIT): LollipopChartFormatting => {
    switch (evaluationUnit as EVALUATION_UNIT) {
        case EVALUATION_UNIT.PROBAIBILITY:
            return probabilityLollipopChartFormatter;
        case EVALUATION_UNIT.YEARS_LOST:
            return yearLostLollipopChartFormatter
        default:
            throw new Error("Unrecognized evaluation unit")
    }
}

const formatDecimalAsPercentage = (d: number, numberOfDecimals: number = 2) => {
    return d3.format("." + numberOfDecimals + "~p")(d)
}

const probabilityTooltipTemplate = (value: number, name: string) => {
    return `Probability: <strong> ${formatDecimalAsPercentage(value, 3)} </strong><br/>
    of dying due to: <strong> ${name} </strong>`
}

const yearsLostTooltipTemplate = (value: number, name: string) => {
    return `<strong> ${formatNumberToDecimals(value, 2)} </strong> years lost<br/>
    to: <strong> ${name} </strong>`
}

const formatNumberToDecimals = (value: number, numberOfDecimals: number = 2): string => {
    return d3.format("." + numberOfDecimals + "f")(value)
}