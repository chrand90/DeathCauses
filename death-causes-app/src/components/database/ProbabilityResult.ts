export class ProbabilityResult {
    deathCause: string;
    probabiltiesOfDeathCause: number[];

    constructor(deathCause: string, probabiltiesOfDeathCause: number[]) {
        this.deathCause = deathCause;
        this.probabiltiesOfDeathCause = probabiltiesOfDeathCause;
    }
}

export class ProbabilityResultForAllCauses {
    probabilitiesOfAllDeathCauses: ProbabilityResult[]

    constructor(probabilitiesOfAllDeathCauses: ProbabilityResult[]) {
        this.probabilitiesOfAllDeathCauses = probabilitiesOfAllDeathCauses;
    }
}