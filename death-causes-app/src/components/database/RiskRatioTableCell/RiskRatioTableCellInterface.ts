export interface RiskRatioTableCellInterface {
    isInputWithinCell(input: number | string): boolean
    getValueInCell(): number | string
}