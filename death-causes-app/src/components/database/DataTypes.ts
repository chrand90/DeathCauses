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

    isInputWithinCell(input: number): boolean {
        return this.endPointFrom < input && input <= this.endPointTo;
    }

}

export class NumericValue implements RiskRatioTableCellData {
    value: number;

    constructor(number: string) {
        this.value = +number;
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

    isInputWithinCell(input: string): boolean {
        return input.toLowerCase() === this.value;
    }
}

export interface RiskRatioTableCellData {
    isInputWithinCell(input: number | string | boolean): boolean
}