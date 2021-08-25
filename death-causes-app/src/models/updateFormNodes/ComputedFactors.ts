import FormUpdater from "./FormUpdater";
import { ChangeStatus, UpdateDic, UpdateForm,  TypeStatus, DimensionStatus, StochasticStatus } from "./UpdateForm"

class SmokeSinceStop extends FormUpdater{

    compute(allPreviousUpdateForms: UpdateDic):UpdateForm{
        const SmokingStopped= this.getNode(allPreviousUpdateForms, "SmokingStopped").value as number;
        const SmokingStatus= this.getNode(allPreviousUpdateForms, "Smoking").value as string;
        const {ageFrom, ageTo, age} = this.getAges(allPreviousUpdateForms);
        const newValue: number[]=[];
        for(let i=0; i<ageTo-ageFrom+1; i++){
            if(SmokingStatus==="Former smoker"){
                newValue.push(Math.max(0,i+SmokingStopped+(ageFrom-age)));
            }
            else{
                newValue.push(0);
            }
            
        }
        return {...this.ChangedAndMissing(),
            type: TypeStatus.NUMERIC,
            dimension: DimensionStatus.YEARLY,
            random: StochasticStatus.DETERMINISTIC,
            value: newValue
        }
    }
}

class SmokeDurationCumulative extends FormUpdater{

    compute(allPreviousUpdateForms: UpdateDic):UpdateForm{
        const SmokeDuration = this.getNode(allPreviousUpdateForms, "SmokeDuration").value as number;
        const SmokingStatus= this.getNode(allPreviousUpdateForms, "Smoking").value as string;
        const {ageFrom, ageTo, age} = this.getAges(allPreviousUpdateForms);
        const newValue: number[]=[];
        for(let i=0; i<ageTo-ageFrom+1; i++){
            if(SmokingStatus==="Current smoker"){
                newValue.push(Math.max(0,i+SmokeDuration+(ageFrom-age)));
            }
            else{
                newValue.push(SmokeDuration);
            }
            
        }
        return {...this.ChangedAndMissing(),
            type: TypeStatus.NUMERIC,
            dimension: DimensionStatus.YEARLY,
            random: StochasticStatus.DETERMINISTIC,
            value: newValue
        }
    }
}

class PhysicalTotal extends FormUpdater{

    compute(allPreviousUpdateForms: UpdateDic):UpdateForm{
        const physicalMedium=this.getNode(allPreviousUpdateForms, "PhysicalMedium").value as number;
        const physicalHard=this.getNode(allPreviousUpdateForms, "PhysicalHard").value as number;
        const newValue= 4*physicalMedium+8*physicalHard;
        return {...this.ChangedAndMissing(),
            type: TypeStatus.NUMERIC,
            dimension: DimensionStatus.SINGLE,
            random: StochasticStatus.DETERMINISTIC,
            value: newValue
        }
    }
}

class Greens extends FormUpdater{

    compute(allPreviousUpdateForms: UpdateDic):UpdateForm{
        const vegetables=this.getNode(allPreviousUpdateForms, "Vegetables").value as number;
        const fruits=this.getNode(allPreviousUpdateForms, "Fruits").value as number;
        const newValue= vegetables+fruits;
        return {...this.ChangedAndMissing(),
            type: TypeStatus.NUMERIC,
            dimension: DimensionStatus.SINGLE,
            random: StochasticStatus.DETERMINISTIC,
            value: newValue
        }
    }
}

class SmokeCumulative extends FormUpdater {

    compute(allPreviousUpdateForms: UpdateDic):UpdateForm{
        const SmokingStopped=this.getNode(allPreviousUpdateForms, "SmokingStopped").value as number;
        const SmokingPastAmount=this.getNode(allPreviousUpdateForms, "SmokePastAmount").value as number;
        const SmokeIntensity=this.getNode(allPreviousUpdateForms, "SmokeIntensity").value as number;
        const SmokeDuration=this.getNode(allPreviousUpdateForms, "SmokeDuration").value as number;
        const {ageFrom, ageTo, age} = this.getAges(allPreviousUpdateForms);
        let newValue: number[]=[];
        for(let i=0; i<ageTo-ageFrom+1; i++){
            if(ageFrom+i<age){
                if(ageFrom+i<age-SmokingStopped){
                    const smokeStart=age-SmokingStopped-SmokeDuration
                    newValue.push(Math.max(0,SmokingPastAmount*(ageFrom+i-smokeStart)/SmokeDuration))
                }
                else{
                    newValue.push(SmokeDuration*SmokingPastAmount)
                }
            }
            else{
                newValue.push(SmokeDuration*SmokingPastAmount+SmokeIntensity*(ageFrom+i-age));
            }
        }
        return {...this.ChangedAndMissing(),
            type: TypeStatus.NUMERIC,
            dimension: DimensionStatus.YEARLY,
            random: StochasticStatus.DETERMINISTIC,
            value: newValue
        }
    }
}

