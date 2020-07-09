import Frequency from "./Frequency"

class Disease {
    constructor({ diseaseFrequency: { ageClassification, agePrevalences }, riskFactorGroups }) {
        this.diseaseFrequency = new Frequency(agePrevalences, ageClassification)
        this.riskFactorGroups = riskFactorGroups
    }

    testme() {
        console.log("12345 it 67890 works")
    }
}

export default Disease