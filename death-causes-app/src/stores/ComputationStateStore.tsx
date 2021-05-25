import { makeObservable, observable, computed, action } from "mobx";

export enum ComputationState {
    CHANGED = "Changed",
    RUNNING = "Running",
    READY = "Ready",
    ARTIFICIALLY_SIGNALLING_FINISHED_COMPUTATIONS = "Finished"
  }

export default class ComputationStateStore {
  computationState: ComputationState;

  constructor(){
    this.computationState = ComputationState.READY;
    makeObservable(this, {
      computationState: observable,
      setComputationState: action.bound,
    });
  }

  setComputationState(newState: ComputationState) {
    this.computationState=newState;
  }

}
