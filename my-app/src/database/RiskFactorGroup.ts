import Serializable from './Serializable';
import FrequencyTable from './FrequencyTable';
import RiskFactorTable from './RiskRatioTable';

class RiskFactorGroup implements Serializable<RiskFactorGroup> {
    normalizingFactors: FrequencyTable | undefined
    interactionFunction: String | undefined
    riskRatioTables: RiskFactorTable[] = []

    deserialize(input: {normalizingFactors: { ageClassification: number[], agePrevalences: number[]; }, interactionFunction: String, riskRatioTables: RiskFactorTable[]}) {
        this.normalizingFactors = new FrequencyTable().deserialize(input.normalizingFactors);
        this.interactionFunction = input.interactionFunction
        input.riskRatioTables.forEach(
            riskRatioTable => this.riskRatioTables.push(new RiskFactorTable().deserialize(riskRatioTable))
        )

        return this
    }

}

export default RiskFactorGroup 