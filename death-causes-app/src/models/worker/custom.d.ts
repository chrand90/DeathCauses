declare module 'comlink-loader!*' {

    import { RelationLinkJson } from "../RelationLinks";

    class WebpackWorker extends Worker {
      constructor();

      initializeObject(value: number, rel: RelationLinkJson): Promise<void>;
  
      // Add any custom functions to this class.
      // Make note that the return type needs to be wrapped in a promise.
      processData(data: number): Promise<string>;
    }
  
    export = WebpackWorker;
  }