
import RelationLinks, {RelationLinkJson} from "../RelationLinks";

class computations {
    value: number;
    rlinks: RelationLinks | null;
    constructor(){
        this.value=0;
        this.rlinks=null;
    }

    initialize(value: number, json:RelationLinkJson){
        this.value=value;
        this.rlinks=new RelationLinks(json);
    }

    processData(data: number){
        let res=0
        let coefficient=this.value
        for(let i=0; i<data; i++){
            res=res+1/((1+i)**coefficient)
        }
        return (res+this.rlinks!.superDescendantCount["BMI"]).toString();
    }

}

let c= new computations();

export function processData(data:number){
    return c.processData(data)
}

export function initializeObject(value: number, json: RelationLinkJson){
    c.initialize(value, json);
}