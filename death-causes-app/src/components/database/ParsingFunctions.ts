import { EnumeratedValue, NumericInterval, NumericValue, RiskRatioTableCellData } from "./DataTypes";
import { Monomial, Polynomial } from "./Polynomial";

export class ParsingFunctions {
    static parseStringToInputType = (input: string): RiskRatioTableCellData => {
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

    static parseStringToPolynomial = (input: string): Polynomial => {
        let polynomialTermRegex = new RegExp('[+]?(?<coef>[-]?[.0-9e-]+)[*]?(?<expo>[x0-9^*]*)', 'g')
        let variablesRegex = new RegExp('(x\\d+)')
        let regexResult
        let numberOfVariables = new Set(input.match(variablesRegex)).size
        let monomials = []
        while ((regexResult = polynomialTermRegex.exec(input)) !== null) {
            if (!  regexResult.groups?.coef) {
                continue
            }
            monomials.push(new Monomial(+regexResult.groups.coef, ParsingFunctions.parseExponents(regexResult.groups?.expo, numberOfVariables)))
        }

        return new Polynomial(monomials);
    }

    private static parseExponents(input: string, numberOfVariables: number ) {
        let exponentRegex = new RegExp('([0-9]+)(?:\\^)([0-9]+)\\*?', 'g')

        if(input === '') {
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
}