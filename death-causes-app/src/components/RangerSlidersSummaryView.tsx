import { observer } from "mobx-react"
import React from "react"
import { useEffect, useState } from "react"
import { FormGroup } from "reactstrap"
import RootStore, { withStore } from "../stores/rootStore"

interface RangeSlidersProps {
    store: RootStore
}

const RangeSlidersWithoutStore = (props: RangeSlidersProps) => {
    const ages = props.store.computationStore.summaryView!.lifeExpentancyData.ages
    const survivalProbs = props.store.computationStore.summaryView!.lifeExpentancyData.probabilities

    const [sliderAge, setSliderAge] = useState<number>(ages[0])
    const [sliderProb, setSliderProb] = useState<number>(survivalProbs[0] * 100)
    const ageMax = props.store.advancedOptionsStore.ageTo;

    useEffect(() => {
        updateProbSlider(50)
    }, [ages, survivalProbs])

    const updateAgeSlider = (ageValue: number) => {
        setSliderAge(ageValue)
        setSliderProb(survivalProbs[ages.findIndex(element => element === ageValue)] * 100)
        // setSliderProb(Math.round(props.survivalProbs[props.ages.findIndex(element => element === ageValue)] * 1000) / 10)
    }

    const updateProbSlider = (value: number) => {
        setSliderProb(value)
        let indexOfAges = survivalProbs.findIndex(element => element < value / 100)
        if (indexOfAges === -1) {
            setSliderAge(120)
            return;
        }

        let x1 = survivalProbs[indexOfAges - 1]
        let x2 = survivalProbs[indexOfAges]
        let y1 = ages[indexOfAges - 1]

        setSliderAge(Math.round((y1 + (value / 100 - x1) / (x2 - x1)) * 10) / 10) 
    }

    return (
        <div>
            <span>There is a </span>
            <label htmlFor="id2"><span style={{ fontWeight: 700 }}>{sliderProb.toFixed(1)}%</span> probability</label>  <br />
            <input type="range" value={sliderProb} min="1" max="100" step="1" onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateProbSlider(+event.target.value)} id="id2" /> 
            {/* <input className="col-1" type="number" value={sliderProb} onChange={(event: any) => updateProbSlider(+event.target.value)}></input> */}
            <br />
            <label htmlFor="id1">that you will live to be at least <span style={{ fontWeight: 700 }}>{sliderAge}</span> years</label> <br />
            <input type="range" value={sliderAge} min={ages[0]} max={ageMax} step="1" onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateAgeSlider(+event.target.value)} id="id1" />
        </div>
    )
}

const RangeSliders = withStore(observer(RangeSlidersWithoutStore))
export default RangeSliders;