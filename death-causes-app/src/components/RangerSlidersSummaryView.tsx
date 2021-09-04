import { observer } from "mobx-react"
import React, { useEffect, useRef, useState } from "react"
import RootStore, { withStore } from "../stores/rootStore"


export interface RangeSliderInput {
    ages: number[],
    survivalProbs: number[]
}
interface RangeSlidersProps {
    data: RangeSliderInput
    store: RootStore
}

enum SliderAnchor {
    AGE="Age",
    PROB="Prob"   
}

const RangeSlidersWithoutStore = (props: RangeSlidersProps) => {
    const ages = props.data.ages
    const survivalProbs = props.data.survivalProbs

    const [sliderAge, setSliderAge] = useState<number>(0)
    const [sliderProb, setSliderProb] = useState<number>(50)
    const ageMax = props.store.advancedOptionsStore.submittedAgeTo;
    const sliderInCenter = useRef<SliderAnchor>(SliderAnchor.PROB);

    useEffect(() => {
        if(sliderInCenter.current===SliderAnchor.PROB){
            updateProbSlider(sliderProb)
        }
        else{
            updateAgeSlider(sliderAge)
        }
        
    }, [ages, survivalProbs])

    const updateAgeSlider = (ageValue: number) => {
        sliderInCenter.current=SliderAnchor.AGE
        setSliderAge(ageValue)
        setSliderProb(survivalProbs[ages.findIndex(element => element === ageValue)] * 100)
    }

    const updateProbSlider = (value: number) => {
        sliderInCenter.current=SliderAnchor.PROB
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
            <br />
            <label htmlFor="id1">that you will live to be at least <span style={{ fontWeight: 700 }}>{sliderAge}</span> years</label> <br />
            <input type="range" value={sliderAge} min={ages[0]} max={ageMax} step="1" onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateAgeSlider(+event.target.value)} id="id1" />
        </div>
    )
}

const RangeSliders = withStore(observer(RangeSlidersWithoutStore))
export default RangeSliders;