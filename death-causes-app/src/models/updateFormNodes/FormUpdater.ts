import {UpdateForm, UpdateDic, MissingStatus, ChangeStatus, TypeStatus, DimensionStatus, StochasticStatus} from "./UpdateForm";

export default abstract class FormUpdater {
    lastOutput: UpdateForm | null;
    ancestors: string[];
    ageFrom: number | null;
    ageTo: number;
    constructor(ancestors: string[], ageFrom: number | null, ageTo: number){
        this.lastOutput=null;
        this.ancestors=ancestors;
        this.ageFrom = ageFrom ? Math.floor(ageFrom) : ageFrom;
        this.ageTo = Math.floor(ageTo);
    }

    getAgeFrom(allPreviousUpdateForms: UpdateDic):number{
        if(this.ageFrom===null){
            return Math.floor(allPreviousUpdateForms["Age"].value as number)
        }
        else{
            return this.ageFrom
        }
    }

    getAgeTo(){
        return this.ageTo
    }



    isUnchanged(allPreviousUpdateForms: UpdateDic):boolean{
      if(allPreviousUpdateForms["Age"].change===ChangeStatus.CHANGED){
        return false;
      }
      return this.ancestors.every( (ancestor:string) => {
        if(!(ancestor in allPreviousUpdateForms)){
          throw ancestor+' not found in the updatedic'           
        }
        return allPreviousUpdateForms[ancestor].change===ChangeStatus.UNCHANGED
      })
    }

    isMissing(allPreviousUpdateForms: UpdateDic): boolean {
      return !this.ancestors.every( (ancestor:string) => {
        if(!(ancestor in allPreviousUpdateForms)){
          throw ancestor+' not found in the updatedic'           
        }
          return allPreviousUpdateForms[ancestor].missing===MissingStatus.NONMISSING
      })
    }

    protected getNode(allPreviousUpdateForms: UpdateDic, nodename: string):UpdateForm{
      if(this.ancestors.includes(nodename) && nodename in allPreviousUpdateForms){
        return allPreviousUpdateForms[nodename]
      }
      else if(!this.ancestors.includes(nodename)){
        throw "The requested factor "+ nodename+ " was not present in its ancestors,"+this.ancestors.toString()
      }
      else{
        throw "The requested factor "+nodename+ " was not present in the updatedic."
      }
    }

    handleMissing(allPreviousUpdateForms: UpdateDic):UpdateForm{
      return {
          change: ChangeStatus.CHANGED,
          missing: MissingStatus.MISSING,
          type: TypeStatus.STRING,
          dimension: DimensionStatus.SINGLE,
          random: StochasticStatus.DETERMINISTIC,
          value: ""
      }
    }

    inputDependsOnAge(allPreviousUpdateForms: UpdateDic): boolean {
      return !this.ancestors.every((nodeName) => {
        return (
          allPreviousUpdateForms[nodeName].dimension === DimensionStatus.SINGLE
        );
      });
    }

    ChangedAndMissing(){
        return {
            change: ChangeStatus.CHANGED,
            missing: MissingStatus.NONMISSING
        }
    }

    getAges(udic: UpdateDic){
      return {ageFrom: this.getAgeFrom(udic), ageTo:this.getAgeTo(), age:(udic["Age"].value as number)}
    }

    update(allPreviousUpdateForms: UpdateDic): UpdateForm{
        if(this.lastOutput!== null && this.isUnchanged(allPreviousUpdateForms)){
            this.lastOutput.change=ChangeStatus.UNCHANGED
        }
        else if(this.isMissing(allPreviousUpdateForms)){
            this.lastOutput=this.handleMissing(allPreviousUpdateForms);
        }
        else{
            this.lastOutput=this.compute(allPreviousUpdateForms);
        }
        return this.lastOutput;
    }

    abstract compute(allPreviousUpdateForms: UpdateDic): UpdateForm;
}

export interface FormUpdaterDic {
    [nodeName: string]: FormUpdater;
}