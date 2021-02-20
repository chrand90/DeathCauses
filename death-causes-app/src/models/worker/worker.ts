
import { FactorAnswers } from "../Factors";
import RelationLinks, {RelationLinkJson} from "../RelationLinks";
import ComputeController from "../updateFormNodes/UpdateFormController";

class computations {
    computer: ComputeController | null;

    constructor(){
        this.computer=null;
    }

    initialize(json:RelationLinkJson){
        const rlinks=new RelationLinks(json);
        this.computer=new ComputeController(rlinks, null);
    }

    processData(data: FactorAnswers){
        return this.computer?.compute(data)
    }

}

let c= new computations();

export function processData(data:FactorAnswers){
    return c.processData(data)
}

export function initializeObject(json: RelationLinkJson){
    c.initialize(json);
}