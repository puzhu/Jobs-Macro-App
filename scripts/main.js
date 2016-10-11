/*
#################################################
SECTION 1: HELPER FUNCTIONS
To-Dos: 1.
#################################################
*/
        //DATA MANIPULATION HELPERS
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

// Round to decimals
function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}


//get the data filtered based on input parameters
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

//Remove outliers
function removeOutliers(data) {
  var yDeviation = d3.deviation(data, function(d) {return d.gdpRate}) * 2.5;
  var xDeviation = d3.deviation(data, function(d) {return d.xVarRate}) * 2.5;
  return data.filter(function(d) {return d.gdpRate < yDeviation && d.gdpRate > -yDeviation && d.xVarRate < xDeviation && d.xVarRate > -xDeviation})
}

        //MAP CONTROLS TO DATA VARIABLES
// Create global variables to map html inputs to data
var incomeClassKey = {
  'Low Income': "L",
  'Lower Middle Income': 'LM',
  'Upper Middle Income': 'UM',
  'High Income': 'H'
}
var xVarKey = {
  "Total Productivity (per year growth)": "prodTot",
  "Agricultural Productivity (per year growth)": "prodAg",
  "Industrial Productivity (per year growth)": "prodInd",
  "Services Productivity (per year growth)": "prodServ"
}

        //FUNCTIONS TO EXTEND D3 FUNCTIONALITY
// Extend D3 to move elements to the front/background
d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};
d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};

        // DATA PROCESSING FUNCTIONS FOR INITIAL LOAD
// process the country gdp and productivity csv
function processScatterData(data) {
    var array = {
        country: data.country,
        year: deString(data.year),
        incomeClass: data.incomeClass,
        gdp: deString(data.gdpGr),
        prodTot: deString(data.prodTotGr),
        prodAg: deString(data.prodAgGr),
        prodInd: deString(data.prodIndGr),
        prodServ: deString(data.prodServGr),
        empTot: deString(data.empTotGr),
        empAg: deString(data.empAgGr),
        empInd: deString(data.empIndGr),
        empServ: deString(data.empServGr)
    }
    return array
}

// process the world gdp per cap data for the brush
function processBrushData(data) {
    var array = {
        country: data.country,
        year: new Date(deString(data.year), 1, 1),
        gdpPc: deString(data.gdpPerCap)
    }
    return array
}



/*
#################################################
SECTION 2: LOAD THE DATA FILES AND PROCESS THEM
#################################################
*/
d3.queue()
    .defer(d3.csv, "data/allGrData.csv", processScatterData)
    .defer(d3.csv, "data/gdpPerCapData.csv", processBrushData)
    .await(ready);

function ready(error, dataAll, brushData) {
    draw(dataAll, brushData);
}

