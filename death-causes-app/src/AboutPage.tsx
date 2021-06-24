import React from "react";
import { Container, Spinner } from "react-bootstrap";
import { withRouter, RouteComponentProps } from "react-router";
import './AboutPage.css'
import MathJaxLoader from "./components/MathJax";
// var html = require('./resources/intro.nb.html')
// var template = { __html: html }
//const MathJaxLoader = require("./components/MathJax");
const linkExtraction = /\/model\/(.*)/
const linkExtractionWithoutAnchor= /([^#]+)/

enum LoadingStatus {
    LOADING="loading",
    READY="loaded"
}
interface RouterParams {
    subpage: string;
}
interface AboutPageProps extends RouteComponentProps<RouterParams> {}

interface AboutPageStats {
    mathjax: MathJaxLoader;
    template: {__html:string};
    status: LoadingStatus
}
class AboutPageWithoutRouter extends React.Component<AboutPageProps, AboutPageStats> {

    constructor(props: any ){
        super(props);
        const mathjaxLoader = new MathJaxLoader();
        this.state = {
            mathjax: mathjaxLoader,
            template: {__html: ""},
            status: LoadingStatus.LOADING,
        };
      }

      updateTemplate(cb: ()=> void=()=>{}){
        fetch("http://localhost:5000/model/"+this.props.match.params.subpage).then((response) => {
            return response.text();
          }).then(d => {
            this.setState({template: {__html: d}, status: LoadingStatus.READY},
                () => {
                    cb();
                    this.hashLinkScroll()
                    this.replaceLinks()
                });
        });
      }

      hashLinkScroll() {
        const { hash } = window.location;
        if (hash !== '') {
          setTimeout(() => {
            const id = hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) element.scrollIntoView();
          }, 100);  //giving it a small chance to perhaps finish the loading of mathjax such that it guesses the height correctly.
        }
      }

      replaceLinks(){
          //push internal links (but not redirects)
        document.querySelectorAll("#aboutpage a:not(a[href^='#']):not(a[href*=':/'])").forEach(node => {
            console.log("node")
            console.log(node);
            node.addEventListener('click', (e: any) => {
              e.preventDefault();
              if(e!==null){
                  console.log(e);
                  if(e.target!==null && "href" in e.target){
                    let path=e.target.href
                    let extracted=path.match(new RegExp(linkExtraction))[0]
                    console.log(extracted)
                    this.props.history.push(extracted)
                  }
              }
            });
          })
          //open external links on a new page per default as to not erase data.
          document.querySelectorAll("#aboutpage a[href*=':/']").forEach(node => {
            console.log("node")
            console.log(node);
            node.addEventListener('click', (e: any) => {
              e.preventDefault();
              if(e!==null){
                  console.log(e);
                  if(e.target!==null && "href" in e.target){
                    let path=e.target.href
                    window.open(path);
                  }
              }
            });
          })
      }
    
      componentDidMount() {
        this.state.mathjax.initiateMathJax(() => this.updateTemplate()); 
        ;
      }
    
      componentDidUpdate(prevProps:AboutPageProps) {
          const reg= new RegExp(linkExtractionWithoutAnchor)
          const oldLink=prevProps.match.params.subpage.match(reg)
          const newLink=this.props.match.params.subpage.match(reg)
          console.log(prevProps.match.params)
          console.log(oldLink)
          console.log(this.props.match.params)
          console.log(newLink)
          if(oldLink && newLink && oldLink[0]!==newLink[0]){
            this.setState({status: LoadingStatus.LOADING}, 
                () => {
                    this.updateTemplate(() => this.state.mathjax.update())
                })
          }
          else{
            this.state.mathjax.update();
          }
      }
    
    render() {
        return (
            <Container>
                {this.state.status===LoadingStatus.LOADING ? <Spinner animation="border"></Spinner> :
                    <div id="aboutpage">
                        <span dangerouslySetInnerHTML={this.state.template} />
                    </div>}
            </Container>
        )
    }
} 

const AboutPage = withRouter(AboutPageWithoutRouter);
export default AboutPage;