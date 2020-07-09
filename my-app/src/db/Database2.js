import Disease from "./Disease"

class Database {
    constructor(jsonObject) {
        this.map =  new Map();
        for(var prop in jsonObject) {
            if(Object.prototype.hasOwnProperty.call(jsonObject, prop)){
                this.map.set(prop, new Disease(jsonObject[prop]))
            }
        }
    }
}

export default Database