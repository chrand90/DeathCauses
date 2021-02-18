import { FactorAnswers } from "./Factors";
import RelationLinks from "./RelationLinks";
import Worker from './worker';
import {json} from "d3";

const instance = new Worker();


export enum valueStatus {
    CHANGED="Changed",
    UNCHANGED="Unchangged"
}

export enum MissingStatus {
    MISSING="",
    NONMISSING="Not missing"
}

interface ComputationNodeValue { 
    status: valueStatus;
    missing: MissingStatus;
    value: any;
}

export function computeSomething(){
    return json("Relations.json").then( async (dat) => {
        return new Promise( async (resolve) => {
            instance.initializeObject(1, dat);
            const processed = await instance.processData(100000000);
            console.log("processed")
            console.log(processed);
            resolve(processed);
        })
    })

}
