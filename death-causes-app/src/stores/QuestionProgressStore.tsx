import React from "react";
import { makeObservable, observable, computed, action } from "mobx";
import Factors, { FactorAnswers, FactorAnswerUnitScalings, FactorMaskings } from "../models/Factors";
import { InputValidity } from "../models/FactorAbstract";
import { LoadedFactors } from "./DataLoading";
import InputJson from "../models/FactorJsonInput";
import LoadedDataStore from "./LoadedDataStore";

export enum AnswerProgress {
    ANSWERING = "answering",
    FINISHED = "finished",
  }
  
export enum QuestionView {
    QUESTION_MANAGER = "question-manager",
    NOTHING = "no-questions",
    QUESTION_LIST = "question-list",
  }

export default class QuestionProgressStore {
  hasBeenAnswered: string[];
  answeringProgress: AnswerProgress;
  currentFactor: string;
  view: QuestionView;
  loadedDataStore: LoadedDataStore

  constructor(loadedDataStore: LoadedDataStore) {
      this.hasBeenAnswered=[];
      this.answeringProgress=AnswerProgress.ANSWERING
      this.currentFactor="";
      this.view=QuestionView.QUESTION_MANAGER;
      this.loadedDataStore=loadedDataStore;
    makeObservable(this, {
      hasBeenAnswered: observable,
      answeringProgress: observable,
      currentFactor: observable,
      view: observable,
      attachLoadedData:action,
      switchView:action,
      nextQuestion:action,
      startOverQuestionnaire: action.bound,
      finishQuestionnaire: action.bound,
    });
  }

  attachLoadedData(){
    this.currentFactor=this.loadedDataStore.factorOrder[0];
  }

  switchView(newView: QuestionView){
      this.view=newView;
  }

  nextQuestion(factorMaskings: FactorMaskings){
    let newAnswerProgress = this.answeringProgress;
    let newHasBeenAnswered = [...this.hasBeenAnswered];
    let newCurrentFactor = this.currentFactor;
    while (
      newAnswerProgress === AnswerProgress.ANSWERING &&
      (newCurrentFactor in factorMaskings ||
        newCurrentFactor === this.currentFactor)
    ) {
      if (!newHasBeenAnswered.includes(newCurrentFactor)) {
        newHasBeenAnswered.push(newCurrentFactor);
      }
      if (
        this.loadedDataStore.factorOrder.indexOf(newCurrentFactor) + 1 ===
        this.loadedDataStore.factorOrder.length
      ) {
        newAnswerProgress = AnswerProgress.FINISHED;
        newCurrentFactor = "";
      } else {
        newCurrentFactor = this.loadedDataStore.factorOrder[
          this.loadedDataStore.factorOrder.indexOf(newCurrentFactor) + 1
        ];
      }
    }
    this.hasBeenAnswered=newHasBeenAnswered;
    this.answeringProgress=newAnswerProgress;
    this.currentFactor=newCurrentFactor;
  }

  finishQuestionnaire(){
    this.answeringProgress= AnswerProgress.FINISHED
    this.hasBeenAnswered= this.loadedDataStore.factorOrder
    this.currentFactor= ""; 
  }

  startOverQuestionnaire(){
    this.hasBeenAnswered= []
    this.currentFactor= this.loadedDataStore.factorOrder[0]
    this.answeringProgress= AnswerProgress.ANSWERING
  }

  previousQuestion(factorMaskings: FactorMaskings){
    let i = 0;
    if (this.hasBeenAnswered.includes(this.currentFactor)) {
        i =
        this.hasBeenAnswered.indexOf(this.currentFactor) -
        1;
    } else {
        i = this.hasBeenAnswered.length - 1;
    }
    while (
        this.hasBeenAnswered[i] in factorMaskings &&
        i > 0
    ) {
        i = i - 1;
    }
    this.currentFactor = this.hasBeenAnswered[i];
    this.answeringProgress= AnswerProgress.ANSWERING;
  }




}
