import { ChangeStatus, UpdateDic, UpdateForm, FormUpdater, FormUpdaterDic, TypeStatus, DimensionStatus, StochasticStatus } from "./UpdateFormInitialize"

class SmokeSinceStop extends FormUpdater{

    compute(allPreviousUpdateForms: UpdateDic):UpdateForm{
        const SmokingStopped= this.getNode(allPreviousUpdateForms, "SmokingStopped").value as number;
        const {ageFrom, ageTo, age} = this.getAges(allPreviousUpdateForms);
        const newValue: number[]=[];
        for(let i=0; i<ageTo-ageFrom+1; i++){
            newValue.push(Math.max(0,i+SmokingStopped+(ageFrom-age)));
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
        const SmokingStopped=this.getNode(allPreviousUpdateForms, "SmokingStopped").value as number;
        const SmokingPastAmount=this.getNode(allPreviousUpdateForms, "SmokePastAmount").value as number;
        const SmokeIntensity=this.getNode(allPreviousUpdateForms, "SmokeIntensity").value as number;
        const SmokeDuration=this.getNode(allPreviousUpdateForms, "SmokeDuration").value as number;
        const {ageFrom, ageTo, age} = this.getAges(allPreviousUpdateForms);
        let newValue: number[]=[];
        const pastAverage=SmokeDuration*SmokingPastAmount/(Math.max(1,SmokeDuration))
        for(let i=0; i<ageTo-ageFrom+1; i++){
            if(ageFrom+i<=age){
                if(ageFrom+i<age-SmokingStopped-SmokeDuration){
                    newValue.push(0)
                }
                else{
                    newValue.push(pastAverage)
                }
            }
            else{
                if(SmokeIntensity>0.01){
                    let proportion= SmokeDuration/(SmokeDuration+ageFrom+i-age)
                    newValue.push(proportion*pastAverage+(1-proportion)*SmokeIntensity)
                }
                else{
                    newValue.push(pastAverage);
                }
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
        if(oralStatus==="Current user"){
            const {ageFrom, ageTo, age} = this.getAges(allPreviousUpdateForms);
            let newValue: number[]=[];
            for(let i=0; i<ageTo-ageFrom+1; i++){
                newValue.push(Math.max(0, ageFrom+i-age-oralTillStop))
            }
        }
        if(oralStatus === "Former user"){
            const {ageFrom, ageTo, age} = this.getAges(allPreviousUpdateForms);
            let newValue: number[]=[];
            for(let i=0; i<ageTo-ageFrom+1; i++){
                newValue.push(Math.max(0, ageFrom+i-age+oralStopped))
            }
        }
        return {
            ...this.ChangedAndMissing(),
            type: TypeStatus.NUMERIC,
            dimension: DimensionStatus.YEARLY,
            random: StochasticStatus.DETERMINISTIC,
            value: 0
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
    "PhysicalTotal": packConstructor(PhysicalTotal),
    "SmokeCumulative": packConstructor(SmokeCumulative),
    "SmokeTypicalAmount": packConstructor(SmokeTypicalAmount),
    "OralContraceptiveEver": packConstructor(OralContraceptiveEver),
    "OralContraceptiveSinceStop": packConstructor(OralContraceptiveSinceStop),
}

