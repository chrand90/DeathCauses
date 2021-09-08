import { TypeStatus } from "../../../models/updateFormNodes/UpdateForm";

export interface RiskRatioTableCellInterface {
    isInputWithinCell(input: number | string): boolean
    getValueInCell(): number | string
    getType(): TypeStatus
}