import { makeObservable, observable, computed, action } from "mobx";

function getWindowWidth(){
    return Math.max(
        document.documentElement.clientWidth,
        window.innerWidth || 0
      )
}

export default class UIStore {
  windowWidth: number;

  constructor() {
    this.windowWidth=getWindowWidth();
    makeObservable(this, {
        windowWidth: observable,
        updateWindowWidth: action.bound
    })
    window.addEventListener("resize", () => {
        this.updateWindowWidth()
    } );
  }

  updateWindowWidth(){
    this.windowWidth = getWindowWidth()
  }

}