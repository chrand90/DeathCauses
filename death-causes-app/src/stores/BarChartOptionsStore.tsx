import { makeObservable, observable, computed, action } from "mobx";
import LoadedDataStore from "./LoadedDataStore";

enum LatestChange {
	FITSCREEN="fit screen to disease width",
	GROUPING= "collected categories to make grouping"
}

export default class BarChartStore {
  loadedDataStore: LoadedDataStore;
  diseaseToWidth: string | null;
  conditionToWidth: string | null;
  collectedCategories: string[];
  latestChange: LatestChange;

  constructor(loadedDataStore: LoadedDataStore){
    this.loadedDataStore = loadedDataStore;
    this.diseaseToWidth=null;
    this.conditionToWidth=null;
    this.collectedCategories=[];
    this.latestChange=LatestChange.FITSCREEN;
    makeObservable(this, {
      diseaseToWidth: observable,
      collectedCategories: observable,
      conditionToWidth: observable,
      expandCategory: action.bound,
      collectParentCategory: action.bound,
      explicitCollectedGroups: computed,
      setDiseaseToWidth: action.bound,
      setConditionToWidth: action.bound
    });
  }

  expandCategory(category: string){
		let newCats=[...this.collectedCategories]
		if(newCats.includes(category)){
			newCats=newCats.filter(d => d!==category)
			newCats=newCats.concat(this.loadedDataStore.rdat.getImmediateCauseCategoryDescendants(category))
      this.latestChange=LatestChange.GROUPING
      this.collectedCategories=newCats
		}
		else{
			console.warn("Tried to remove a category that wasnt collapsed... Ignored.")
		}
	}

  collectParentCategory(category: string){
		const parent=this.loadedDataStore.rdat.getParentCategory(category)
		let noLongerNeedsToBeCollapsed: string[];
		let newCats:string[]=[...this.collectedCategories]
		if(parent){
			noLongerNeedsToBeCollapsed=this.loadedDataStore.rdat.findCauseCategoryDescendants(parent)
			noLongerNeedsToBeCollapsed=noLongerNeedsToBeCollapsed.filter(item => item !== parent);
			newCats.push(parent)
		}
		else{
			noLongerNeedsToBeCollapsed=[]; 
		}
		let newDiseaseToWidth: string | null=this.diseaseToWidth;
		if(this.diseaseToWidth && parent){
			if(this.loadedDataStore.rdat.findCauseCategoryAncestors(this.diseaseToWidth).includes(parent)){
				newDiseaseToWidth=null;
			}
		}
		const newCollectedGroups=newCats.filter(d=>!noLongerNeedsToBeCollapsed.includes(d))
    this.latestChange=LatestChange.GROUPING;
    this.diseaseToWidth=newDiseaseToWidth
    this.collectedCategories=newCollectedGroups
	}

  setConditionToWidth(newConditionToWidth: null | string){
    this.conditionToWidth=newConditionToWidth;
  }

  setDiseaseToWidth(newDiseaseToWidth: null | string){
    this.latestChange=LatestChange.FITSCREEN;
    this.diseaseToWidth=newDiseaseToWidth
  }

  get explicitCollectedGroups(){
    return this.loadedDataStore.rdat.makeCollectedGroups(this.collectedCategories);
  }

}
