import { Polynomial } from "./Polynomial";
import { parseStringToPolynomial, parseVariableNumber } from "./ParsingFunctions";
import { RiskRatioTableCellInterface } from "./RiskRatioTableCell/RiskRatioTableCellInterface";
import Location, { addValueToLocation, LocationAndValue, locationAndValueSorter } from "./InterpolationLocation";
import InterpolationVariableMapping from "./InterpolationVariableMapping";

export interface FixedMinObjectJson {
    values: LocationJson;
    discriminant?: string[][];
    candidate?: string[];
    infinity?: string[][];
}

export interface LocationJson {
    [key: string]: number | string;
}

const DEFAULT_LOWER_TRUNCATION=0;
  
export default class FixedMin{
    discriminants:Polynomial[][];
    boundaryCandidates: Polynomial[];
    location: Location;
    freeVariableIndex: number;
    infinityCandidates: Polynomial[][];
    lowerTruncation: number;


    constructor(
        fixedMinJson: FixedMinObjectJson, 
        interpolationVariables: InterpolationVariableMapping, 
        nonInterpolationVariables: string[],
        fixedXVariables: string[],
        lowerTruncation: number | null){
        this.location=new Location(interpolationVariables, nonInterpolationVariables)
        this.location.setWithVarNameButInterpolationX(fixedMinJson.values)
        this.freeVariableIndex=this.initializeFreeVariable(fixedXVariables);
        this.discriminants= fixedMinJson.discriminant ? this.initializeDiscriminants(fixedMinJson.discriminant) : []
        this.boundaryCandidates=fixedMinJson.candidate ? this.initializeCandidates(fixedMinJson.candidate) : []
        this.infinityCandidates=fixedMinJson.infinity ? this.initializeInfinities(fixedMinJson.infinity) : []
        this.lowerTruncation= lowerTruncation ? lowerTruncation : DEFAULT_LOWER_TRUNCATION;
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

    initializeInfinities(infinitySlopes: string[][]): Polynomial[][]{
        return infinitySlopes.map( (slopeIntercept: string[]) => {
            return slopeIntercept.map((polString:string) => {
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
            if(Math.abs(a)<1e-8){
                if(Math.abs(b)>1e-8){
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

    getInfinityCandidates(factorAnswers: Location, interpolationDomains: RiskRatioTableCellInterface[]): Location[]{
        let candidates: Location[]=[]
        this.infinityCandidates.forEach( (slopeInterceptPols: Polynomial[]) => {
            let intercept=slopeInterceptPols[1].evaluate(factorAnswers)
            let slope=slopeInterceptPols[0].evaluate(factorAnswers)
            if(Math.abs(slope)>1e-10){
                let candidate= (this.lowerTruncation-intercept)/slope;
                if(interpolationDomains[this.freeVariableIndex].isInputWithinCell(candidate)){
                    candidates.push(
                        this.makeCandidate(
                            factorAnswers, 
                            candidate
                        )
                    )
                }
                
            }
        })
        return candidates
    }

}