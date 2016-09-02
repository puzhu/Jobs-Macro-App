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
	.await(ready);

function ready(error, data){
	draw(data);
}

function draw(data){
	var data = (calcVizData(data, 2001, 2014, "prodInd"))
	var incomeClass = ["L", "LM", "UM", "H", "Missing"]

	/*
	#################################################
	SECTION 3.1: SETTING UP THE GLOBAL VARIABLES AND DRAWING AREAS FOR THE MAP
	To-Dos: 1.
	#################################################
	*/
	//Creating the margin convention(source: http://bl.ocks.org/mbostock/3019563)
	var scatterContainerSize = d3.select('#scatterChart').node().getBoundingClientRect(),
			scatterMargin = {top: 10, right: 10, bottom: 40, left: 40},
			scatterWidth = scatterContainerSize.width - scatterMargin.left - scatterMargin.right,
			scatterHeight = scatterContainerSize.height - scatterMargin.top - scatterMargin.bottom;

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


	drawScatter(data)
	/*
	#################################################
	SECTION 3.2: DRAW THE SCATTER PLOT
	To-Dos: 1. Investigate why some of the dots are truncated
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
	}


}
