export class NumericInterval implements RiskRatioTableCellData {
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

export class NumericValue implements RiskRatioTableCellData {
    value: number;

    constructor(number: string) {
        this.value = +number;
    }
    getValueInCell(): number {
        return this.value
    }

    isInputWithinCell(input: string | number | boolean): boolean {
        return +input === this.value;
    }
}

export class EnumeratedValue implements RiskRatioTableCellData {
    value: string;

    constructor(value: string) {
        this.value = value.toLowerCase();
    }

    getValueInCell(): string {
        return this.value
    }

    isInputWithinCell(input: string): boolean {
        return input.toLowerCase() === this.value;
    }
}

export interface RiskRatioTableCellData {
    isInputWithinCell(input: number | string | boolean): boolean
    getValueInCell(): number | string | boolean
}