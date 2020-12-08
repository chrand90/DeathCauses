import Factors from "../../models/Factors";
import { DataRow, DataSet } from "../PlottingData";
import Deathcause from "./Deathcause";

export class ProbabilityOfDeathCauseCalculation {
    database: Deathcause[];

    constructor(database: Deathcause[]) {
        this.database = database;
    }

    calculate(input: Factors, currentAge: number, endAge: number, deathcause: Deathcause) {
        let ageRange: number[] = Array.from({length: endAge-currentAge+1}, (x, i) => i+currentAge);

        let baseProbabiliyOfDeathCause: number[] = ageRange.map(age => {return deathcause.age.getPrevalence(age)})
    }
}
