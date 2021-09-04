import React from "react";
import { Container, Spinner } from "react-bootstrap";
import { withRouter, RouteComponentProps } from "react-router";
import './AboutPage.css'
import { hideAllToolTips } from "./components/Helpers";
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

function replacerFunction(match: string, p1: string):string{
  let urlStart='';
  if(process.env.NODE_ENV === "development"){
    urlStart+="http://localhost:5000"
  }
  else{
    urlStart+=""
  }
  const replacer=urlStart+"/api/figures/"
  return `<img src="${replacer}${p1}" loading="lazy"`
}

function replaceLinks(s:string):string{
  return s.replaceAll(/<img src=\"([^ ]*)\"/g, replacerFunction)
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
        let urlStart=""
        if(process.env.NODE_ENV === "development"){
          urlStart+="http://localhost:5000"
        }
        else{
          urlStart+=""
        }
        const link=urlStart+"/api/model/"+this.props.match.params.subpage
        fetch(link).then((response) => {
            if(!response.ok){
              console.error("throwing error from react frontend handler")
              console.error(response.statusText)
              throw response.statusText;
            }
            return response.text();
          }).then(d => {
            this.setState({template: {__html: replaceLinks(d)}, status: LoadingStatus.READY},
                () => {
                    cb();
                    this.hashLinkScroll()
                    this.replaceLinks()
                });
        }).catch( () =>
          this.setState({template: {__html: `<h3>404: Resource not found</h3><p>Requested URL: ${link}</p>`}, status: LoadingStatus.READY})
        );
      }

      hashLinkScroll() {
        const { hash } = window.location;
        if (hash !== '') {
          setTimeout(() => {
            const id = hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) element.scrollIntoView();
          }, 250);  //giving it a small chance to perhaps finish the loading of mathjax such that it guesses the height correctly.
        }
      }

      replaceLinks(){
          //push internal links (but not redirects)
        document.querySelectorAll("#aboutpage a:not(a[href^='#']):not(a[href*=':/'])").forEach(node => {
            node.addEventListener('click', (e: any) => {
              e.preventDefault();
              if(e!==null){
                  if(e.target!==null && "href" in e.target){
                    let path=e.target.href
                    let extracted=path.match(new RegExp(linkExtraction))[0]
                    this.props.history.push(extracted)
                  }
              }
            });
          })
          //open external links on a new page per default as to not erase data.
          document.querySelectorAll("#aboutpage a[href*=':/']").forEach(node => {
            node.addEventListener('click', (e: any) => {
              e.preventDefault();
              if(e!==null){
                  if(e.target!==null && "href" in e.target){
                    let path=e.target.href
                    window.open(path);
                  }
              }
            });
          })
      }
    
      componentDidMount() {
        hideAllToolTips()
        this.state.mathjax.initiateMathJax(() => this.updateTemplate()); 
      }
    
      componentDidUpdate(prevProps:AboutPageProps) {
          const reg= new RegExp(linkExtractionWithoutAnchor)
          const oldLink=prevProps.match.params.subpage.match(reg)
          const newLink=this.props.match.params.subpage.match(reg)
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