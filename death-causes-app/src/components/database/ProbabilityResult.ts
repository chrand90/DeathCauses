export interface ProbabilityOfDeathCause {
    deathCause: string;
    probabiltiesOfDeathCause: number[];
}

export interface ProbabilitiesOfAllDeathCauses {
    probabilitiesOfAllDeathCauses: ProbabilityOfDeathCause[]
    ages: number[];
}