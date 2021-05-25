import React from "react";
import { makeObservable, observable, computed, action } from "mobx";
import FactorInputStore from "./FactorInputStore";
import QuestionProgressStore from "./QuestionProgressStore";
import LoadedDataStore from "./LoadedDataStore";
import UIStore from "./UIStore";
import AdvancedOptionsStore from "./AdvancedOptionsStore";
import ComputationStore from "./ComputationStore";
import ComputationStateStore from "./ComputationStateStore";

export default class RootStore {
  factorInputStore: FactorInputStore;
  loadedQuestionMenuData: boolean;
  loadedVizWindowData: boolean;
  questionProgressStore: QuestionProgressStore;
  loadedDataStore: LoadedDataStore;
  advancedOptionsStore: AdvancedOptionsStore;
  computationStore: ComputationStore;
  computationStateStore: ComputationStateStore;
  uIStore: UIStore;

  constructor() {
    this.loadedQuestionMenuData = false;
    this.loadedVizWindowData = false;
    this.loadedDataStore = new LoadedDataStore();
    this.uIStore = new UIStore();
    this.computationStateStore= new ComputationStateStore();
    this.advancedOptionsStore= new AdvancedOptionsStore(this.computationStateStore);
    this.computationStore= new ComputationStore(this.loadedDataStore, this.advancedOptionsStore, this.computationStateStore);
    this.factorInputStore = new FactorInputStore(this.loadedDataStore, this.computationStateStore);
    this.questionProgressStore = new QuestionProgressStore(
      this.loadedDataStore
    );
    makeObservable(this, {
      loadedVizWindowData: observable,
      loadedQuestionMenuData: observable,
      loadAllData: action.bound,
    });
    this.loadAllData();
  }

  loadAllData() {
    this.loadedDataStore
      .loadQuestionMenuContent()
      .then(action(() => {
        this.factorInputStore.attachLoadedData();
        this.questionProgressStore.attachLoadedData();
        this.loadedQuestionMenuData = true;
        return 
      }))
      .then(()=>{
        return this.loadedDataStore.loadDeathCauses()
      })
      .then(action(() => {
        this.computationStore.attachLoadedData();
        this.loadedVizWindowData=true;
        return
      }));
  }
}

/* Store end */

/* Store helpers */
export const StoreContext = React.createContext<RootStore | null>(null);

/* Hook to use store in any functional component */
export const useStore = () => React.useContext(StoreContext);

/* HOC to inject store to any functional or class component */
export const withStore = (Component: any) => (props: any) => {
  return <Component {...props} store={useStore()} />;
};
