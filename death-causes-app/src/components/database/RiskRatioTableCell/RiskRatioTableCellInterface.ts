export interface RiskRatioTableCellInterface {
    isInputWithinCell(input: number | string | boolean): boolean
    getValueInCell(): number | string | boolean
}