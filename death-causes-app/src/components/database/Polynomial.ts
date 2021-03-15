import { LookUpValue } from "./InterpolationTableCell";
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

    evaluateByLookUp(lookup: LookUpValue[]):number {
        lookup.sort(function(lookup1, lookup2){ 
            return lookup1.index-lookup2.index}
          )
          let sortedArgs= lookup.map((lookup: LookUpValue) =>{
            return lookup.value as number
          })
          return this.evaluate(sortedArgs);
    }
}