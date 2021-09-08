import { TypeStatus } from "../../../models/updateFormNodes/UpdateForm";
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
        return (input as string)=== this.value;
    }

    getType(): TypeStatus {
        return TypeStatus.STRING
    }
}