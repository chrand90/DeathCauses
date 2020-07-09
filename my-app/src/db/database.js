import Disease from "./Disease"

class DatabaseTest {
    constructor(bladderCancer, mouthCancer) {
    this.bladderCancer = Object.setPrototypeOf(bladderCancer, Disease.prototype)
    this.mouthCancer = mouthCancer
    }

    test() {
        console.log("hej med dig")
        console.log(this.bladderCancer)
    }
}

export default DatabaseTest