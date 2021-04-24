import React from "react";
import Collapse from "react-bootstrap/Collapse";
import Button from "react-bootstrap/Button";
import "./AdvancedOptions.css";

export interface AdvancedOptions {
    ageFrom: number | null;
    ageTo: number
}

interface AdvancedOptionsProps {
    updateAdvancedOptions: (op: AdvancedOptions) => void;
    optionsSubmitted: AdvancedOptions;
}

interface AdvancedOptionsStates {
    options: AdvancedOptions;
    open: boolean;
}


export default class AdvancedOptionsMenu extends React.PureComponent<AdvancedOptionsProps, AdvancedOptionsStates>{

    constructor(props: AdvancedOptionsProps){
        super(props);
        this.state = {
            options: props.optionsSubmitted,
            open: false
        };
    }


    



    render() {
        return (
            <div style={{paddingRight:"20px", paddingLeft:"20px", marginBottom:"20px"}}> 
                 <Button onClick={() => this.setState({open: !this.state.open})} variant='link' className="collapsebutton">
                {this.state.open ? "\u25BC" : "\u25B6"} Advanced Options
            </Button>
            <Collapse in={this.state.open} >
            <div className="bordereddiv">
              Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus
              terry richardson ad squid. Nihil anim keffiyeh helvetica, craft beer
              labore wes anderson cred nesciunt sapiente ea proident.
            </div>
          </Collapse>
          </div>
        )  
           
    }
}