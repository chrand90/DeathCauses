import { Polynomial } from "./Polynomial";
import { parseStringToPolynomial, parseVariableNumber } from "./ParsingFunctions";
import { RiskRatioTableCellInterface } from "./RiskRatioTableCell/RiskRatioTableCellInterface";
import Location from "./InterpolationLocation";
import InterpolationVariableMapping from "./InterpolationVariableMapping";

export interface FixedMinObjectJson {
    values: LocationJson;
    discriminant?: string[][];
    candidates?: string[];
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
        this.boundaryCandidates=fixedMinJson.candidates ? this.initializeCandidates(fixedMinJson.candidates) : []
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

    makeLookUpObject(xval?:number):LookUpValue[]{
        let point:LookUpValue[]=[];
        Object.entries(this.values).forEach(([xVariable,value]) => {
            let i=parseVariableNumber(xVariable);
            point.push({index: i, value: value});
        })
        if(xval){
            point.push({index: this.freeVariableIndex, value: xval});
        }
        return point;
    }

    getDiscriminantCandidates(factorAnswers: Location, interpolationDomains: RiskRatioTableCellInterface[]):Location[] {
        let res: Location[]=[];
        this.discriminants.forEach((abcTriple: Polynomial[]) => {
            const a=abcTriple[0].evaluateByLookUp(factorAnswers.getValueFromIndex());
            const b=abcTriple[1].evaluateByLookUp(factorAnswers);
            const c=abcTriple[2].evaluateByLookUp(factorAnswers);
            if(a<1e-8){
                if(b>1e-8){
                    let candidate=-c/b
                    if(interpolationDomains[this.freeVariableIndex].isInputWithinCell(candidate)){
                        res.push(this.makeLookUpObject(candidate))
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
                            res.push(this.makeLookUpObject(candidate))
                        }
                    })
                }
            }
        })
        return res;
    }

    getBoundaryMin(factorAnswers: LookUpValue[]):MinObject[] {
        return this.boundaryCandidates.map( (p:Polynomial) => {
            return { minValue: p.evaluateByLookUp(factorAnswers), minLocation: {...this.values}}
        })
    }

}