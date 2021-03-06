export class Monomial {
    coefficient: number;
    exponents: number[];

    constructor(coefficent: number, exponents: number[]) {
        this.coefficient = coefficent;
        this.exponents = exponents;
    }

    evaluate(submittedFactorAnswers: number[]): number {
        // assert(submittedFactorAnswers.length === this.exponents.length);
        let res = this.coefficient;
        for (let i = 0; i < this.exponents.length; i++) {
            res = res * Math.pow(submittedFactorAnswers[i], this.exponents[i])
        }
        return res;
    }
}