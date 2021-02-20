declare module 'comlink-loader!*' {

    import { RelationLinkJson } from "../RelationLinks";
    
    import { FactorAnswers } from "../Factors";
    class WebpackWorker extends Worker {
      constructor();

      initializeObject(rel: RelationLinkJson): Promise<void>;
  
      // Add any custom functions to this class.
      // Make note that the return type needs to be wrapped in a promise.
      processData(data: FactorAnswers): Promise<string>;
    }
  
    export = WebpackWorker;
  }