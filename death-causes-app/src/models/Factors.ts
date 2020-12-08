export interface FactorAnswers {
    [id: string]: number | string | boolean
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

    getFactorsAsStateObject() {
        let stateObject: FactorAnswers = {};
        this.factorList.forEach(element => { return stateObject[element.factorName] = element.getInitialValue() })
        return stateObject;
    }
}

abstract class GeneralFactor<T> {
    factorName: string;
    initialValue: T;

    constructor(factorName: string, initialValue: T) {
        this.factorName = factorName;
        this.initialValue = initialValue;
    }

    getInitialValue(): T {
        return this.initialValue;
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
    constructor(factorName: string, initialValue: string = "") {
        super(factorName, initialValue);
    }
}

export default Factors;