/*
#################################################
SECTION 1: HELPER FUNCTIONS
To-Dos: 1. calcVizData -> figure out how to use a string input to extract values from an array using dot notation
#################################################
*/
//Data processing functions
function processAllData(data) {
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

function processAllGrData(data) {
    var array = {
        country: data.country,
        year: deString(data.year),
        incomeClass: data.incomeClass,
        gdp: deString(data.gdpGr),
        prodAg: deString(data.prodagGr),
        prodInd: deString(data.prodindGr),
        prodServ: deString(data.prodservGr)
    }
    return array
}

function processWorldData(data) {
    var array = {
        year: new Date(deString(data.year), 1, 1),
        gdp: deString(data.gdp),
        gdpGr: deString(data.gdpGr),
        gdpPc: deString(data.gdpPc)
    }
    return array
}

//Data manipulation functions
function calcVizAllData(data, startYear, endYear, depVar) {
    var uniqueCountries = unique(data.map(function(d) {
        return d.country;
    })).sort()
    var tempData = data.filter(function(d) {
        return (d.year === startYear || d.year === endYear) && !isNaN(d.gdp) && !isNaN(d[depVar]);
    })
    var array = [];

    uniqueCountries.forEach(function(d) {
        var temp = tempData.filter(function(e) {
            return e.country === d;
        })
        if (temp.length === 2) {
            var tempGdpRate = Math.log(temp[1]['gdp'] / temp[0]['gdp'])
            var tempXRate = Math.log(temp[1][depVar] / temp[0][depVar])
            array.push({
                country: d,
                year: d.year,
                incomeClass: temp[1].incomeClass,
                gdpRate: tempGdpRate,
                xVarRate: tempXRate
            })
        }
    })
    return array
}

function calcVizAllGrData(data, startYear, endYear, depVar){
	var array = [];
	var tempData = data.filter(function(d) {
			return d.year >= startYear && d.year <= endYear && !isNaN(d.gdp) && !isNaN(d[depVar]);
	})
	tempData.forEach(function(d) {
		array.push({
			country: d.country,
      year: d.year,
			incomeClass: d.incomeClass,
			gdpRate: (d.gdp),
			xVarRate: (d[depVar])
		})
	})
	return array;
}

//Convert strings to numbers
function deString(d) {
    if (d === "") {
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

// Creating global variables
var incomeClassKey = {
  'Low Income': "L",
  'Lower Middle Income': 'LM',
  'Upper Middle Income': 'UM',
  'High Income': 'H'
}

/*
#################################################
SECTION 2: LOADING THE DATA FILES AND PROCESSING THEM
#################################################
*/
d3.queue()
    .defer(d3.csv, "data/allGrData.csv", processAllGrData)
    .defer(d3.csv, "data/worldGDPData.csv", processWorldData)
    .await(ready);

function ready(error, data, worldData) {
    draw(data, worldData);
}

function draw(data, worldData) {
    var startYear = d3.min(data, function(d) {
        return d.year;
    })
    var endYear = d3.max(data, function(d) {
        return d.year;
    })
    var data = (calcVizAllGrData(data, startYear, endYear, "prodInd"))

    /*
    #################################################
    SECTION 3.1: SETTING UP THE GLOBAL VARIABLES AND DRAWING AREAS FOR THE MAP
    To-Dos: 1. DONE		Update margin convention
    #################################################
    */
    //Creating the margin convention(source: http://bl.ocks.org/mbostock/3019563)
    var scatterOuterWidth = d3.select('#scatterChart').node().clientWidth,
        scatterOuterHeight = d3.select('#scatterChart').node().clientHeight,
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
        xScatterScale.domain([d3.min(data, function(d) {
            return d.xVarRate;
        }), d3.max(data, function(d) {
            return d.xVarRate;
        })])
        yScatterScale.domain([d3.min(data, function(d) {
            return d.gdpRate;
        }), d3.max(data, function(d) {
            return d.gdpRate;
        })])

        //Calling the axis
        var xScatterAxis = d3.axisBottom(xScatterScale);
        var yScatterAxis = d3.axisLeft(yScatterScale);

        //drawing the plot
        scatterPlot.selectAll('.scatterCircles').data(data)
            .enter().append('circle')
            .attr('r', 5)
            .attr('cx', function(d) {
                return xScatterScale(d.xVarRate);
            })
            .attr('cy', function(d) {
                return yScatterScale(d.gdpRate);
            })
						.attr('class', 'scatterCircles')
            .classed('default', true)


        scatterPlot.append('g')
            .call(yScatterAxis)
        scatterPlot.append('g')
            .call(xScatterAxis)
            .attr('transform', 'translate(0,' + yScatterScale(0) + ")")



    }
    /*
    #################################################
    SECTION 3.3: DRAW THE REGRESSION LINE
    To-Dos: 1. DONE		Figure out why the css class is not being applied to the line
    					2.
    #################################################
    */

    function drawRegressLine(data, id) {
        //Calling the d3 line function
        var line = d3.line()
            .x(function(d) {
                return xScatterScale(d.xVarRate);
            })
            .y(function(d) {
                return yScatterScale(d.gdpRate);
            });

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

        // Creating an id variable for the line
        var classId = id + 'regLine'
        scatterPlot.append('g').append("path")
            .datum(regLineData)
            .attr("class", classId)
            .attr("d", line);

    }
    // Call the scatter plot
    drawScatter(data)
    //call the regression line
    drawRegressLine(data, 'main')
    /*
    #################################################
    SECTION 3.4: CREATE A TWO HANDLE BRUSH WITH GLOBAL GDP DATA
    To-Dos: 1. DONE			Figure out why the css class is not being applied to the line
    					2. DONE			Add data to the brush
    					3. DEL			Show years on top of the brush handles and only show first and last on the axis
    					4. DEL     Add Brush Handles
    					5. DONE			Clean the grid
    					6. Explore the option of swapping world with country gdp variable
							7. Style the chart and brush for brush events
              8. DONE     Draw default chart when the brush is not applied
    #################################################
    */

        //Create the Brush canvas margin system
    var brushOuterWidth = d3.select('#brushDiv').node().clientWidth,
        brushOuterHeight = d3.select('#brushDiv').node().clientHeight,
				brushMargin = {top: 2, right: 10, bottom: 20, left: 40},
        brushPadding = {top: 2, right: 2, bottom: 2, left: 0},
        brushInnerWidth = brushOuterWidth - brushMargin.left - brushMargin.right,
        brushInnerHeight = brushOuterHeight - brushMargin.top - brushMargin.bottom,
        brushWidth = brushInnerWidth - brushPadding.left - brushPadding.right,
        brushHeight = brushInnerHeight - brushPadding.top - brushPadding.bottom;

    var brushSvg = d3.select('#brushDiv').append('svg')
        .attr('width', brushOuterWidth)
        .attr('height', brushOuterHeight)
        .append('g')
        .attr("transform", "translate(" + brushMargin.left + "," + brushMargin.top + ")");

    //Create the X and Y scales
    var xBrushScale = d3.scaleTime()
        .domain([new Date(startYear, 1, 1), new Date(endYear, 1, 1)]) //based on the entire range of the dataset
        .rangeRound([0, brushWidth]);

    var yBrushScale = d3.scaleLinear() //based on the max and min values of the world gdp data
        .domain([d3.min(worldData, function(d) {
            return d.gdpPc
        }), d3.max(worldData, function(d) {
            return d.gdpPc
        })])
        .range([brushHeight, 0])

    //Create the brush
    var brush = d3.brushX()
        .extent([
            [0, 0],
            [brushWidth, brushHeight]
        ])
				.on("end", brushended);

		//Append a grid
    brushSvg.append("g")
        .attr("class", "brushAxis brushAxis--grid")
        .attr("transform", "translate(0," + brushHeight + ")")
        .call(d3.axisBottom(xBrushScale)
            .ticks(d3.timeYear) //sets ticks at one year intervals for the grid
            .tickSize(-brushHeight) //the ticks cover the entire grid
            .tickFormat(function() {
                return null;
            })) //set to null to suppress tick text

    //Append the X and Y axis to the brush svg
    brushSvg.append("g")
        .attr("class", "brushAxis brushAxis--x")
        .attr("transform", "translate(0," + brushHeight + ")")
        .call(d3.axisBottom(xBrushScale)
            .ticks(d3.timeYear)
            .tickPadding(2))
        .attr("text-anchor", null)
        .selectAll("text")
        .attr("x", -22); //offset the tick labels to the left of the ticks

    brushSvg.append('g')
        .attr('class', 'brushAxis brushAxis--y')
        .call(d3.axisLeft(yBrushScale)
            .ticks(3)
            .tickPadding(2))

		//Draw the gdp chart
		var gdpCircle = brushSvg.append('g')
				.selectAll('circle')
				.data(worldData)
				.enter().append('circle')
				.attr('r', 2.5)
				.attr('cx', function(d) {return xBrushScale(d.year)})
				.attr('cy', function(d) {return yBrushScale(d.gdpPc)})
				.attr('fill', 'black')

    //Call the brush on the svg
    brushSvg.append("g")
        .attr("class", "brush")
        .call(brush);

    // Creating date markers outside the brushend function block so that they are available for dropdown events
    var domain1 =[new Date(startYear, 1, 1), new Date(endYear, 1, 1)]
    function brushended() {
        if (!d3.event.sourceEvent) return; // Only transition after input.

        // Keep default styling if selection is empty i.e no brush
        if (!d3.event.selection){
          d3.select('.tempregLine').remove() //remove the previous temp line
          d3.selectAll('.scatterCircles').classed('selected', false).classed('default', true);
          domain1 = [new Date(startYear, 1, 1), new Date(endYear, 1, 1)]; //reset the domain variables
          return; // Ignore empty selections i.e exit
        }
        var domain0 = d3.event.selection.map(xBrushScale.invert)//invert the scale to get the domain value
        domain1 = domain0.map(d3.timeYear.round);

        // If empty when rounded, use floor & ceil instead.
        if (domain1[0] >= domain1[1]) {
            domain1[0] = d3.timeYear.floor(domain0[0]);
            domain1[1] = d3.timeYear.ceil(domain0[1]);
        }

        //implement a smooth transition to year domain
        d3.select(this)
            .transition()
            .call(brush.move, domain1.map(xBrushScale));

        //call the redraw function
        redraw(currentIncome, domain1)

    }

    /*
    #################################################
    SECTION 3.5: RESPOND TO CHANGE IN COUNTRY CATEGORY
    To-Dos: 1.
              2.
    #################################################
    */
    // Creating the current indicator so that it is available for brush events
    var currentIncome = "All Countries";
    d3.select('#incomeDropdown').on('change.line', function(d) {
      var sel = document.getElementById('incomeDropdown'); //selecting the default based on current input
  		currentIncome = sel.options[sel.selectedIndex].value //getting the value of the indicator
      redraw(currentIncome, domain1)
    });

    function redraw(currentIncome, domain1){
      if(currentIncome === "All Countries"){
        // Hide or show scatterCircles based on the start and end year of the brush
        d3.selectAll('.scatterCircles').filter(function(d) { return d.year >= domain1[0].getFullYear() && d.year <= domain1[1].getFullYear()}).classed('default', false).classed('selected', true).attr('fill', 'lightblue');
        d3.selectAll('.scatterCircles').filter(function(d) { return d.year < domain1[0].getFullYear() || d.year > domain1[1].getFullYear()}).classed('selected', false).classed('default', true);

        // Draw a temparory regression line for each brush end event
        var tempRegData = data.filter(function(d) {return d.year >= domain1[0].getFullYear() && d.year <= domain1[1].getFullYear()})
        d3.select('.tempregLine').remove() //remove the previous temp line
        drawRegressLine(tempRegData, 'temp') //draw new temp line
      } else{
        // Hide or show scatterCircles based on the start and end year of the brush
        d3.selectAll('.scatterCircles').filter(function(d) { return d.year >= domain1[0].getFullYear() && d.year <= domain1[1].getFullYear() && d.incomeClass === incomeClassKey[currentIncome]}).classed('default', false).classed('selected', true).attr('fill', 'lightblue')
        d3.selectAll('.scatterCircles').filter(function(d) { return d.year < domain1[0].getFullYear() || d.year > domain1[1].getFullYear() || d.incomeClass != incomeClassKey[currentIncome]} ).classed('selected', false).classed('default', true);

        // Draw a temparory regression line for each brush end event
        var tempRegData = data.filter(function(d) {return d.year >= domain1[0].getFullYear() && d.year <= domain1[1].getFullYear() && d.incomeClass != incomeClassKey[currentIncome]})
        d3.select('.tempregLine').remove() //remove the previous temp line
        drawRegressLine(tempRegData, 'temp') //draw new temp line
      }
    }


}
