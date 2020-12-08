export interface StateObject {
    [id: string]: number|string|boolean
}

class Factors {
    factorList: GeneralFactor<string | number | boolean>[] = []

    constructor(data: d3.DSVRowArray<string>) {
        data.forEach(
            element => {
                switch (element.factorType) {
                    case 'number': {
                        this.factorList.push(new NumericFactorPermanent(element.factorName as string))
                        break;
                    }
                    case 'boolean': {
                        this.factorList.push(new BooleanFactorPermanent(element.factorName as string))
                        break;
                    }
                    case 'string': {
                        this.factorList.push(new StringFactorPermanent(element.factorName as string))
                        break;
                    }
                    default:
                        break;
                }
            }
        )
    }

    setFactorValue(factorName: string, value: string | number | boolean): void {
        let factor = this.factorList.find(element => { return element.factorName === factorName });
        if (!factor) {
            throw console.error("Factor: " + factorName + " was not found in Factor database");
        }
        factor.setValue(value);
    }

    getFactorsAsStateObject() {
        let stateObject: StateObject = {};
        this.factorList.forEach(element => { return stateObject[element.factorName] = element.getValue()})
        return stateObject;
    }
    // bmi: number = 0;
    // age: number = 0;
    // waist: number = 0;
    // caffeine: number = 0; // kop kaffe; svarende til XYZ [mg koffein / dag]. Eventuelt hover over box med typiske koffein indhold i forskellige kaffetyper.
    // fish: number = 0; // [g fisk/uge]
    // vegetables: number = 0;
    // fluids: number = 0;
    // headTrauma: number = 0;
    // drinking: number = 0;
    // gender: string = "";
    // oralContraceptiveTypicalAmmount: number = 0;
    // oralContraceptiveSinceStop: number = 0;
    // physicalActivityTotal: number = 0;
    // physicalActivityHard: number = 0;
    // redMeat: number = 0;
    // hCVHistory: number = 0;
    // iIVHistory: number = 0;
    // diabetes: boolean = false;
    // smokeSinceStop: number = 0; // afhænger af smokeIntensity. Tidsperiode i år.
    // smokeTypicalAmmount: number = 0; // [smøger / dag] mens man røg
    // smokeIntensity: number = 0; // nuværende forbrug af røg [smøger/dag]
    // SmokeCumulative: number = 0; // pack years. 1 pakke per dag i et år = 1 pack year. eventuelt erstart med smokeStart. 
    // indoorTanning: number = 0;
    // race: string = "";
    // maxDrinking: number = 0;
    // greens: number = 0;
    // familyHistoryParkinson: boolean = false;
    // pesticideExposureDays: number = 0;
    // depression: boolean = false;

}

abstract class GeneralFactor<T> {
    factorName: string;
    value: T;

    constructor(factorName: string, initialValue: T) {
        this.factorName = factorName;
        this.value = initialValue;
    }

    public getValue(): T {
        return this.value;
    }

    public setValue(value: T): void {
        this.value = value
    }
}

class NumericFactorPermanent extends GeneralFactor<number> {
    constructor(factorName: string) {
        super(factorName, 0);
    }
}

class BooleanFactorPermanent extends GeneralFactor<boolean> {
    constructor(factorName: string) {
        super(factorName, false);
    }
}

class StringFactorPermanent extends GeneralFactor<string> {
    constructor(factorName: string) {
        super(factorName, "");
    }
}

export default Factors;