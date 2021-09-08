import Location from "./InterpolationLocation";

export class Monomial {
    coefficient: number;
    exponents: number[];
    xvars: string[];

    constructor(coefficent: number, exponents: number[], xvars: string[]) {
        this.coefficient = coefficent;
        this.exponents = exponents;
        this.xvars = xvars;
    }

    evaluate(xvalue: Location): number {
        // assert(submittedFactorAnswers.length === this.exponents.length);
        let res = this.coefficient;
        for (let i = 0; i < this.exponents.length; i++) {
            res = res * Math.pow(xvalue.getValueFromXvar(this.xvars[i]) as number, this.exponents[i])
        }
        return res;
    }
}