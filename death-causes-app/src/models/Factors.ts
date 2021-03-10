import GeneralFactor, {DeriveMapping, DerivableOptions, FactorTypes, InputValidity} from "./FactorAbstract";
import NumericFactorPermanent from "./FactorNumber";
import StringFactorPermanent from "./FactorString";
import InputJson from "./FactorJsonInput";
import RelationLinks from './RelationLinks';

export interface FactorAnswers {
  [id: string]: string | number;
}

export interface FactorAnswerUnitScaling {
  unitName: string;
  scale: number;
}
export interface FactorAnswerUnitScalings {
  [id: string]: FactorAnswerUnitScaling;
}

interface FactorMaskingsWithNulls {
  [maskedFactor: string]: FactorMasking | null;
}

export interface FactorList {
  [key: string]: GeneralFactor;
}

interface FactorMasking {
  effectiveValue: string | number;
  maskedByFactor: string;
  maskedByValue: string | number;
}
export interface FactorMaskings {
  [maskedFactor: string]: FactorMasking;
}

interface DerivableParentsChain {
  [factorname: string]: string[];
}

interface DescendantCountsInDeriveGroups {
  [factorname: string]: number;
}

interface DerivableOptionsSet {
  [causedFactor: string]: DerivableOptions;
}

function reverseDeriveMapping(dos: DerivableOptionsSet) {
  let res: DerivableOptionsSet = {};
  let inner: DeriveMapping;
  let middle: DerivableOptions;
  Object.entries(dos).forEach(([causedFactor, dom]) => {
    Object.entries(dom).forEach(([causativeFactor, dm]) => {
      Object.entries(dm).forEach(
        ([causativeFactorValue, causedFactorValue]) => {
          if (!(causativeFactor in res)) {
            inner = {};
            inner[causativeFactorValue] = causedFactorValue;
            middle = {};
            middle[causedFactor] = inner;
            res[causativeFactor] = middle;
          } else if (!(causedFactor in res[causativeFactor])) {
            inner = {};
            inner[causativeFactorValue] = causedFactorValue;
            res[causativeFactor][causedFactor] = inner;
          } else {
            res[causativeFactor][causedFactor][
              causativeFactorValue
            ] = causedFactorValue;
          }
        }
      );
    });
  });
  return res;
}

function filterNullsFromFactorMaskings(fin: FactorMaskingsWithNulls): FactorMaskings {
  let res: FactorMaskings = {};
  Object.entries(fin).forEach(([factorname, maskValue]) => {
    if (maskValue) {
      res[factorname] = maskValue;
    }
  });
  return res;
}

class Factors {
  factorList: FactorList = {};
  reverseDerivables: DerivableOptionsSet = {};

  constructor(data: InputJson | null) {
    this.factorList = {};
    if (data) {
      Object.entries(data).forEach(([factorname, factorobject]) => {
        switch (factorobject.type) {
          case FactorTypes.NUMERIC: {
            this.factorList[factorname] = new NumericFactorPermanent(
              factorname,
              factorobject.initialValue
                ? factorobject.initialValue
                : "",
              factorobject.longExplanation,
              factorobject.placeholder,
              factorobject.requiredDomain ? factorobject.requiredDomain : null,
              factorobject.recommendedDomain
                ? factorobject.recommendedDomain
                : null,
              factorobject.units ? factorobject.units : {},
              factorobject.helpJson ? factorobject.helpJson : null,
              factorobject.derivables ? factorobject.derivables : {}
            );
            break;
          }
          case FactorTypes.STRING: {
            this.factorList[factorname] = new StringFactorPermanent(
              factorname,
              factorobject.initialValue ? factorobject.initialValue : "",
              factorobject.longExplanation,
              factorobject.placeholder,
              factorobject.options ? factorobject.options : [],
              factorobject.helpJson ? factorobject.helpJson : null,
              factorobject.derivables ? factorobject.derivables : {}
            );
            break;
          }
          default:
            break;
        }
      });
    }
    this.initializeReverseDerivables();
  }

  initializeReverseDerivables() {
    let derivables: DerivableOptionsSet = {};
    Object.entries(this.factorList).forEach(([factorname, factorobject]) => {
      derivables[factorname] = factorobject.derivableStates;
    });
    this.reverseDerivables = reverseDeriveMapping(derivables);
  }

  checkFactorAndUpdateFactorMaskings(
    factorToCheck: string,
    factorAnswers: FactorAnswers,
    factorMaskingChanges: FactorMaskingsWithNulls
  ): string[] {
    if (factorToCheck in this.reverseDerivables) {
      //this means that the factor can force changes to other factoranswers.
      let factorValue = factorAnswers[factorToCheck];
      const maskedFactors = this.reverseDerivables[factorToCheck];
      if (
        factorToCheck in factorMaskingChanges &&
        factorMaskingChanges[factorToCheck]
      ) {
        //checking if the factor itself has been forced by another factor.
        factorValue = factorMaskingChanges[factorToCheck]?.effectiveValue!; //putting on exclamation point because we have just tested for null-value
      }
      Object.entries(maskedFactors).forEach(([maskedFactor, maskingObject]) => {
        if (factorValue in maskingObject) {
          factorMaskingChanges[maskedFactor] = {
            effectiveValue: maskingObject[factorValue],
            maskedByFactor: factorToCheck,
            maskedByValue: factorValue,
          };
        } else {
          factorMaskingChanges[maskedFactor] = null;
        }
      });
      return Object.keys(maskedFactors);
    } else {
      return [];
    }
  }

