import { RiskFactorGroup } from "../../components/database/RickFactorGroup";
import { RiskRatioTable, SpecialFactorTable } from "../../components/database/RiskRatioTable";
import { RiskRatioTableEntry } from "../../components/database/RiskRatioTableEntry";
import { ChangeStatus, DimensionStatus, MissingStatus, ProbabilityObject, StochasticStatus, UpdateDic, UpdateForm } from "./UpdateForm";

export type FactorAnswerValueFunction= (updateForms: UpdateDic, fName:string, ageIndex: number) => string | number | ProbabilityObject

export default function addDistributionsForMissing(
    missed:string[], 
    updateForms:UpdateDic, 
    startAge:number, 
    endAge:number, 
    dependsOnAge:boolean,
    riskRatioTableCandidates:SpecialFactorTable[],
    answerValueFunction: FactorAnswerValueFunction){
   missed.forEach( missingFactor => {
      const chosenRRT= riskRatioTableCandidates.filter(rrt => {
        return rrt.getFactorNames().includes(missingFactor)
      }).sort(function(a: SpecialFactorTable, b: SpecialFactorTable){
        return a.getFactorNames().filter(fname => {
          return !missed.includes(fname)
        }).length-
        b.getFactorNames().filter(fname => {
          return !missed.includes(fname)
        }).length
      })[0]
      if(dependsOnAge){
        const probObjects:ProbabilityObject[]=[]
        for(let i=0; i<endAge-startAge+1; i++){
          probObjects.push(
            computeReplacementDistribution(
            chosenRRT.riskRatioTable,
            updateForms,
            chosenRRT.getFactorNameToIndex(), 
            missingFactor, 
            i,
            answerValueFunction)
          )
        }
        updateForms[missingFactor]={
          random: StochasticStatus.RANDOM,
          dimension: DimensionStatus.YEARLY,
          missing: MissingStatus.NONMISSING,
          type: chosenRRT.getType(missingFactor),
          change: ChangeStatus.CHANGED,
          value: probObjects
        }
      }
      else{
        const probObject=computeReplacementDistribution(
          chosenRRT.riskRatioTable,
          updateForms,
          chosenRRT.getFactorNameToIndex(), 
          missingFactor, 
          0,
          answerValueFunction)
        updateForms[missingFactor]={
          random: StochasticStatus.RANDOM,
          dimension: DimensionStatus.SINGLE,
          missing: MissingStatus.NONMISSING,
          type: chosenRRT.getType(missingFactor),
          change: ChangeStatus.CHANGED,
          value: probObject
        }
      }
    });
  }

 function computeReplacementDistribution(
    rrt: RiskRatioTableEntry[], 
    updateForms: UpdateDic, 
    factorNameToIndex:{[factorName:string]:number}, 
    factorName: string,
    ageIndex:number,
    answerValueFunction: FactorAnswerValueFunction){
      const anyStochastic=Object.values(updateForms).some((updateFormNode: UpdateForm) => {
        return updateFormNode.random===StochasticStatus.RANDOM
      })
      //it is possible to call computeReplacementDistributionStochasticInput every time, but to save time, we make the distinction.
      if(anyStochastic){
        return computeReplacementDistributionStochasticInput(
          rrt,
          updateForms,
          factorNameToIndex,
          factorName,
          ageIndex,
          answerValueFunction
        )
      }
      else{
        return computeReplacementDistributionDeterministicInput(
          rrt,
          updateForms,
          factorNameToIndex,
          factorName,
          ageIndex,
          answerValueFunction
        )
      }
    }

    
  function computeReplacementDistributionStochasticInput(
    rrt: RiskRatioTableEntry[], 
    updateForms: UpdateDic, 
    factorNameToIndex:{[factorName:string]:number}, 
    factorName: string,
    ageIndex:number,
    answerValueFunction: FactorAnswerValueFunction){
      const weightedRowsRaw=rrt.map( riskRatioTableEntry => {
        const weights= Object.keys(updateForms).map((fName: string) => {
          if(fName in factorNameToIndex){
            const answer= answerValueFunction(updateForms, fName, ageIndex)
            if(typeof answer==="number" || typeof answer==="string"){
              if(riskRatioTableEntry.isSingleFactorInDomain(factorNameToIndex[fName], answer)){
                return 1
              }
              return 0
            }
            let totalWeight=0;
            Object.entries(answer).forEach(([value, weight]) => {
              if(riskRatioTableEntry.isSingleFactorInDomain(factorNameToIndex[fName], value)){
                totalWeight+=weight
              }
            })
            return totalWeight;
          }
          return 1
        })
        return {weight:weights.reduce((a,b)=>a*b,1), row:riskRatioTableEntry}
      })
      let keyToWeight: ProbabilityObject={}
      weightedRowsRaw.forEach(({weight,row}) => {
        const factorval=row.factorValues[factorNameToIndex[factorName]].getValueInCell().toString()
        if(factorval in keyToWeight){
          keyToWeight[factorval]+=row.frequency*weight
        }
        else{
          keyToWeight[factorval]=row.frequency*weight
        }
      })
      return keyToWeight  
    }

  function computeReplacementDistributionDeterministicInput(
    rrt: RiskRatioTableEntry[], 
    updateForms: UpdateDic, 
    factorNameToIndex:{[factorName:string]:number}, 
    factorName: string,
    ageIndex:number,
    answerValueFunction: FactorAnswerValueFunction){
    const relevantRows=rrt.filter( riskRatioTableEntry => {
      return Object.keys(updateForms).every((fName: string) => {
        if(fName in factorNameToIndex){
          const answer= answerValueFunction(updateForms, fName, ageIndex) as string | number
          return riskRatioTableEntry.isSingleFactorInDomain(factorNameToIndex[fName], answer)  
        }
        return true;
      })
    })
    if(relevantRows.length===0){
      throw Error("No rows satisfied the criteria.")
    }
    let keyToWeight: ProbabilityObject={}
    relevantRows.forEach(row => {
      const factorval=row.factorValues[factorNameToIndex[factorName]].getValueInCell().toString()
      if(factorval in keyToWeight){
        keyToWeight[factorval]+=row.frequency
      }
      else{
        keyToWeight[factorval]=row.frequency
      }
    })
    return keyToWeight
  }