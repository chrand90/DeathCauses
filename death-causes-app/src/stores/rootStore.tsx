import { action, makeObservable, observable } from "mobx";
import React from "react";
import AdvancedOptionsStore from "./AdvancedOptionsStore";
import BarChartStore from "./BarChartOptionsStore";
import ComputationStateStore from "./ComputationStateStore";
import ComputationStore from "./ComputationStore";
import FactorInputStore from "./FactorInputStore";
import LoadedDataStore from "./LoadedDataStore";
import QuestionProgressStore from "./QuestionProgressStore";
import RelationLinkVizStore from "./RelationLinkVizStore";
import SendEmailStore from "./SendEmailStore";
import UIStore from "./UIStore";

export default class RootStore {
  factorInputStore: FactorInputStore;
  questionProgressStore: QuestionProgressStore;
  loadedDataStore: LoadedDataStore;
  advancedOptionsStore: AdvancedOptionsStore;
  computationStore: ComputationStore;
  computationStateStore: ComputationStateStore;
  relationLinkVizStore: RelationLinkVizStore;
  barChartStore: BarChartStore
  uIStore: UIStore;
  sendEmailStore: SendEmailStore;

  constructor() {
    this.sendEmailStore= new SendEmailStore();
    this.loadedDataStore = new LoadedDataStore();
    this.uIStore = new UIStore();
    this.computationStateStore= new ComputationStateStore();
    this.advancedOptionsStore= new AdvancedOptionsStore(this.computationStateStore);
    this.computationStore= new ComputationStore(this.loadedDataStore, this.advancedOptionsStore, this.computationStateStore);
    this.factorInputStore = new FactorInputStore(this.loadedDataStore, this.computationStateStore, this.advancedOptionsStore);
    this.relationLinkVizStore = new RelationLinkVizStore();
    this.questionProgressStore = new QuestionProgressStore(
      this.loadedDataStore
    );
    this.barChartStore = new BarChartStore(this.loadedDataStore);
    this.loadedDataStore.loadAllData(this.factorInputStore, this.computationStore, this.questionProgressStore);
  }


}

/* Store end */

export const store = new RootStore();

/* Store helpers */
export const StoreContext = React.createContext<RootStore>(store);

/* Hook to use store in any functional component */
export const useStore = () => React.useContext(StoreContext);
 
/* HOC to inject store to any functional or class component */
export const withStore = (Component:any) => (props:any) => {
  return <Component {...props} store={useStore()} />;
};
