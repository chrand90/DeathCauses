import { RiskRatioTableCellInterface } from "./RiskRatioTableCellInterface";

export class NumericInterval implements RiskRatioTableCellInterface {
    endPointFrom: number;
    endPointTo: number;
    constructor(endPointFrom: string, endPointTo: string) {
        if (!endPointFrom && !endPointTo) {
            throw new Error("-infinity to infinity is not allowed as interval")
        }
        if (endPointFrom) {
            this.endPointFrom = +endPointFrom
        } else {
            this.endPointFrom = -Infinity
        }
        if (endPointTo) {
            this.endPointTo = +endPointTo
        } else {
            this.endPointTo = Infinity
        }
    }

    getValueInCell(): string | number | boolean {
        if(this.endPointFrom === -Infinity) {
            return this.endPointTo - 0.1
        }
        
        if(this.endPointTo === Infinity) {
            return this.endPointFrom + 0.1
        }
        return this.endPointFrom + (this.endPointTo - this.endPointFrom) / 2
    }

    isInputWithinCell(input: number): boolean {
        return this.endPointFrom < input && input <= this.endPointTo;
    }
}
