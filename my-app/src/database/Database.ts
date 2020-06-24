import Serializable from "./Serializable";
import Disease from "./Disease";

class Database implements Serializable<Database> {
    diseases: Disease[] = [];

    deserialize(input: any){
        
        for (var disease in input) {
            if (Object.prototype.hasOwnProperty.call(input, disease)) {
                this.diseases.push(new Disease().deserialize(input[disease], disease))
            }
            // console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            // console.log(input[disease])
            // console.log(disease)
            // console.log(input)
        }

        return this
    }

}

export default Database