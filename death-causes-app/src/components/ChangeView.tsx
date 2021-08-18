import { observer } from "mobx-react";
import React from "react";
import { useState } from "react";
import { OverlayTrigger } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Popover from "react-bootstrap/Popover";
import { FactorAnswerChange, FactorAnswerChanges, FactorAnswersToUpdateForm } from "../models/updateFormNodes/FactorAnswersToUpdateForm";
import { Shadowing } from "../stores/ComputationStore";
import RootStore, { withStore } from "../stores/rootStore";

const NEGATIVE_COLOR="#e30000"
const POSITIVE_COLOR="#00e300"
const NEUTRAL_COLOR="#8c8c8c"
const SHADOWING_COLOR="#2b37a6"

interface ChangeViewProps {
  store: RootStore;
}

const ChangeViewsWithoutStore = (props: ChangeViewProps) => {
  const [index, setIndex] = useState<number>(0);
  const historySize = props.store.computationStore.allChanges.length;

  const getLifeExpectancyEffect = (index: number) => {
    const valInYears =
      props.store.computationStore.lifeExpectancies[index+0] -
      props.store.computationStore.lifeExpectancies[index+1];
    //console.log(props.store.computationStore.lifeExpectancies[index+0], props.store.computationStore.lifeExpectancies[index+1])
    const absDiff=Math.abs(valInYears)
    const sign=Math.sign(valInYears)
    const prefix = sign>0 ? "+":""
    if(absDiff>1){
        return {
            describ:prefix+valInYears.toFixed(1) + " years",
            sign: sign}
    }
    if(absDiff>1/12){
        return {
            describ:prefix+(valInYears*12).toFixed(1)+" months",
            sign: sign}
    }
    if(absDiff>1/365){
        return {
        describ: prefix+(valInYears*365).toFixed(1)+" days",
        sign:sign}
    }
    if(absDiff>1/365/24){
        return {
            describ: prefix+(valInYears*24*365).toFixed(1)+ " hours",
            sign: sign}
    }
    if(absDiff>1/365/24/60){
        return {
            describ: prefix+(valInYears*24*365*60).toFixed(0)+ " minutes",
            sign:sign
        }
    }
    if(absDiff>1/365/24/60/60*6){
        return {
            describ: prefix+parseFloat((valInYears*24*365*60*60).toPrecision(1)).toFixed(0)+ " seconds",
            sign: sign
        }
    }
    return {
        describ: "Very small or none",
        sign:0}
  };
  const shadowing= props.store.computationStore.factorShadowing
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
  const shownChanges=props.store.computationStore.allChanges[index]
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
              {getChangeDescription(shownChanges[firstFactor],firstFactor )}{
              randomFactorOrder.length>1 ? <span>
                <span> and </span>
                {ChangeViewPopupLink(
                randomFactorOrder.slice(1),
                shownChanges,
                (randomFactorOrder.length-1).toString()
                )}
                <span> other factor{randomFactorOrder.length>2 ? "s" : null}</span>
                </span>
                : null}{":  "} 
                <span style={styleElement}><strong>{lifeExpentancy.describ}</strong></span> 
                {showShadowing ? shadowingButton(shadowing) : null }
                </p>
            </div>
  );
};

const getChangeDescription = (change: FactorAnswerChange, factorName: string) => {
  return (
    <span>Changed <strong>{factorName}</strong> from <em>{change.fromVal}</em> to <em>{change.toVal}</em></span>
  )
};

const ChangeViewPopupLink =(factors: string[], changes: FactorAnswerChanges, buttonMessage: string) => {
  return (
    <OverlayTrigger
      trigger="click"
      rootClose={true}
      placement={"bottom"}
      overlay={ChangeViewPopupMessage(factors, changes)}
    >
      <Button variant="link" className="text-link-button">
        {buttonMessage}
      </Button>
    </OverlayTrigger>
  );
}

const shadowingButton = (shadowing: Shadowing) => {
  return (
    <OverlayTrigger
      trigger="click"
      rootClose={true}
      placement={"bottom"}
      overlay={shadowingMessage(shadowing)}
    >
      <Button variant="link" className="text-link-button">
      {"\u2731"}
      </Button>
    </OverlayTrigger>
  );
}

const shadowingMessage = (shadowing: Shadowing) => {
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
            return <li>{shadowedFactor}</li>
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
            return <li>{shadowedFactor}</li>
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
            return <li>{shadowedFactor}</li>
          })}
      </ul>
      </div>
      :
      null}
      
      
      </Popover.Content>
    </Popover>   
  )
}

const ChangeViewPopupMessage = (factors: string[], changes: FactorAnswerChanges) => {
    //the whitespace is for firefox.
    return (
      <Popover id="popover-basic" style={{whiteSpace: "normal"}}>
        <Popover.Content>
        <ul>
            {factors.map((factorName) => {
              return <li>{getChangeDescription(changes[factorName], factorName)}</li>
            })}
        </ul>
        </Popover.Content>
      </Popover>   
    )
}

const ChangeView = withStore(observer(ChangeViewsWithoutStore));
export default ChangeView;
