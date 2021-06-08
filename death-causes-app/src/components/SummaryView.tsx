import React, { Fragment } from "react";
import { SummaryViewData } from "../models/updateFormNodes/FinalSummary/SummaryView";


export interface SummaryViewProps {
    data: SummaryViewData
}

export class SummaryView extends React.Component<SummaryViewProps> {

    render() {
        const lifeExpentancy = this.props.data.lifeExpentancy.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1});
        const textColor = this.props.data.lifeExpentancy > 70 ? "green": "red"

        const mostLikelyCause = this.props.data.probabiliiesOfDyingOfEachDeathCause.reduce((first, second) => first.value > second.value ? first : second)
        const mostYearsLost = this.props.data.yearsLostToDeathCauses.reduce((first, second) => first.value > second.value ? first : second)

        return (<div>
            <h4>Your life expectancy is: <div style={{color: textColor}}>{lifeExpentancy}</div></h4>
            <h5>The average life expentancy is: 70</h5>
            <p>
                You are most likely to die from: {mostLikelyCause.name} with a probability of {Math.round(mostLikelyCause.value * 100)}%
            </p>

                Given your answers you can expect to lose {mostYearsLost.value} years to {mostYearsLost.name}.
        </div>
        )
    }
}
