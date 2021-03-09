import * as d3 from "d3";
import { SurvivalCurveData } from '../Calculations/SurvivalCurveData';
import d3Tip from "d3-tip";
import "./BarPlot.css"

export interface data {
    Country: string,
    Value: number;
}

export class BarPlot {
    margin = { top: 50, right: 20, bottom: 50, left: 70 };
    width = 800 - this.margin.left - this.margin.right;
    height = 600 - this.margin.top - this.margin.bottom;

    colors = { barFill: "#69b3a2", barHighlight: "#9e1986" };
    formatter = d3.format(".3p")
    svg: d3.Selection<any,unknown,null,undefined>

    constructor(element: SVGSVGElement | null, data: SurvivalCurveData[]) {
        this.svg = d3.select(element!).attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")").selection();
        this.createChart(data)
    }

    clear(){
		d3.select('svg').remove();
	}
    
    createChart(data: SurvivalCurveData[]) {
        this.setTitleAndLabels();
    
        var x = d3
          .scaleBand()
          .range([0, this.width])
          .padding(0.2)
          .domain(data.map((element) => element.age.toString()));
    
        var xAxis = this.svg
          .append("g")
          .attr("class", "xAxis")
          .attr("transform", "translate(0," + this.height + ")")
          .style("font-size", "14px")
          .call(
            d3.axisBottom(x).tickValues(
              x.domain().filter(function (d: any, i: any) {
                return !(+d % 5);
              })
            )
          );
    
        var y = d3.scaleLinear().range([this.height, 0]).domain([0, 1]);
        var yAxis = this.svg
          .append("g")
          .attr("class", "yXxis")
          .style("font-size", "14px")
          .call(d3.axisLeft(y));
    
        var u = this.svg
          .selectAll<SVGRectElement, SurvivalCurveData[]>("rect")
          .data(data);
    
        u.enter()
          .append("rect")
          .attr("x", function (d: SurvivalCurveData, i) {
            return x(d.age.toString()) as number;
          })
          .attr("width", x.bandwidth())
          .attr("height", (d: any) => {
            return this.height - y(0);
          })
          .attr("y", function (d, i) {
            return y(0);
          })
          .attr("fill", this.colors.barFill)
          .transition()
          .duration(700)
          .attr("y", function (d, i) {
            return y(d.prob);
          })
          .attr("height", (d: any) => {
            return this.height - y(d.prob);
          })
          .delay(function (d, i) {
            return i * 5;
          });
    
          this.setMouseOverTips(data);
      };
    
      updateChart(data: SurvivalCurveData[]) {
    
        var u = this.svg
          .selectAll<SVGRectElement, SurvivalCurveData[]>("rect")
          .data(data);
    
        var x = d3
          .scaleBand()
          .range([0, this.width])
          .padding(0.2)
          .domain(data.map((element) => element.age.toString()));
    
        var y = d3.scaleLinear().domain([0, 1]).range([this.height, 0]);
    
        this.updateXAxis(x);
    
        u.join(
          (enter: any) => {
            return enter
              .append("rect")
              .attr("x", (d: any, i: any) => {
                return this.width;
              })
              .attr("width", x.bandwidth())
              .attr("height", (d: any) => {
                return this.height - y(0);
              })
              .attr("y", function (d: any, i: any) {
                return y(0);
              })
              .attr("fill", this.colors.barFill)
              .transition()
              .selection();
          },
          (update: any) => {
            return update;
          },
          (exit: any) => {
            return exit.remove().selection();
          }
        )
          .transition()
          .duration(700)
          .attr("x", function (d, i) {
            return x(d.age.toString()) as number;
          })
          .attr("y", function (d, i) {
            return y(d.prob);
          })
          .attr("width", x.bandwidth())
          .attr("height", (d: any) => {
            return this.height - y(d.prob);
          });
        // .attr("fill", "#9e1986")
    
        this.setMouseOverTips(data);
      };
    
      updateXAxis(x: any) {
        d3.select<any, any>("g.xAxis").call(
          d3.axisBottom(x).tickValues(
            x.domain().filter(function (d: any, i: any) {
              return !(+d % 5);
            })
          )
        );
      };
    
      setMouseOverTips(data: SurvivalCurveData[]) {
        d3.select(".d3-tip").remove();
    
        let tip = d3Tip()
          .attr("class", "d3-tip")
          .offset([-10, 0])
          .html((d: SurvivalCurveData) => {
            return (
              "Probability: <strong>" + this.formatter(d.prob) +  "</strong><br/>" +
              "of surviving past: <strong>" + d.age + "</strong>"
            );
          });
    
        d3.select("g").call(tip);
        
        let colors = this.colors 

        d3.selectAll("rect")
          .data(data)
          .on("mouseenter", function (e: Event, d: SurvivalCurveData) {
            d3.selectAll(".d3-tip")
              .style("background-color", "9cc986")
              .style("opacity", 1);
            tip.show(d, this);
            d3.select(this).raise().style("fill", colors.barHighlight);
          })
          .on("mouseleave", function (e: Event, d: SurvivalCurveData) {
            tip.hide(d, this);
            d3.select(this).style("fill", colors.barFill);
          });
      };
    
      setTitleAndLabels(){
    
        this.svg
          .append("text")
          .attr("x", this.width / 2)
          .attr("y", -this.margin.top / 2)
          .text("Probability of surviving each year")
          .style("font-size", "20px")
          .attr("font-weight", 700)
          .attr("text-anchor", "middle");
    
          this.svg
          .append("text")
          .attr("transform", "translate(" + this.width / 2 + " ," + (this.height + 40) + ")")
          .style("text-anchor", "middle")
          .text("Age")
          .style("font-size", "16px")
          .attr("font-weight", 700);
    
          this.svg
          .append("text")
          .attr("transform", "translate(" + -40 + "," + this.height / 2 + ")rotate(-90)")
          .style("text-anchor", "middle")
          .text("Probability")
          .style("font-size", "16px")
          .attr("font-weight", 700);
      };
    
 
}