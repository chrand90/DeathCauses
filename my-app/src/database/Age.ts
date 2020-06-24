import Serializable from "./Serializable";

class Age implements Serializable<Age> {
    classification: number[] = [];
    prevalences: number[] =[];

    deserialize(input: { ageClassification: number[] ; agePrevalences: number[]; }) {
        this.classification = input.ageClassification
        this.prevalences = input.agePrevalences
        return this
    }

     calculate() {
        console.log(this.prevalences.reduce(function(a,b){
            return a+b;
        },0))
    }
        
}

export default Age