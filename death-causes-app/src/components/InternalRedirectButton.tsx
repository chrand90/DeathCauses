import React from "react";
import Button from "react-bootstrap/Button";
import { withRouter, RouteComponentProps } from "react-router";
import "./InternalRedirectButton.css";

interface LinkButtonProps extends RouteComponentProps {
    direct: string;
    prefix?: string;
    size?: string; 
}


class InternalRedirectButtonWithoutRouter extends React.Component<LinkButtonProps> {
  constructor(props: LinkButtonProps) {
    super(props);
    this.redirect = this.redirect.bind(this);
  }

  redirect(target: string) {
    if(this.props.prefix){
      this.props.history.push(this.props.prefix+target)
    }
    else{
      this.props.history.push("/model/" + target);
    }
  }

  render(){
    const styleObject= this.props.size ? {fontSize:this.props.size} : {}
    return (
        <Button 
            variant="link" 
            onClick={() => this.redirect(this.props.direct)}
            className="text-link-button"
            style={styleObject}>
            {this.props.children}
          </Button>
    )
  }
}

const InternalRedirectButton = withRouter(InternalRedirectButtonWithoutRouter);
export default InternalRedirectButton;
