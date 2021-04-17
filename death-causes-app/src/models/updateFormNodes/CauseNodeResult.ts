import { BestValues } from "../../components/Calculations/ConsensusBestValue";

export default interface CauseNodeResult {
    probs: number[],
    bestValues: BestValues | undefined,
    name: string,
    perYearInnerCauses: {[cause:string]:number}[] | {[cause:string]:number}
}