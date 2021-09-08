import React from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Button from "react-bootstrap/Button";
import Popover from "react-bootstrap/Popover";

export default class DataPrivacyBox extends React.PureComponent {
  helpBox() {
    return (
      <Popover id="popover-basic">
        <Popover.Title as="h3">Privacy</Popover.Title>
        <Popover.Content>{
            this.getPrivacyText()
        }</Popover.Content>
      </Popover>
    );
  }

  getPrivacyText(){
      return "The answers to the questions are not saved or sent anywhere. Refreshing the page will erase the answers."
  }

  render() {
    return (
      <OverlayTrigger
        trigger="click"
        rootClose={true}
        placement={"bottom"}
        overlay={this.helpBox()}
      >
        <Button variant="link" className="text-link-button">
          (Privacy)
        </Button>
      </OverlayTrigger>
    );
  }
}
