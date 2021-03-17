import { Polynomial } from "./Polynomial";
import { parseStringToPolynomial, parseVariableNumber } from "./ParsingFunctions";
import { RiskRatioTableCellInterface } from "./RiskRatioTableCell/RiskRatioTableCellInterface";
import Location, { addValueToLocation, LocationAndValue, locationAndValueSorter } from "./InterpolationLocation";
import InterpolationVariableMapping from "./InterpolationVariableMapping";

export interface FixedMinObjectJson {
    values: LocationJson;
    discriminant?: string[][];
    candidate?: string[];
}

export interface LocationJson {
    [key: string]: number | string;
}
  
export default class FixedMin{
    discriminants:Polynomial[][];
    boundaryCandidates: Polynomial[];
    location: Location;
    freeVariableIndex: number;


    constructor(
        fixedMinJson: FixedMinObjectJson, 
        interpolationVariables: InterpolationVariableMapping, 
        nonInterpolationVariables: string[],
        fixedXVariables: string[]){
        this.location=new Location(interpolationVariables, nonInterpolationVariables)
        this.location.setWithVarNameButInterpolationX(fixedMinJson.values)
        this.freeVariableIndex=this.initializeFreeVariable(fixedXVariables);
        this.discriminants= fixedMinJson.discriminant ? this.initializeDiscriminants(fixedMinJson.discriminant) : []
        this.boundaryCandidates=fixedMinJson.candidate ? this.initializeCandidates(fixedMinJson.candidate) : []
    }

    initializeFreeVariable(fixedXVariables: string[]){
        return this.location.getFreeUnsetVariableIndex(fixedXVariables)
    }

    initializeDiscriminants(discriminantStrings: string[][]): Polynomial[][]{
        return discriminantStrings.map((l:string[]) =>{
            return l.map((polString: string) => {
                return parseStringToPolynomial(polString);
            })
        })
    }

    initializeCandidates(candidateStrings: string[]): Polynomial[]{
        return candidateStrings.map((l:string) =>{
                return parseStringToPolynomial(l);
        })
    }

    hasBoundaryCandidates(){
        return this.boundaryCandidates.length>0;
    }

    makeCandidate(fixedLocation:  Location, insertedIntoFreeVariable?: number): Location{
        let fixedLocationChild= fixedLocation.makeChild()
        fixedLocationChild.setWithVarNames(this.location.getVariableToCoordinate())
        if(insertedIntoFreeVariable){
            fixedLocationChild.setWithInterpolationIndex(this.freeVariableIndex, insertedIntoFreeVariable);
        }
        return fixedLocationChild;
    }

    getDiscriminantCandidates(factorAnswers: Location, interpolationDomains: RiskRatioTableCellInterface[]):Location[] {
        let res: Location[]=[];
        this.discriminants.forEach((abcTriple: Polynomial[]) => {
            const a=abcTriple[0].evaluate(factorAnswers);
            const b=abcTriple[1].evaluate(factorAnswers);
            const c=abcTriple[2].evaluate(factorAnswers);
            if(a<1e-8){
                if(b>1e-8){
                    let candidate=-c/b
                    if(interpolationDomains[this.freeVariableIndex].isInputWithinCell(candidate)){
                        res.push(this.makeCandidate(factorAnswers, candidate))
                    }
                }
            }
            else{
                const d=Math.pow(b,2)-4*a*c
                if(d>=0){
                    let candidates=[
                        (-b-Math.sqrt(d))/(2*a),
                        (-b+Math.sqrt(d))/(2*a)
                    ]
                    candidates.forEach((candidate:number) => {
                        if(interpolationDomains[this.freeVariableIndex].isInputWithinCell(candidate)){
                            res.push(this.makeCandidate(factorAnswers, candidate))
                        }
                    })
                }
            }
        })
        return res;
    }

    getBoundaryMin(factorAnswers: Location):LocationAndValue{
        if(this.boundaryCandidates.length===0){
            throw Error("A fixedMin was demanded its boundary candidates but it should be asked first with hasBoundaryCandidates")
        }
        let candidates: LocationAndValue[]= this.boundaryCandidates.map( (polCandidate: Polynomial) => {
            let value=polCandidate.evaluate(factorAnswers);
            let locationChild= this.makeCandidate(factorAnswers);
            return addValueToLocation(locationChild, value)
        })
        candidates.sort(locationAndValueSorter)
        return candidates[0];
    }

}