class SmokeTypicalAmount extends FormUpdater{
    compute(allPreviousUpdateForms: UpdateDic):UpdateForm{
        const Smoking=this.getNode(allPreviousUpdateForms, "Smoking").value as string;
        const SmokingStopped=this.getNode(allPreviousUpdateForms, "SmokingStopped").value as number;
        const SmokingPastAmount=this.getNode(allPreviousUpdateForms, "SmokePastAmount").value as number;
        const SmokeIntensity=this.getNode(allPreviousUpdateForms, "SmokeIntensity").value as number;
        const SmokeDuration=this.getNode(allPreviousUpdateForms, "SmokeDuration").value as number;
        const {ageFrom, ageTo, age} = this.getAges(allPreviousUpdateForms);
        let newValue: number[]=[];
        for(let i=0; i<ageTo-ageFrom+1; i++){
            if(ageFrom+i<age-SmokingStopped-SmokeDuration){
                newValue.push(0)
            }
            else if(Smoking==="Current smoker"){
                newValue.push(SmokeIntensity)
            }
            else{
                newValue.push(SmokingPastAmount)
            }

                // if(SmokeIntensity>-0.01){
                //     let proportion= SmokeDuration/(SmokeDuration+ageFrom+i-age)
                //     newValue.push(proportion*pastAverage+(1-proportion)*SmokeIntensity)
                // }
                // else{
                //     newValue.push(pastAverage);
                //}
        }
        return {...this.ChangedAndMissing(),
            type: TypeStatus.NUMERIC,
            dimension: DimensionStatus.YEARLY,
            random: StochasticStatus.DETERMINISTIC,
            value: newValue
        }
    }
}

class OralContraceptiveEver extends FormUpdater{
    compute(allPreviousUpdateForms: UpdateDic):UpdateForm{
        const oralStatus=this.getNode(allPreviousUpdateForms, "OralContraceptiveStatus").value as string;
        return {...this.ChangedAndMissing(),
            type: TypeStatus.STRING,
            dimension: DimensionStatus.SINGLE,
            random: StochasticStatus.DETERMINISTIC,
            value: oralStatus=== 'Never used' ? "No" :"Yes"
        }
    }
}

class OralContraceptiveSinceStop extends FormUpdater{
    compute(allPreviousUpdateForms: UpdateDic):UpdateForm{
        const oralStatus=this.getNode(allPreviousUpdateForms, "OralContraceptiveStatus").value as string;
        const oralStopped=this.getNode(allPreviousUpdateForms, "OralContraceptiveStopped").value as number;
        const oralTillStop=this.getNode(allPreviousUpdateForms, "OralContraceptiveTillStop").value as number;
        if(oralStatus==="Never used"){
            return {
                ...this.ChangedAndMissing(),
                type: TypeStatus.NUMERIC,
                dimension: DimensionStatus.SINGLE,
                random: StochasticStatus.DETERMINISTIC,
                value: 0
            }
        }
        let newValue: number[]=[];
        if(oralStatus==="Current user"){
            const {ageFrom, ageTo, age} = this.getAges(allPreviousUpdateForms);
            for(let i=0; i<ageTo-ageFrom+1; i++){
                newValue.push(Math.max(0, ageFrom+i-age-oralTillStop))
            }
        }
        if(oralStatus === "Former user"){
            const {ageFrom, ageTo, age} = this.getAges(allPreviousUpdateForms);
            for(let i=0; i<ageTo-ageFrom+1; i++){
                newValue.push(Math.max(0, ageFrom+i-age+oralStopped))
            }
        }
        return {
            ...this.ChangedAndMissing(),
            type: TypeStatus.NUMERIC,
            dimension: DimensionStatus.YEARLY,
            random: StochasticStatus.DETERMINISTIC,
            value: newValue
        }
    }
}

class WaistMale extends FormUpdater{
    compute(allPreviousUpdateForms: UpdateDic):UpdateForm{
        const gender=this.getNode(allPreviousUpdateForms, "Sex").value as string;
        const waist=this.getNode(allPreviousUpdateForms, "Waist").value as number;
        return {...this.ChangedAndMissing(),
            type: TypeStatus.NUMERIC,
            dimension: DimensionStatus.SINGLE,
            random: StochasticStatus.DETERMINISTIC,
            value: gender=== 'Male' ? waist : waist+14
        }
    }
}

interface FormUpdaterInitializers {
    [key: string]: (ancestors: string[], ageFrom: null | number, ageTo: number) => FormUpdater
}

function packConstructor(classDefinition: any): (ancestors: string[], ageFrom: null | number, ageTo: number) => FormUpdater{
    return (ancestors: string[], ageFrom: null | number, ageTo: number) => new classDefinition(ancestors, ageFrom, ageTo)
}

export const ComputedFactorClasses: FormUpdaterInitializers={
    "SmokeSinceStop": packConstructor(SmokeSinceStop),
    "SmokeDurationCumulative": packConstructor(SmokeDurationCumulative),
    "PhysicalTotal": packConstructor(PhysicalTotal),
    "SmokeCumulative": packConstructor(SmokeCumulative),
    "SmokeTypicalAmount": packConstructor(SmokeTypicalAmount),
    "OralContraceptiveEver": packConstructor(OralContraceptiveEver),
    "OralContraceptiveSinceStop": packConstructor(OralContraceptiveSinceStop),
    "Greens": packConstructor(Greens),
    "WaistMale":packConstructor(WaistMale),
}

