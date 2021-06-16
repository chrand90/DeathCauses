import React from "react";
import { Container } from "react-bootstrap";
import './AboutPage.css'
var html = require('./resources/intro.nb.html')
var template = { __html: html }
const MathJaxLoader = require("./components/MathJax");


export class AboutPage extends React.Component<any, any> {

    constructor(props: any ){
        super(props);
        const mathjaxLoader = new MathJaxLoader();
        this.state = {
            mathjax: mathjaxLoader
        };
      }
    
    
      componentDidMount() {
          this.state.mathjax.initiateMathJax(); 
      }
    
      componentDidUpdate() {
          this.state.mathjax.update();
      }
    
    render() {
        return (
            <Container>
                <div>
                    <span dangerouslySetInnerHTML={template} />
                </div>
            </Container>
        )
    }
}