import Location from "./InterpolationLocation";
import { Monomial } from "./Monomial";

export class Polynomial {
    monomials: Monomial[] = [];

    constructor(monomials: Monomial[]) {
        this.monomials = monomials;
    }

    evaluate(xvalue: Location): number {
        let res = 0;
        this.monomials.forEach(monomial => 
            res += monomial.evaluate(xvalue)    
        );
        return res;
    }

}