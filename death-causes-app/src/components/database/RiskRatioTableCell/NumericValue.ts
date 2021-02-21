import { RiskRatioTableCellInterface } from "./RiskRatioTableCellInterface";

export class NumericValue implements RiskRatioTableCellInterface {
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
