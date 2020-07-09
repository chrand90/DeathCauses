import Frequency from "./Frequency"
import RiskFactorGroup from "./RiskFactorGroup"

class Disease {
    constructor({ diseaseFrequency, riskFactorGroups }) {
        this.diseaseFrequency = new Frequency(diseaseFrequency)
        this.riskFactorGroups = riskFactorGroups.map(
            rfg => new RiskFactorGroup(rfg)
        )
    }

    testme() {
        console.log("12345 it 67890 works")
    }
}

export default Disease