  updateMasked(
    factorAnswers: FactorAnswers,
    changedFactor: string,
    oldMaskedValues: FactorMaskings
  ): FactorMaskings | "nothing changed" {
    if (!(changedFactor in this.reverseDerivables)) {
      return "nothing changed";
    }
    let factorsToCheck: string[] = [changedFactor];
    let factorToCheck: string;
    let factorMaskingChanges: FactorMaskingsWithNulls = {};
    while (factorsToCheck.length > 0) {
      factorToCheck = factorsToCheck.pop()!;
      let newFactorsToCheck = this.checkFactorAndUpdateFactorMaskings(
        factorToCheck,
        factorAnswers,
        factorMaskingChanges
      );
      factorsToCheck = factorsToCheck.concat(newFactorsToCheck);
    }
    const newFactorMaskingsWithNulls: FactorMaskingsWithNulls = {
      ...oldMaskedValues,
      ...factorMaskingChanges,
    };
    return filterNullsFromFactorMaskings(newFactorMaskingsWithNulls);
  }

  initializedFactorAnswers(): FactorAnswers {
    let factorAnswers: FactorAnswers = {};
    Object.keys(this.factorList).forEach((factorname) => {
      factorAnswers[factorname] = "";
    });
    return factorAnswers;
  }

  simulateFactorAnswersAndMaskings() {
    let factorMaskings: FactorMaskings = {};
    let factorAnswers = this.initializedFactorAnswers();
    let factorMaskingCandidate: FactorMaskings | "nothing changed";
    Object.entries(this.factorList).forEach(([factorName, factorobject]) => {
      if (factorName in factorMaskings) {
        factorAnswers[factorName] = String(
          factorMaskings[factorName].effectiveValue
        );
      } else {
        factorAnswers[factorName] = factorobject.simulateValue();
      }
      if (factorobject.factorType === "string") {
        factorMaskingCandidate = this.updateMasked(
          factorAnswers,
          factorName,
          factorMaskings
        );
        if (factorMaskingCandidate !== "nothing changed") {
          factorMaskings = factorMaskingCandidate;
        }
      }
    });
    return { factorAnswers, factorMaskings };
  }

  getRandomFactorOrder() {
    return Object.keys(this.factorList);
  }

  makeParentList(){
    let parentList: DerivableParentsChain={};
    Object.entries(this.factorList).forEach(([factorname, factorobject]) => {
      let causativeFactors= Object.keys(factorobject.derivableStates)
      parentList[factorname]=[factorname]
      while(causativeFactors.length>0){
        let theOneCausativeFactor=causativeFactors[0]
        parentList[factorname].unshift(theOneCausativeFactor);
        causativeFactors=Object.keys(this.factorList[theOneCausativeFactor].derivableStates)
      }
    });
    return parentList
  }

  findMaxDescendants(causativeFactor: string, rdat:RelationLinks):number{
    if(!(causativeFactor in this.reverseDerivables)){
      return rdat.getSuperDescendantCount(causativeFactor);
    }
    else{
      let descendants= Object.keys(this.reverseDerivables[causativeFactor])
      return Math.max(...descendants.map((d: string) => { return this.findMaxDescendants(d, rdat)}));
    }
  }

  getMaxDescendants(rdat: RelationLinks){
    let res: DescendantCountsInDeriveGroups= {}
    Object.keys(this.factorList).forEach((causativeFactor) => {
      res[causativeFactor]=this.findMaxDescendants(causativeFactor, rdat)
    });
    return res
  }

  getSortedOrder(rdat: RelationLinks): string[] {
    const parentList= this.makeParentList()
    const maxDescendants= this.getMaxDescendants(rdat);
    const compare = (factorname1: string, factorname2: string) => {
      let topParent1=parentList[factorname1][0]
      let topParent2=parentList[factorname2][0]
      let count=0
      while(topParent1===topParent2){
        count=count+1
        topParent1=parentList[factorname1][count]
        topParent2=parentList[factorname2][count]
      }
      if(maxDescendants[topParent1]===maxDescendants[topParent2]){
        return topParent1.localeCompare(topParent2);
      }
      else{
        return maxDescendants[topParent2]-maxDescendants[topParent1]
      }
    }
    let factornames=Object.keys(this.factorList)
    const ageIndex= factornames.indexOf("Age")
    if(ageIndex>-1){
      factornames.splice(ageIndex, 1)
      factornames.sort(compare).unshift("Age");
      return factornames
    }
    return factornames.sort(compare) //not sure if ever needed
  }

  getHelpJson(factorname: string): string {
    return this.factorList[factorname].helpJson
      ? (this.factorList[factorname].helpJson as string)
      : "No help available";
  }

  getFactorsAsStateObject() {
    let stateObject: FactorAnswers = {};
    for (let factorName in this.factorList) {
      stateObject[factorName] = this.factorList[factorName].getInitialValue();
    }
    return stateObject;
  }

  getInputValidity(
    name: string,
    value: string | boolean,
    unit?: string
  ): InputValidity {
    return this.factorList[name].checkInput(value, unit);
  }

  getScalingFactor(name: string, unitName: string): number {
    return this.factorList[name].getScalingFactor(unitName);
  }
}

export default Factors;
