import { action, makeObservable, observable } from "mobx";


export default class RelationLinkVizStore {
  elementInFocus: string;

  constructor(
  ) {
    this.elementInFocus="BMI"
    makeObservable(this, {
      elementInFocus: observable,
      setElementInFocus: action.bound,
    });
  }

  setElementInFocus(newElementInFocus: string){
      this.elementInFocus = newElementInFocus;
  }
}
