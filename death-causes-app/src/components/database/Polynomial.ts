import { Monomial } from "./Monomial";

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