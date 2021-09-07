import { observer } from "mobx-react";
import React from "react";
import { useState } from "react";
import { OverlayTrigger } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Popover from "react-bootstrap/Popover";
import { FactorAnswerChange, FactorAnswerChanges, FactorAnswersToUpdateForm } from "../models/updateFormNodes/FactorAnswersToUpdateForm";
import { Shadowing } from "../stores/ComputationStore";
import RootStore, { withStore } from "../stores/rootStore";
import { formatYears } from "./Helpers";
import { useStore } from '../stores/rootStore';
import Descriptions from "../models/Descriptions";

const NEGATIVE_COLOR="#e30000"
const POSITIVE_COLOR="#00e300"
const NEUTRAL_COLOR="#8c8c8c"
const SHADOWING_COLOR="#2b37a6"


const ChangeViewWithoutObserver = () => {
  const [index, setIndex] = useState<number>(0);
  const store= useStore()

  const historySize = store.computationStore.allChanges.length;

  const getLifeExpectancyEffect = (index: number) => {
    let valInYears: number;
    if(store.computationStore.lifeExpectancies.length<2){
      valInYears=store.computationStore.lifeExpectancies[index+0]
    }
    else{
      valInYears=
        store.computationStore.lifeExpectancies[index+0] -
        store.computationStore.lifeExpectancies[index+1];
    }  
    const absDiff=Math.abs(valInYears)
    const sign=Math.sign(valInYears)
    const prefix = sign>0 ? "+":"-"
    const formatedAbsoluteValue= formatYears(absDiff)
    if(store.computationStore.lifeExpectancies.length<2){
      return {
        describ: prefix+formatedAbsoluteValue,
        sign: 0
      }
    }
    if(formatedAbsoluteValue!=="0"){
      return {
        describ: prefix+formatedAbsoluteValue,
        sign: sign
      }
    }
    else{
      return {
        describ: "Very small or none",
        sign:0}
    }
  };
  const shadowing= store.computationStore.factorShadowing
  const showShadowing = (
    shadowing.shadowsTheChange.length>0 || 
    shadowing.unshadowedByTheChange.length>0 || 
    shadowing.shadowedByTheChange.length>0
  )
  const lifeExpentancy=getLifeExpectancyEffect(index);
  let textColor= lifeExpentancy.sign ===0 ? NEUTRAL_COLOR : 
    ( lifeExpentancy.sign<0 ? NEGATIVE_COLOR : POSITIVE_COLOR) 
  // if(showShadowing){
  //   textColor=SHADOWING_COLOR
  // }
  const styleElement={color: textColor};
  const shownChanges=store.computationStore.allChanges[index]
  const randomFactorOrder= Object.keys(shownChanges)
  const firstFactor=randomFactorOrder[0]

  if(randomFactorOrder.length===0){
    return <div>
      <p>No changes in the last computation</p>
    </div>
  }

  return (
      
    <div>
            <p>
              The effect of changing {getChangeDescription(shownChanges[firstFactor],firstFactor, store.loadedDataStore.descriptions )}{
              randomFactorOrder.length>1 ? <span>
                <span> and </span>
                {ChangeViewPopupLink(
                randomFactorOrder.slice(1),
                shownChanges,
                (randomFactorOrder.length-1).toString(),
                store.loadedDataStore.descriptions)
                }
                <span> other factor{randomFactorOrder.length>2 ? "s" : null}</span>
                </span>
                : null}{":  "} 
                <span style={styleElement}><strong>{lifeExpentancy.describ}</strong></span> 
                {showShadowing ? shadowingButton(shadowing, store.loadedDataStore.descriptions) : null }
                </p>
            </div>
  );
};

const getChangeDescription = (change: FactorAnswerChange, factorName: string, descriptions: Descriptions) => {
  return (
    <span><strong>{descriptions.getDescription(factorName,20)}</strong> from <em>{change.fromVal}</em> to <em>{change.toVal}{" "}{descriptions.getBaseUnit(factorName)}</em></span>
  )
};

const ChangeViewPopupLink =(factors: string[], changes: FactorAnswerChanges, buttonMessage: string, descriptions: Descriptions) => {
  return (
    <OverlayTrigger
      trigger="click"
      rootClose={true}
      placement={"bottom"}
      overlay={ChangeViewPopupMessage(factors, changes, descriptions)}
    >
      <Button variant="link" className="text-link-button">
        {buttonMessage}
      </Button>
    </OverlayTrigger>
  );
}

const shadowingButton = (shadowing: Shadowing, descriptions: Descriptions) => {
  return (
    <OverlayTrigger
      trigger="click"
      rootClose={true}
      placement={"bottom"}
      overlay={shadowingMessage(shadowing, descriptions)}
    >
      <Button variant="link" className="text-link-button">
      {"\u2731"}
      </Button>
    </OverlayTrigger>
  );
}

const shadowingMessage = (shadowing: Shadowing, descriptions: Descriptions) => {
  return (
    <Popover id="popover-basic" style={{whiteSpace: "normal"}}>
      <Popover.Content>
      {shadowing.shadowsTheChange.length>0 ? 
      <div>
        <p>
        The full effect can't be computed because you haven't answered:
        </p>
        <ul>
          {shadowing.shadowsTheChange.map((shadowedFactor) => {
            return <li>{descriptions.getDescription(shadowedFactor,20)}</li>
          })}
      </ul>
      </div>
      :
      null}
      {shadowing.unshadowedByTheChange.length>0 ? 
      <div>
        <p>
        The computed effect contains previously hidden effects from
        </p>
        <ul>
          {shadowing.unshadowedByTheChange.map((shadowedFactor) => {
            return <li>{descriptions.getDescription(shadowedFactor,20)}</li>
          })}
      </ul>
      </div>
      :
      null}
      {shadowing.shadowedByTheChange.length>0 ? 
      <div>
        <p>
        Due to new missing answers, the computed effect contains the effect of hiding the factors
        </p>
        <ul>
          {shadowing.shadowedByTheChange.map((shadowedFactor) => {
            return <li>{descriptions.getDescription(shadowedFactor,20)}</li>
          })}
      </ul>
      </div>
      :
      null}
      
      
      </Popover.Content>
    </Popover>   
  )
}

const ChangeViewPopupMessage = (factors: string[], changes: FactorAnswerChanges, descriptions: Descriptions) => {
    //the whitespace is for firefox.
    return (
      <Popover id="popover-basic" style={{whiteSpace: "normal"}}>
        <Popover.Content>
        <ul>
            {factors.map((factorName) => {
              return <li>Changed {getChangeDescription(changes[factorName], factorName, descriptions)}</li>
            })}
        </ul>
        </Popover.Content>
      </Popover>   
    )
}

const ChangeView = observer(ChangeViewWithoutObserver);
export default ChangeView;
