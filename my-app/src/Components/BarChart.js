import * as d3 from 'd3'
import make_squares from './ComputationEngine';

const MARGIN = { TOP: 2, BOTTOM: 2, LEFT: 10, RIGHT: 10 }
const WIDTH = 800 - MARGIN.LEFT - MARGIN.RIGHT;
const HEIGHT = 100 - MARGIN.TOP - MARGIN.BOTTOM;
const TEST_DATA= [{name: 'Corona',total_prob:0.15, inner_causes:{partying:0.45}},
{name:'Old age', total_prob:0.85, inner_causes:{}}];
const CAUSE_COLORS={'Unexplained':"#FFFFFF",
'partying':'#FF6C00'};


export default class BarChart {
	constructor(element, database) {
		const vis = this
		vis.database= database

		vis.svg = d3.select(element)
			.append("svg")
				.attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
				.attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM)
			.append("g")
				.attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`)


		vis.update();
	}

	update() {
		const vis = this;
		vis.data = TEST_DATA; //(gender === "men") ? vis.menData : vis.womenData;
		vis.data.sort(function(a, b) {
			return d3.descending(a.total_prob, b.total_prob)
		})
		const prepared_data=make_squares(vis.data);
		vis.data=prepared_data;

		const x = d3.scaleLinear()
			.domain([
				0, 
				d3.max(vis.data, d =>  d.x)
			])
			.range([0,WIDTH])

		const y = d3.scaleBand()
			.domain(vis.data.map(d => d.name))
			.range([0, HEIGHT])
			.padding(0.2)

		let n= prepared_data.map(element => element.x)
		console.log(n);
		
		//DATA JOIN
		const rects = vis.svg.selectAll("rect")
			.data(vis.data)

		// EXIT
		rects.exit().remove()
			//.transition().duration(500)
			//	.attr("height", 0)
			//	.attr("y", HEIGHT)
				

		// UPDATE
		rects.transition().duration(500)
			.attr("y", d => y(d.name))
			.attr("x", d => y(d.x0))
			.attr("width", d => x(d.x)-x(d.x0))
			.attr("height", d => y.bandwidth)

		// ENTER
		rects.enter().append("rect")
			.attr("y", d => y(d.name))
			.attr("x", d => x(d.x0))
			.attr('height', y.bandwidth)
			.attr("width", d => x(d.x)-x(d.x0))
			.attr("fill", d => CAUSE_COLORS[d.cause])
			.attr('stroke', '#2378ae')
			//.on("mouseover", function() { tooltip.style("display", null); })
			//.on("mouseout", function() { tooltip.style("display", "none"); })
			//.on("mousemove", function(d) {
			//	var xPosition = d3.mouse(this)[0] - 15;
			//	var yPosition = d3.mouse(this)[1] - 25;
			//	tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
			//	tooltip.select("text").text(d.cause);
			//});
			//.transition().duration(500)
				//.attr("height", d => HEIGHT - y(d.total_prob))
				//.attr("y", d => y(d.height)) */

			
	}
}