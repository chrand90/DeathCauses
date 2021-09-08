import CauseNodeResult from "../CauseNodeResult";

export function computeProbOfNotDying(causeNodeResults: CauseNodeResult[], withoutIndex: number[] = []) {

    const deathCauseProbabilities = causeNodeResults.filter((causeNodeResult, index) => {
        return !withoutIndex.includes(index)
    }).map((causeNodeResult: CauseNodeResult) => {
        return causeNodeResult.probs;
    })

    const numberOfYears = deathCauseProbabilities[0].length

    let totalProbabilityOfNotDying: number[] = Array.from({ length: numberOfYears })
    totalProbabilityOfNotDying = totalProbabilityOfNotDying.map((_, i) => deathCauseProbabilities.map(val => val[i]).reduce((sum, x) => sum + x, 0))
        .map(x => Math.max(0, 1 - x))

    return totalProbabilityOfNotDying
}

export function probOfStillBeingAlive(causeNodeResults: CauseNodeResult[], withoutIndex: number[] = []) {
    const probOfNotDying = computeProbOfNotDying(causeNodeResults, withoutIndex);
    const survivalCurve: number[] = [1]
    for (let i = 1; i <= probOfNotDying.length; i++) {
        survivalCurve.push(survivalCurve[i - 1] * probOfNotDying[i - 1])
    }
    return survivalCurve
}

export function calculateLifeExpectancy(survivalCurve: number[], ageFrom: number): number {
    const probabilityOfOutLiving = survivalCurve[survivalCurve.length - 1]
    const z = probabilityOfOutLiving > 1e-7 ? survivalCurve[survivalCurve.length - 1] / survivalCurve[survivalCurve.length - 2] : 0
    const lifeExpectancy = ageFrom + survivalCurve.slice(1).reduce((a, b) => a + b, 0) + probabilityOfOutLiving * 1 / (1 - z)
    return lifeExpectancy
}

export const getAgeArray = (ageFrom: number, ageTo: number): number[] => {
    return Array.from({ length: ageTo - ageFrom + 1 }, (_, i) => ageFrom + i)
}
