import Disease from "./Disease"

export function parseDatabase(jsonObject) {
    var map = new Map();
    for (var prop in jsonObject) {
        if (Object.prototype.hasOwnProperty.call(jsonObject, prop)) {
            map.set(prop, new Disease(jsonObject[prop]))
        }
    }
    return map
}