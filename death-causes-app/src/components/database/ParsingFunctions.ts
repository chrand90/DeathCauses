import { stratify } from "d3-hierarchy";
import { parse } from "path";
import { Monomial } from "./Monomial";
import { Polynomial } from "./Polynomial";
import { EnumeratedValue } from "./RiskRatioTableCell/EnumerateValue";
import { NumericInterval } from "./RiskRatioTableCell/NumericInterval";
import { NumericValue } from "./RiskRatioTableCell/NumericValue";
import { RiskRatioTableCellInterface } from "./RiskRatioTableCell/RiskRatioTableCellInterface";

export const parseStringToInputType = (input: string): RiskRatioTableCellInterface => {
    const intervalRegex = new RegExp('^([0-9.]*)[,+]([0-9.]*)$');
    const singleNumericRegex = new RegExp('^([0-9.]*)$');
    let intervalResult = intervalRegex.exec(input);
    if (intervalResult) {
        return new NumericInterval(intervalResult[1], intervalResult[2])
    }

    let singleNumericResult = singleNumericRegex.exec(input)
    if (singleNumericResult) {
        return new NumericValue(singleNumericResult[1])
    }
    return new EnumeratedValue(input);
}

export const parseStringToPolynomial = (input: string): Polynomial => {
    let polynomialTermRegex = new RegExp('[+]?([-]?[.0-9e-]+)[*]?([x0-9^*]*)', 'g')
    let variablesRegex = new RegExp('(x\\d+)')
    let regexResult
    let numberOfVariables:number;
    let monomials = []
    while ((regexResult = polynomialTermRegex.exec(input)) !== null) {
        let coefficient= regexResult[1]
        let exponentsAndVariables=regexResult[2];
        let xvars=parseVariableNames(exponentsAndVariables)
        let exponents=parseExponents(exponentsAndVariables)
        monomials.push(new Monomial(+coefficient, exponents, xvars))
    }
    return new Polynomial(monomials);
}

export const parseVariableNumber = (input: string): number => {
    let numberRegex=new RegExp('[0-9]+','g')
    let numberAsString =input.match(numberRegex)
    if(!numberAsString || numberAsString.length===0){
        throw Error("The variable "+input+" could not be parsed");
    }
    return parseInt(numberAsString[0]);
}

export const isXVariableName = (input: string): boolean => {
    const numberRegex= new RegExp('^x[0-9]+$')
    return numberRegex.test(input)
}

const parseVariableNames = (input: string): string[] => {
    if(input=== ''){
        return [];
    }
    const variableRegex = new RegExp('(x[0-9]+)','g')
    const variableMatches=input.match(variableRegex)
    return variableMatches ? variableMatches : [];
}

const parseExponents = (input: string): number[] => {

    if (input === '') {
        return []
    }
    let exponentRegex = new RegExp('\\^([0-9])', 'g')
    let exponentRegexResult;
    let exponents: number[]=[];
    while ((exponentRegexResult = exponentRegex.exec(input)) !== null) {
        exponents.push(+exponentRegexResult[1])
    }
    return exponents;
}