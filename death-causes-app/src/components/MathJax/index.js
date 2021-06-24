/* eslint-disable */

const scriptLoader = require("./scriptLoader");

class MathJaxLoader{

    constructor(script = "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-AMS_CHTML"){
        this.script = script;
        this.scriptLoaded = false;
    }

    //load mathjax script
    loadMathJax(){
        scriptLoader(this.script, () => {this.onScriptLoaded()});  
    }

    onScriptLoaded(){
        this.scriptLoaded = true;
        this.initiateMathJax(this.onLoadCallback, this.onErrorCallback);
    }

    //initiate mathjax (for formula conversion on DOM) use only first time
    //onLoadCallback is called when MathJax script on DOM is executed and formula parsing is done
    //onErrorCallback is called when MathJax fails to parse formulas on DOM
    initiateMathJax(onLoadCallback = null, onErrorCallback = null){

        if(this.scriptLoaded !== true){
            console.log("Loading mathjax...");
            this.onLoadCallback = onLoadCallback;
            this.onErrorCallback = onErrorCallback;
            this.loadMathJax();
            return;
        }

        const options = {
            tex2jax: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath:[['\\[', '\\]']],
                processEscapes: true
            }
        };

        MathJax.Hub.Config(options);

        MathJax.Hub.Register.StartupHook('End', () => {

            MathJax.Hub.processSectionDelay = 0;

            if (onLoadCallback) {
                onLoadCallback();
            }
        });

        MathJax.Hub.Register.MessageHook("Math Processing Error", (message) => {

            console.log(message);
            if (onErrorCallback) {
                onErrorCallback(MathJax, message);
            }
        })
    }

    //use this function to update DOM with MathJax
    update(){
        MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
    }
}

module.exports = MathJaxLoader;
