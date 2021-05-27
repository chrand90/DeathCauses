import { makeObservable, observable, action } from "mobx";
import { hideAllToolTips } from "../components/Helpers";

export enum Visualization {
  RELATION_GRAPH = "Relation graph",
  BAR_GRAPH = "Risk factor contributions",
  NO_GRAPH = "Nothing",
  SURVIVAL_GRAPH = "Survival curve",
}


function getWindowWidth(){
    return Math.max(
        document.documentElement.clientWidth,
        window.innerWidth || 0
      )
}

export default class UIStore {
  windowWidth: number;
  visualization: Visualization

  constructor() {
    this.visualization=Visualization.NO_GRAPH;
    this.windowWidth=getWindowWidth();
    makeObservable(this, {
        windowWidth: observable,
        visualization: observable,
        setVisualization: action,
        updateWindowWidth: action.bound
    })
    window.addEventListener("resize", () => {
        this.updateWindowWidth()
    } );
  }

  setVisualization(newVisualization: Visualization){
    hideAllToolTips()
    this.visualization= newVisualization;
  }

  updateWindowWidth(){
    this.windowWidth = getWindowWidth()
  }

}