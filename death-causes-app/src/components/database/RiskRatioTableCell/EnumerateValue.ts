import { RiskRatioTableCellInterface } from "./RiskRatioTableCellInterface";

export class EnumeratedValue implements RiskRatioTableCellInterface {
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