/*
#################################################
SECTION 1: HELPER FUNCTION
To-Dos: 1. calcVizData -> figure out how to use a string input to extract values from an array using dot notation
#################################################
*/
//Data processing functions
function processData(data) {
	var array = {
		countryCode: data.countrycode,
		country: data.country,
		year: deString(data.year),
		incomeClass: data.incomeClass,
		gdp: deString(data.gdppc),
		prodAg: deString(data.prodag),
    prodInd: deString(data.prodind),
    prodServ: deString(data.prodserv)
	}
	return array
}

function processWorldData(data) {
	var array = {
		year: deString(data.year),
		gdp: deString(data.gdp),
		gdpGr: deString(data.gdpGr),
		gdpPc: deString(data.gdpPc)
	}
	return array
}

//Data manipulation functions
function calcVizData(data, startYear, endYear, depVar){
	var uniqueCountries = unique(data.map(function(d) {return d.country;})).sort()
	var tempData = data.filter(function(d) {return (d.year === startYear || d.year === endYear) && !isNaN(d.gdp) && !isNaN(d.prodInd);})
	var array = [];

	uniqueCountries.forEach(function(d) {
		var temp = tempData.filter(function(e) {return e.country === d;})
		if(temp.length === 2) {
			var tempGdpRate = Math.log(temp[1]['gdp']/temp[0]['gdp'])
			var tempXRate = Math.log(temp[1][depVar]/temp[0][depVar])
			array.push({country: d, incomeClass: temp[1].incomeClass, gdpRate: tempGdpRate, xVarRate: tempXRate})
		}
	})
	return array
}
//Convert strings to numbers
function deString(d) {
	if (d==="") {
		return NaN;
	} else {
		return +d;
	}
}

//Create a unique array (use map)
var unique = function(xs) {
  var seen = {}
  return xs.filter(function(x) {
    if (seen[x])
      return
    seen[x] = true
    return x
  })
}
/*
#################################################
SECTION 2: LOADING THE DATA FILES AND PROCESSING THEM
#################################################
*/
d3.queue()
	.defer(d3.csv, "data/allData.csv", processData)
	.defer(d3.csv, "data/worldGDPData.csv", processWorldData)
	.await(ready);

function ready(error, data, worldData){
	draw(data, worldData);
}

