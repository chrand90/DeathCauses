import Serializable from "./Serializable";

class FrequencyTable implements Serializable<FrequencyTable> {
    classification: number[] = [];
    prevalences: number[] =[];

    deserialize(input: { ageClassification: number[], agePrevalences: number[]; }) {
        this.classification = input.ageClassification
        this.prevalences = input.agePrevalences
        return this
    }

     calculate(): number {
        return this.prevalences[0]+this.prevalences[1]
    }
        
}

export default FrequencyTable