function draw(dataAll, brushData) {

  /*
  #################################################
  SECTION 3: GET THE DATA READY
  #################################################
  */
  var startYear = d3.min(dataAll, function(d) {
      return d.year;
  })
  var endYear = d3.max(dataAll, function(d) {
      return d.year;
  })
  var selXVar = document.getElementById('xProdDropDown');
  var currentX = xVarKey[selXVar.options[selXVar.selectedIndex].value]
  var data = calcVizAllGrData(dataAll, startYear, endYear, currentX)

  /*
  #################################################
  SECTION 3.1: SETTING UP THE GLOBAL VARIABLES AND DRAWING AREAS FOR THE PPRODUCTIVITY CHART
  To-Dos: 1. DONE		   Update margin convention
  #################################################
  */
  //Creating the margin convention(source: http://bl.ocks.org/mbostock/3019563)
  var prodOuterWidth = d3.select('#prodChart').node().clientWidth,
      prodOuterHeight = d3.select('#prodChart').node().clientHeight,
      prodMargin = {top: 5, right: 5, bottom: 0, left: 28},
      prodPadding = {top: 5, right: 10, bottom: 2, left: 12},
      prodInnerWidth = prodOuterWidth - prodMargin.left - prodMargin.right,
      prodInnerHeight = prodOuterHeight - prodMargin.top - prodMargin.bottom,
      prodWidth = prodInnerWidth - prodPadding.left - prodPadding.right,
      prodHeight = prodInnerHeight - prodPadding.top - prodPadding.bottom;

  var prodPlot = d3.select('#prodChart').append('svg')
      .attr('width', prodOuterWidth)
      .attr('height', prodOuterHeight)
      .append('g')
      .attr("transform", "translate(" + prodMargin.left + "," + prodMargin.top + ")");

  //Setting the scales
  var xProdScale = d3.scaleLinear()
      .range([0, prodWidth]);
  var yProdScale = d3.scaleLinear()
      .range([prodHeight, 0]);
  // Creating the tool tip for the prod PLOT
  //Create the map tool tip
  var prodTip = d3.tip()
    .attr('class', 'd3-tip')
    .attr('id', 'popUp')
    .offset([10, 5])
      .direction('e')
      .html(function(d) {return "<strong>Country:</strong> <span style='color:silver'>" + d.country + "</span>" + "<br>" +
        "<strong>Year:</strong> <span style='color:silver'>" + d.year + "</span>" + "<br>" +
          "<strong>GDP Growth:</strong> <span style='color:silver'>" + round(d.gdpRate, 1) + "</span>" + "<br>" +
            "<strong>Prod Gr:</strong> <span style='color:silver'>" + round(d.xVarRate, 1)+ "</span>"})

  /*
  #################################################
  SECTION 3.2: DRAW THE SCATTER PLOT
  To-Dos: 1.
  #################################################
  */
  function drawProd(data) {
      //setting the domains for the x and y scales
      xProdScale.domain([d3.min(data, function(d) {
          return d.xVarRate;
      }), d3.max(data, function(d) {
          return d.xVarRate;
      })])
      yProdScale.domain([d3.min(data, function(d) {
          return d.gdpRate;
      }), d3.max(data, function(d) {
          return d.gdpRate;
      })])

      //Calling the axis
      var xProdAxis = d3.axisBottom(xProdScale).ticks(8);
      var yProdAxis = d3.axisLeft(yProdScale).ticks(6);

      //drawing the plot
      prodPlot.selectAll('.dots').data(data)
          .enter().append('circle')
          .attr('r', 5)
          .attr('cx', function(d) {
              return xProdScale(d.xVarRate);
          })
          .attr('cy', function(d) {
              return yProdScale(d.gdpRate);
          })
          .attr('class', 'dots')
          .classed('default', true)
          // .on('mouseover', mouseoverDots)
          // .on('mouseout', mouseoutDots)
          .call(prodTip);

      // Draw the axis
      var yTransition = prodPlot.transition() // setting the transition for the axis
          .duration(750)
          .ease(d3.easeLinear);

      // prodPlot.select('.y--scatterAxis').transition(yTransition).call(yProdAxis)
      prodPlot.append('g')
          .call(yProdAxis)
          .attr('class', 'y--scatterAxis');
      prodPlot.append('g')
          .call(xProdAxis)
          .attr('transform', 'translate(0,' + yProdScale(0) + ")")
          .attr('class', 'x--scatterAxis');

    // Adding a text element with no. of observations
    addObs(data);

    // Draw the labels
    prodPlot.append("text")
          .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
          .attr("transform", "translate("+ prodPadding.left +","+(prodHeight/6)+")rotate(-90)")
          .attr('class', 'y--prodTitle')
          .text("GDP Growth (Yearly)")
    }

  // Function to append text to prod plot (kep outside the block so that it is accessible to the redraw functions)
  function addObs(data){
    var nObsText = "No of obs: " + data.length;
    var uniqueText = "Countries: " + unique(data.map(function(d) { return d.country;})).length
    var xOffset = 80;
    prodPlot.append('g')
          .append('text')
          .attr('x', prodWidth - xOffset)
          .attr('y', yProdScale(0))
          .attr('dy', -2)
          .text(nObsText)
          .attr('class', 'obsText')
          .moveToFront();

    prodPlot.append('g')
          .append('text')
          .attr('x', prodWidth - xOffset)
          .attr('y', yProdScale(0))
          .attr('dy', -14)
          .text(uniqueText)
          .attr('class', 'obsText')
          .moveToFront();
  }

  /*
  #################################################
  SECTION 3.3: DRAW THE REGRESSION LINE
  To-Dos: 1.
  #################################################
  */
  function drawRegressLine(data, id) {
      //Calling the d3 line function
      var line = d3.line()
          .x(function(d) {
              return xProdScale(d.xVarRate);
          })
          .y(function(d) {
              return yProdScale(d.gdpRate);
          });

      // Derive a linear regression using the simple stats library
      var regression = ss.linearRegression(data.map(function(d) {
          return [d.xVarRate, d.gdpRate];
      }));

      //function that maps x values to y
      var regLineCreater = ss.linearRegressionLine(regression);

      // Create a line based on the beginning and endpoints of the range
      var regLineData = xProdScale.domain().map(function(x) {
          return {
              xVarRate: x,
              gdpRate: regLineCreater(+x)
          };
      });

      // Creating an id variable for the line
      var classId = id + 'regLine'
      prodPlot.append('g').append("path")
          .datum(regLineData)
          .attr("class", classId)
          .attr("d", line);
  }
  /*
  #################################################
  SECTION 3.4: CREATE A TWO HANDLE BRUSH WITH GLOBAL GDP DATA
  To-Dos: 1.
  #################################################
  */

  //Create the Brush canvas margin system
  var brushOuterWidth = d3.select('#brushDiv').node().clientWidth,
      brushOuterHeight = d3.select('#brushDiv').node().clientHeight,
      brushMargin = {top: 5, right: 10, bottom: 20, left: 50},
      brushPadding = {top: 2, right: 2, bottom: 2, left: 10},
      brushInnerWidth = brushOuterWidth - brushMargin.left - brushMargin.right,
      brushInnerHeight = brushOuterHeight - brushMargin.top - brushMargin.bottom,
      brushWidth = brushInnerWidth - brushPadding.left - brushPadding.right,
      brushHeight = brushInnerHeight - brushPadding.top - brushPadding.bottom;

  //Create the svg
  var brushSvg = d3.select('#brushDiv').append('svg')
      .attr('width', brushOuterWidth)
      .attr('height', brushOuterHeight)
      .append('g')
      .attr("transform", "translate(" + brushMargin.left + "," + brushMargin.top + ")")
      .attr('class', 'brushSvg');

  //Create the X and Y scales
  var xBrushScale = d3.scaleTime()
      .domain([new Date(startYear, 1, 1), new Date(endYear, 1, 1)]) //based on the entire range of the dataset
      .rangeRound([0, brushWidth]);

  var yBrushScale = d3.scaleLinear() //based on the max and min values of the world gdp data
      .domain([d3.min(brushData, function(d) {
          return d.gdpPc
      }), d3.max(brushData, function(d) {
          return d.gdpPc
      })])
      .range([brushHeight, 0]);

  //Create the brush
  var brush = d3.brushX()
      .extent([
          [0, 0],
          [brushWidth, brushHeight]
      ])
      // .on("end", brushended);

  //Append the X and Y axis to the brush svg
  function drawBrush(brushData){
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
            .tickPadding(2));

    //Draw the gdp chart
    var gdpLine = d3.line()
        .x(function(d) {
            return xBrushScale(d.year);
        })
        .y(function(d) {
            return yBrushScale(d.gdpPc);
        });
    //Draw the world line
    brushSvg.append('g').append('path')
        .datum(brushData.filter(function(d) {return d.country === "World"}))
        .attr('d', gdpLine)
        .attr('class', 'brushLine');

    // Axis title
    brushSvg.append("text")
          .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
          .attr("transform", "translate("+ brushPadding.left +","+(brushHeight/2)+")rotate(-90)")
          .attr('class', 'y--brushTitle')
          .attr("dy", "0em")
          .text("GDP per cap.")

    //Call the brush on the svg
    brushSvg.append("g")
        .attr("class", "brush")
        .call(brush)
  }

  // Draw the default chart
  drawProd(data)
  drawRegressLine(data, 'main')
  drawBrush(brushData)


}
