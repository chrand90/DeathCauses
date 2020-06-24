import SerializableDisease from './SerializableDisease';
import Age from './Age';

class Disease implements SerializableDisease<Disease> {
    diseaseName: String | undefined
    age: Age | undefined
    riskFactorGroups: Object | undefined

    deserialize(input: { age: { ageClassification: number[]; agePrevalences: number[]; }; riskFactorGroups: Object | undefined; }, diseaseName: String) {
        this.diseaseName = diseaseName;
        this.age = new Age().deserialize(input.age)
        this.riskFactorGroups = input.riskFactorGroups

        return this
    }
}

export default Disease 