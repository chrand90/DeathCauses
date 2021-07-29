export interface FrequencyJson {
    age_classification: number[] | never[];
    age_prevalences: number[];
}

class FrequencyTable {
    private readonly AGE_INTERVALS: number[] = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]

    ageClassifications: number[]
    agePrevalences: number[]

    public constructor(json: FrequencyJson) {
        this.ageClassifications = json.age_classification;
        if(json.age_prevalences.length -1 !== this.AGE_INTERVALS.length) {
            throw new Error("Age Prevalence list does not match predefined age intervals");
        }
        this.agePrevalences = json.age_prevalences;
    }

    public getPrevalence = (age: number): number => {
        let indexOfAgePrevalance = this.AGE_INTERVALS.findIndex((ageInterval: number) => age < ageInterval);
        if (indexOfAgePrevalance === -1) {
            return this.agePrevalences[this.agePrevalences.length - 1];
        }
        return this.agePrevalences[indexOfAgePrevalance]
    }
}

export default FrequencyTable;