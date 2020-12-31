import React from "react";
import { OverlayTrigger } from "react-bootstrap";
import { Tooltip } from "react-bootstrap";
import { Button } from "react-bootstrap";

export interface UnitPickerProps {
  options: string[];
  onChoice: (newUnitName:string) => void; //satser på at det går.
  size: string;
}

class UnitPicker extends React.PureComponent<UnitPickerProps> {
  chosenValue: string;
  constructor(props: UnitPickerProps) {
    super(props);
    this.chosenValue=this.props.options[0];
    this.handleToggleUnit=this.handleToggleUnit.bind(this);
  }

  handleToggleUnit(){
    const i = this.props.options.indexOf(this.chosenValue)
    if(i===this.props.options.length-1){
      this.chosenValue=this.props.options[0]
    }
    else{
      this.chosenValue=this.props.options[i+1]
    }
    this.props.onChoice(this.chosenValue);
  }

  renderToolTips(injected:any):React.ReactNode{
    return( <Tooltip id="button-tooltip" {...injected}>
    Change unit
  </Tooltip>)
  }


  render() {

    

    return (
      <OverlayTrigger
        placement="bottom"
        delay={{ show: 450, hide: 100 }}
        overlay={this.renderToolTips}
      >
      <Button
        variant="link"
        style={{
          marginTop: "0px",
          marginLeft: "0px",
          marginRight: "0px",
          marginBottom: "4px",
          padding: "0px",
          fontSize: this.props.size,
        }}
        onClick={this.handleToggleUnit}
      >
        {" ("}{this.props.children})
      </Button>
      </OverlayTrigger>
    );
  }
}

export default UnitPicker;
