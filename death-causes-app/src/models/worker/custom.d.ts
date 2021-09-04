declare module 'comlink-loader!*' {
  class WebpackWorker extends Worker {
    constructor();

    initializeObject(rel: RelationLinkJson, rawData: RawDataJson, rawCategoryData: RawDataJson, rawDescriptions: Descriptions, rawConditions: rawDataJson, ageFrom: number | null, ageTo: number, evaluationUnit: EVALUATION_UNIT): Promise<void>;

    // Add any custom functions to this class.
    // Make note that the return type needs to be wrapped in a promise.
    processData(data: FactorAnswers, evaluationUnit: EVALUATION_UNIT): Promise<{ innerCauses:  DeathCauseContributionsAndChanges, conditionsRes: ConditionsRes}>; 
  }

  export = WebpackWorker;
}