function draw(data, worldData){
	var startYear = d3.min(data, function(d) {return d.year;})
	var endYear = d3.max(data, function(d) {return d.year;})
	var data = (calcVizData(data, startYear, endYear, "prodInd"))
	var incomeClass = ["L", "LM", "UM", "H", "Missing"]

	/*
	#################################################
	SECTION 3.1: SETTING UP THE GLOBAL VARIABLES AND DRAWING AREAS FOR THE MAP
	To-Dos: 1. DONE		Update margin convention
	#################################################
	*/
	//Creating the margin convention(source: http://bl.ocks.org/mbostock/3019563)
	var scatterOuterWidth = d3.select('#scatterChart').node().clientWidth,
			scatterOuterHeight = d3.select('#scatterChart').node().clientHeight
			scatterMargin = {top: 2, right: 1, bottom: 20, left: 30},
			scatterPadding = {top: 2, right: 1, bottom: 20, left: 10},
			scatterInnerWidth = scatterOuterWidth - scatterMargin.left - scatterMargin.right,
			scatterInnerHeight = scatterOuterHeight - scatterMargin.top - scatterMargin.bottom,
			scatterWidth = scatterInnerWidth - scatterPadding.left - scatterPadding.right,
			scatterHeight = scatterInnerHeight - scatterPadding.top - scatterPadding.bottom;

	var scatterPlot = d3.select('#scatterChart').append('svg')
			.attr('width', scatterWidth + scatterMargin.top + scatterMargin.bottom)
			.attr('height', scatterHeight + scatterMargin.left + scatterMargin.right)
		.append('g')
			.attr("transform", "translate(" + scatterMargin.left + "," + scatterMargin.top + ")");

	//Setting the scales
	var xScatterScale = d3.scaleLinear()
			.range([0, scatterWidth]);
	var yScatterScale = d3.scaleLinear()
			.range([scatterHeight, 0]);

	//Creating a color array and scale
	var colorArray = ['rgb(234,232,240)','rgb(189,201,225)','rgb(116,169,207)','rgb(43,140,190)','rgb(4,90,141)'];
	var colorScale = d3.scaleOrdinal()
			.domain(incomeClass)
			.range(colorArray);

	/*
	#################################################
	SECTION 3.2: DRAW THE SCATTER PLOT
	To-Dos: 1. Investigate why some of the dots are truncated
					2. Investigate different variable formulations (yearly Y vs panel growth X-Var, yearly Y vs yearly X-Var)
					3. X axis should always intersect at y=0
	#################################################
	*/
	function drawScatter(data) {
		//setting the domains for the x and y scales
		xScatterScale.domain([d3.min(data, function(d){return d.xVarRate;}), d3.max(data, function(d){return d.xVarRate;})])
		yScatterScale.domain([d3.min(data, function(d){return d.gdpRate;}), d3.max(data, function(d){return d.gdpRate;})])
		//Calling the axis
		var xScatterAxis = d3.axisBottom(xScatterScale);
		var yScatterAxis = d3.axisLeft(yScatterScale);

		//drawing the plot
		scatterPlot.selectAll('dots').data(data)
			.enter().append('circle')
				.attr('r', 5)
				.attr('cx', function(d) {return xScatterScale(d.xVarRate);})
				.attr('cy', function(d) {return yScatterScale(d.gdpRate);})
				.attr('fill', function(d) {return colorScale(d.incomeClass);})
				.style('stroke', 'black')
				.style('stroke-width', 0.5)

		scatterPlot.append('g')
				.call(yScatterAxis)
		scatterPlot.append('g')
				.call(xScatterAxis)
				.attr('transform', 'translate(0,'+ (scatterHeight) + ")")
		//cal the regression line
		drawRegressLine(data)
	}
	/*
	#################################################
	SECTION 3.3: DRAW THE REGRESSION LINE
	To-Dos: 1. DONE		Figure out why the css class is not being applied to the line
					2.
	#################################################
	*/

	function drawRegressLine(data){
		//Calling the d3 line function
		var line = d3.line()
			.x(function(d) { return xScatterScale(d.xVarRate); })
			.y(function(d) { return yScatterScale(d.gdpRate); });

		// Derive a linear regression using the simple stats library
	  var regression = ss.linearRegression(data.map(function(d) {
	    return [d.xVarRate, d.gdpRate];
	  }));
		//function that maps x values to y
	  var regLineCreater = ss.linearRegressionLine(regression);
		// Create a line based on the beginning and endpoints of the range
	  var regLineData = xScatterScale.domain().map(function(x) {
			return {
	      xVarRate: x,
	      gdpRate: regLineCreater(+x)
	    };
	  });

		// regLine(regLineData)
		scatterPlot.append("path")
			.datum(regLineData)
			.attr("class", "regLine")
      .attr("d", line);

	}

	drawScatter(data)

	/*
	#################################################
	SECTION 3.3: CREATE A TWO HANDLE BRUSH WITH GLOBAL GDP DATA
	To-Dos: 1. DONE		Figure out why the css class is not being applied to the line
					2. Add data to the brush
					3. Show years on top of the brush handles and only show first and last on the axis
					4. Add Brush Handles
	#################################################
	*/
	console.log(worldData, startYear, endYear)
	var dataBrush = d3.range(800).map(Math.random);
	var brushOuterWidth = d3.select('#brushDiv').node().clientWidth,
			brushOuterHeight = d3.select('#brushDiv').node().clientHeight
			brushMargin = {top: 2, right: 10, bottom: 20, left: 2},
			brushPadding = {top: 2, right: 2, bottom: 2, left: 2},
			brushInnerWidth = brushOuterWidth - brushMargin.left - brushMargin.right,
			brushInnerHeight = brushOuterHeight - brushMargin.top - brushMargin.bottom,
			brushWidth = brushInnerWidth - brushPadding.left - brushPadding.right,
			brushHeight = brushInnerHeight - brushPadding.top - brushPadding.bottom;

	var brushSvg = d3.select('#brushDiv').append('svg')
			.attr('width', brushOuterWidth)
			.attr('height', brushOuterHeight)
		.append('g')
			.attr("transform", "translate(" + brushMargin.left + "," + brushMargin.top + ")");

	var xBrushScale = d3.scaleTime()
	    .domain([new Date(startYear, 1, 1), new Date(endYear, 1, 1)])
	    .rangeRound([0, brushWidth]);

	var brush = d3.brushX()
	    .extent([[0, 0], [brushWidth, brushHeight]])
			.handleSize([5])
	    .on("end", brushended);

	brushSvg.append("g")
	    .attr("class", "axis axis--grid")
	    .attr("transform", "translate(0," + brushHeight + ")")
	    .call(d3.axisBottom(xBrushScale)
	        .ticks(d3.timeYear, 0.5)
	        .tickSize(-brushHeight)
	        .tickFormat(function() { return null; }))
	  .selectAll(".tick")
	    .classed("tick--minor", function(d) { return d.getMonths(); });

	brushSvg.append("g")
	    .attr("class", "axis axis--x")
	    .attr("transform", "translate(0," + brushHeight + ")")
	    .call(d3.axisBottom(xBrushScale)
	        .ticks(d3.timeYear)
	        .tickPadding(0))
	    .attr("text-anchor", null)
	  .selectAll("text")
	    .attr("x", -22);

	brushSvg.append("g")
	    .attr("class", "brush")
	    .call(brush);
			// console.log(d3.event.selection.map(xBrushScale.invert))
	function brushended() {
	  if (!d3.event.sourceEvent) return; // Only transition after input.
	  if (!d3.event.selection) return; // Ignore empty selections.
	  var domain0 = d3.event.selection.map(xBrushScale.invert),
	      domain1 = domain0.map(d3.timeYear.round);

	  // If empty when rounded, use floor & ceil instead.
	  if (domain1[0] >= domain1[1]) {
	    domain1[0] = d3.timeDay.floor(domain0[0]);
	    domain1[1] = d3.timeDay.ceil(domain0[1]);
		}
		console.log(domain1)
		d3.select(this)
    	.transition()
      	.call(brush.move, domain1.map(xBrushScale));
	}


	// var xBrushScale = d3.scaleLinear()
	//     .range([0, brushWidth]);
	//
	// var yBrushScale = d3.randomNormal(brushHeight / 2, brushHeight / 8);
	//
	// var brush = d3.brush()
	//     .extent([[0, 0], [width, height]])
	//     .extent([.3, .5])
	//     .on("brushstart", brushstart)
	//     .on("brush", brushmove)
	//     .on("brushend", brushend);
	//
	// 		d3.brushX()
	//
	// 		    .on("end", brushended);
	//
	// var arc = d3.svg.arc()
	//     .outerRadius(brushHeight / 2)
	//     .startAngle(0)
	//     .endAngle(function(d, i) { return i ? -Math.PI : Math.PI; });
	//
	// brushSvg.append("g")
	//     .attr("class", "x axis")
	//     .attr("transform", "translate(0," + brushHeight + ")")
	//     .call(d3.svg.axis().scale(xBrushScale).orient("bottom"));
	//
	// var circle = brushSvg.append("g").selectAll("circle")
	//     .data(dataBrush)
	//   .enter().append("circle")
	//     .attr("transform", function(d) { return "translate(" + x(d) + "," + y() + ")"; })
	//     .attr("r", 3);
	//
	// var brushg = brushSvg.append("g")
	//     .attr("class", "brush")
	//     .call(brush);
	//
	// brushg.selectAll(".resize").append("path")
	//     .attr("transform", "translate(0," +  brushHeight / 2 + ")")
	//     .attr("d", arc);
	//
	// brushg.selectAll("rect")
	//     .attr("height", brushHeight);
	//
	// brushstart();
	// brushmove();
	// function brushstart() {
	//   svg.classed("selecting", true);
	// }
	//
	// function brushmove() {
	//   var s = brush.extent();
	//   circle.classed("selected", function(d) { return s[0] <= d && d <= s[1]; });
	// }
	//
	// function brushend() {
	//   svg.classed("selecting", !d3.event.target.empty());
	// }
	/*
	#################################################
	SECTION 3.4: CREATE THE SMOOTH SLIDER http://bl.ocks.org/mbostock/6499018
	To-Dos: 1. DONE		Figure out why the margin convention is not working
					2.
	#################################################


	//Creating the margin convention(source: http://bl.ocks.org/mbostock/3019563)
	var sliderOuterWidth = d3.select('#sliderDiv').node().clientWidth,
			sliderOuterHeight = d3.select('#sliderDiv').node().clientHeight
			sliderMargin = {top: 2, right: 15, bottom: 2, left: 10},
			sliderPadding = {top: 2, right: 15, bottom: 2, left: 10},
			sliderInnerWidth = sliderOuterWidth - sliderMargin.left - sliderMargin.right,
			sliderInnerHeight = sliderOuterHeight - sliderMargin.top - sliderMargin.bottom,
			sliderWidth = sliderInnerWidth - sliderPadding.left - sliderPadding.right,
			sliderHeight = sliderInnerHeight - sliderPadding.top - sliderPadding.bottom;

// console.log(d3.select('#sliderDiv').node().clientWidth, sliderContainerSize)
	var sliderSvg = d3.select('#sliderDiv').append('svg')
			.attr('width', sliderOuterWidth)
			.attr('height', sliderOuterHeight)
		.append('g')
			.attr("transform", "translate(" + sliderMargin.left + "," + sliderMargin.top + ")");

	var sliderScale = d3.scaleLinear()
	    .domain([0, 180])
	    .range([0, sliderWidth])
	    .clamp(true);

	var slider = sliderSvg.append("g")
	    .attr("class", "slider")
	    .attr("transform", "translate(0," + sliderHeight / 3 + ")");

	slider.append("line")
	    .attr("class", "track")
	    .attr("x1", sliderScale.range()[0])
	    .attr("x2", sliderScale.range()[1])
	  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
	    .attr("class", "track-inset")
	  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
	    .attr("class", "track-overlay")
	    .call(d3.drag()
	        .on("start.interrupt", function() { slider.interrupt(); })
	        .on("start drag", function() { console.log(d3.event.x); handle.attr("cx", sliderScale(hueActual)); }));

	slider.insert("g", ".track-overlay")
	    .attr("class", "ticks")
	    .attr("transform", "translate(0," + 18 + ")")
	  .selectAll("text")
	  .data(sliderScale.ticks(10))
	  .enter().append("text")
	    .attr("x", sliderScale)
	    .attr("text-anchor", "middle")
	    .text(function(d) { return d + "°"; });

	var handle = slider.insert("circle", ".track-overlay")
	    .attr("class", "handle")
	    .attr("r", 9);

*/

}
