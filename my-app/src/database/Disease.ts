import SerializableDisease from './SerializableDisease';
import FrequencyTable from './FrequencyTable';
import RiskFactorGroup from './RiskFactorGroup';

class Disease implements SerializableDisease<Disease> {
    diseaseName: String | undefined
    diseaseFrequency: FrequencyTable | undefined
    riskFactorGroups: RiskFactorGroup[] | undefined

    deserialize(input: { diseaseFrequency: { ageClassification: number[], agePrevalences: number[]; }; riskFactorGroups: RiskFactorGroup[] | undefined; }, diseaseName: String) {
        this.diseaseName = diseaseName;
        this.diseaseFrequency = new FrequencyTable().deserialize(input.diseaseFrequency)
        this.riskFactorGroups = input.riskFactorGroups

        return this
    }
}

export default Disease 