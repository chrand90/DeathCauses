import { assert } from "console";

export class Polynomial {
    monomials: Monomial[] = [];

    constructor(monomials: Monomial[]) {
        this.monomials = monomials;
    }

    evaluate(submittedFactorAnswers: number[]): number {
        let res = 0;
        this.monomials.forEach(monomial => 
            res += monomial.evaluate(submittedFactorAnswers)    
        );
        return res;
    }
}

export class Monomial {
    coefficient: number;
    exponents: number[];

    constructor(coefficent: number, exponents: number[]) {
        this.coefficient = coefficent;
        this.exponents = exponents;
    }

    evaluate(submittedFactorAnswers: number[]): number {
        assert(submittedFactorAnswers.length === this.exponents.length);
        let res = this.coefficient;
        for (let i = 0; i < this.exponents.length; i++) {
            res = res * Math.pow(submittedFactorAnswers[i], this.exponents[i])
        }
        return res;
    }
}