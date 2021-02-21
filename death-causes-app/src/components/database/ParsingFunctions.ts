import { Monomial } from "./Monomial";
import { Polynomial } from "./Polynomial";
import { EnumeratedValue } from "./RiskRatioTableCell/EnumerateValue";
import { NumericInterval } from "./RiskRatioTableCell/NumericInterval";
import { NumericValue } from "./RiskRatioTableCell/NumericValue";
import { RiskRatioTableCellInterface } from "./RiskRatioTableCell/RiskRatioTableCellInterface";

export const parseStringToInputType = (input: string): RiskRatioTableCellInterface => {
    const intervalRegex = new RegExp('^([0-9.]*)[+-]([0-9.]*)$');
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
    let polynomialTermRegex = new RegExp('[+]?(?<coef>[-]?[.0-9e-]+)[*]?(?<expo>[x0-9^*]*)', 'g')
    let variablesRegex = new RegExp('(x\\d+)')
    let regexResult
    let numberOfVariables = new Set(input.match(variablesRegex)).size
    let monomials = []
    while ((regexResult = polynomialTermRegex.exec(input)) !== null) {
        if (!regexResult.groups?.coef) {
            continue
        }
        monomials.push(new Monomial(+regexResult.groups.coef, parseExponents(regexResult.groups?.expo, numberOfVariables)))
    }

    return new Polynomial(monomials);
}

const parseExponents = (input: string, numberOfVariables: number): number[] => {
    let exponentRegex = new RegExp('([0-9]+)(?:\\^)([0-9]+)\\*?', 'g')

    if (input === '') {
        return []
    }

    let exponents = new Array(numberOfVariables);
    for (let i = 0; i < numberOfVariables; ++i) {
        exponents[i] = 0;
    }

    let regexResult
    while ((regexResult = exponentRegex.exec(input))) {
        exponents.splice(+regexResult[1], 1, +regexResult[2])
    }
    return exponents;
}