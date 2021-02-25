import { RiskRatioTableCellInterface } from "./RiskRatioTableCellInterface";

export class EnumeratedValue implements RiskRatioTableCellInterface {
    value: string;

    constructor(value: string) {
        this.value = value;
    }

    getValueInCell(): string {
        return this.value
    }

    isInputWithinCell(input: string): boolean {
        //console.log("input="+ input.toString()+ "("+ (typeof input).toString() +")");
        return (input as string)=== this.value;
    }
}