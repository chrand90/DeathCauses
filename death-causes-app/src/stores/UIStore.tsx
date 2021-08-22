import { makeObservable, observable, action, computed } from "mobx";
import { hideAllToolTips } from "../components/Helpers";

export enum Visualization {
  RELATION_GRAPH = "Relation graph",
  BAR_GRAPH = "Risk factor contributions",
  NO_GRAPH = "Nothing",
  SURVIVAL_GRAPH = "Survival curve",
  SUMMARY_VIEW = "Summary"
}


function getWindowWidth(){
    return Math.max(
        document.documentElement.clientWidth,
        window.innerWidth || 0
      )
}

export default class UIStore {
  windowWidth: number;
  visualization: Visualization;
  tooltipHider: () => void;

  constructor() {
    this.visualization=Visualization.NO_GRAPH;
    this.windowWidth=getWindowWidth();
    this.tooltipHider=() => {
    };
    makeObservable(this, {
        windowWidth: observable,
        visualization: observable,
        vizWindowWidth: computed,
        verticalStacked: computed,
        questionMenuWidth: computed,
        setVisualization: action,
        updateWindowWidth: action.bound,
    })
    window.addEventListener("resize", () => {
        this.updateWindowWidth()
    } );
  }

  setToolTipHider(tooltipHider: () => void){
    this.tooltipHider=tooltipHider;
  }

  get verticalStacked(){
    return this.windowWidth<992;
  }

  get questionMenuWidth(){
    if(this.windowWidth<1200){
      return Math.floor(this.windowWidth*5/12)
    }
    else{
      return Math.floor(this.windowWidth*4/12)
    }
  }

  get vizWindowWidth(){
    if(this.windowWidth<1200){
      return Math.floor(this.windowWidth*7/12)
    }
    else{
      return Math.floor(this.windowWidth*8/12)
    }
  }

  setVisualization(newVisualization: Visualization){
    hideAllToolTips()
    this.visualization= newVisualization;
  }

  updateWindowWidth(){
    this.windowWidth = getWindowWidth()
  }

}