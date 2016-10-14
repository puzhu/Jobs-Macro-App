/*
#################################################
SECTION 1: HELPER FUNCTIONS
To-Dos: 1.
#################################################
*/
  //CREATE CHARTING VARIABLES
//Creating the SVG using margin convention(source: http://bl.ocks.org/mbostock/3019563)
function createSVG(id, margin, padding) { //plotVar, margin, padding
  var outerWidth = d3.select(id).node().clientWidth,
      outerHeight = d3.select(id).node().clientHeight,
      innerWidth = outerWidth - margin.left - margin.right,
      innerHeight = outerHeight - margin.top -margin.bottom,
      width = innerWidth - padding.left - padding.right,
      height = innerHeight - padding.top - padding.bottom,
      plotVar = d3.select(id).append('svg')
      .attr('width', outerWidth)
      .attr('height', outerHeight)
      .append('g')
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      var xScale = d3.scaleLinear()
          .range([0, width]);
      var yScale = d3.scaleLinear()
          .range([height, 0]);
      var svgProps = {width: width, height: height, plotVar: plotVar, xScale: xScale, yScale: yScale}

  return svgProps
}

//create scales and axis for scatter plots





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
function calcVizAllGrData(data, startYear, endYear, xVar, yVar){
	var array = [];
	var tempData = data.filter(function(d) {
			return d.year >= startYear && d.year <= endYear && !isNaN(d[yVar]) && !isNaN(d[xVar]);
	})
	tempData.forEach(function(d) {
		array.push({
			country: d.country,
      year: d.year,
			incomeClass: d.incomeClass,
			yVarRate: (d[yVar]),
			xVarRate: (d[xVar])
		})
	})
	return array;
}

//Remove outliers
function removeOutliers(data) {
  var yDeviation = d3.deviation(data, function(d) {return d.yVarRate}) * 2.5;
  var xDeviation = d3.deviation(data, function(d) {return d.xVarRate}) * 2.5;
  return data.filter(function(d) {return d.yVarRate < yDeviation && d.yVarRate > -yDeviation && d.xVarRate < xDeviation && d.xVarRate > -xDeviation})
}

        //MAP CONTROLS TO DATA VARIABLES
// Create global variables to map html inputs to data
var incomeClassKey = {
  'All Countries': "W",
  'Low Income': "L",
  'Lower Middle Income': 'LM',
  'Upper Middle Income': 'UM',
  'High Income': 'H'
}
var xProdVarKey = {
  "Total Productivity (per year growth)": "prodTot",
  "Agricultural Productivity (per year growth)": "prodAg",
  "Industrial Productivity (per year growth)": "prodInd",
  "Services Productivity (per year growth)": "prodServ"
}
var yEmpVarKey = {
  "Total Productivity (per year growth)": "empTot",
  "Agricultural Productivity (per year growth)": "empAg",
  "Industrial Productivity (per year growth)": "empInd",
  "Services Productivity (per year growth)": "empServ"
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
        countryGroup: data.countryGroup,
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
  //Identify the start year and end year of the data
  var startYear = d3.min(dataAll, function(d) {
      return d.year;
  })
  var endYear = d3.max(dataAll, function(d) {
      return d.year;
  })
  var yearDomainRange = [new Date(startYear, 1, 1), new Date(endYear, 1, 1)] //updated through brush events

  //Selected x variable for productivity
  var selProdXVar = document.getElementById('xProdDropDown');
  var currentProdX = xProdVarKey[selProdXVar.options[selProdXVar.selectedIndex].value];
  var currentProdY = 'gdp'

  //Selected x variable for employment
  var selEmpXVar = document.getElementById('xEmpDropDown');
  var currentEmpX;

  if (selEmpXVar.options[selEmpXVar.selectedIndex].value === "Productivity (Per year growth)") {
    currentEmpX = currentProdX
  } else {
    currentEmpX = currentProdY
  }
  // Selected y variable for the employment chart
  var currentEmpY = yEmpVarKey[selProdXVar.options[selProdXVar.selectedIndex].value];

  //Selected country grouping (update this when there is a change in the selection)
  var selCountryGroup = document.getElementById('incomeDropdown');
  var currentCountryGroup = incomeClassKey[selCountryGroup.options[selCountryGroup.selectedIndex].value];

  //Create the datasets for charting
  var prodData = removeOutliers(calcVizAllGrData(dataAll, startYear, endYear, currentProdX, currentProdY));
  var empData = removeOutliers(calcVizAllGrData(dataAll, startYear, endYear, currentEmpX, currentEmpY));
  var currBrushData = brushData.filter(function(d) {return d.countryGroup === currentCountryGroup;});

  /*
  #################################################
  SECTION 3.1: SETTING UP THE GLOBAL VARIABLES AND DRAWING AREAS
  To-Dos: 1.
  #################################################
  */
        //PRODUCTIVITY CHART
  //Creating the svg
  var prodChartVars = createSVG('#prodChart', margin = {top: 5, right: 5, bottom: 0, left: 28}, padding = {top: 5, right: 10, bottom: 2, left: 12}),
      prodWidth = prodChartVars.width,
      prodHeight = prodChartVars.height,
      prodPlot = prodChartVars.plotVar,
      xProdScale = prodChartVars.xScale,
      yProdScale = prodChartVars.yScale;

        //EMPLOYMENT CHART
  //Creating the svg
  var empChartVars = createSVG('#empChart', margin = {top: 5, right: 5, bottom: 0, left: 28}, padding = {top: 5, right: 10, bottom: 2, left: 12}),
      empWidth = empChartVars.width,
      empHeight = empChartVars.height,
      empPlot = empChartVars.plotVar,
      xEmpScale = empChartVars.xScale,
      yEmpScale = empChartVars.yScale;

  // Creating the tool tip for both the scatter plots
  var toolTip = d3.tip()
    .attr('class', 'd3-tip')
    .attr('id', 'popUp')
    .offset([10, 5])
      .direction('e')
      .html(function(d) {return "<strong>Country:</strong> <span style='color:silver'>" + d.country + "</span>" + "<br>" +
        "<strong>Year:</strong> <span style='color:silver'>" + d.year + "</span>" + "<br>" +
          "<strong>GDP Growth:</strong> <span style='color:silver'>" + round(d.yVarRate, 1) + "</span>" + "<br>" +
            "<strong>Prod Gr:</strong> <span style='color:silver'>" + round(d.xVarRate, 1)+ "</span>"})

      //BRUSH
  //Creating the svg
  var brushVars = createSVG('#brushDiv', margin = {top: 5, right: 10, bottom: 20, left: 50}, padding = {top: 2, right: 2, bottom: 2, left: 10}),
      brushWidth = brushVars.width,
      brushHeight = brushVars.height,
      brushSvg = brushVars.plotVar;

  //Create the X and Y scales
  var xBrushScale = d3.scaleTime()
      .domain([new Date(startYear, 1, 1), new Date(endYear, 1, 1)]) //based on the entire range of the dataset
      .rangeRound([0, brushWidth]);

  var yBrushScale = d3.scaleLinear() //based on the max and min values of the world gdp data
      .domain([d3.min(currBrushData, function(d) {
          return d.gdpPc
      }), d3.max(currBrushData, function(d) {
          return d.gdpPc
      })])
      .range([brushHeight, 0]);

  //Create the brush
  var brush = d3.brushX()
      .extent([
          [0, 0],
          [brushWidth, brushHeight]
      ])
      .on("end", brushended);
  // Draw the default charts for productivity
  drawScatterAxis(prodData, prodPlot, xProdScale, yProdScale, prodWidth, prodHeight, 'prod')
  drawScatterPlot(prodData, prodPlot, xProdScale, yProdScale, toolTip, 'prod')
  drawRegressLine(prodData, 'main', prodPlot, xProdScale, yProdScale, 'prod')

  // Draw the default charts for employment
  drawScatterAxis(empData, empPlot, xEmpScale, yEmpScale, empWidth, empHeight, 'emp')
  drawScatterPlot(empData, empPlot, xEmpScale, yEmpScale, toolTip, 'emp')
  drawRegressLine(empData, 'main',empPlot, xEmpScale, yEmpScale, 'emp')

  //Draw the default brush
  drawBrush(currBrushData, brushSvg, brush, brushWidth, brushHeight, xBrushScale, yBrushScale)


  /*
  #################################################
  SECTION 3.4: EVENT HANDLER FOR THE X VARIABLES
  To-Dos: 1. Keep the brush on x var change and apply on new charts
  #################################################
  */
  // Event listener for x Axis dropdown FOR productivity
  d3.select('#xProdDropDown').on('change.line', function() {
    // change the productivity data based on new x variable
    selProdXVar = document.getElementById('xProdDropDown');
    currentProdX = xProdVarKey[selProdXVar.options[selProdXVar.selectedIndex].value];
    prodData = removeOutliers(calcVizAllGrData(dataAll, startYear, endYear, currentProdX, currentProdY));

    // change the employment data based on new x variable
    currentEmpY = yEmpVarKey[selProdXVar.options[selProdXVar.selectedIndex].value];
    if (selEmpXVar.options[selEmpXVar.selectedIndex].value === "Productivity (Per year growth)") {
      currentEmpX = currentProdX
    } else {
      currentEmpX = currentProdY
    }
    empData = removeOutliers(calcVizAllGrData(dataAll, startYear, endYear, currentEmpX, currentEmpY));
    //Redraw existing productivity plot elements
    drawScatterAxis(prodData, prodPlot, xProdScale, yProdScale, prodWidth, prodHeight, 'prod')
    drawScatterPlot(prodData, prodPlot, xProdScale, yProdScale, toolTip, 'prod')
    drawRegressLine(prodData, 'main', prodPlot, xProdScale, yProdScale, 'prod')

    //Redraw existing employment plot elements
    drawScatterAxis(empData, empPlot, xEmpScale, yEmpScale, empWidth, empHeight, 'emp')
    drawScatterPlot(empData, empPlot, xEmpScale, yEmpScale, toolTip, 'emp')
    drawRegressLine(empData, 'main', empPlot, xEmpScale, yEmpScale, 'emp')

    // Reset the outliers button
    $('input[type="checkbox"]').prop('checked',false)

    // Reset the country dropdown
    $('#incomeDropdown option').prop('selected', function() {return this.defaultSelected;})

    // reset the default income class and date domains
    selCountryGroup = document.getElementById('incomeDropdown');
    currentCountryGroup = incomeClassKey[selCountryGroup.options[selCountryGroup.selectedIndex].value];
    yearDomainRange =[new Date(startYear, 1, 1), new Date(endYear, 1, 1)]

    // Reset the brush
    d3.select('.brush').call(brush.move, null)

  })

  // Event listener for x Axis dropdown FOR employment
  // d3.select('#xEmpDropDown').on('change.line', function() {
  //   // change the data based on new x variable
  //   selEmpXVar = document.getElementById('xEmpDropDown');
  //   currentEmpX = xProdVarKey[selEmpXVar.options[selEmpXVar.selectedIndex].value];
  //   empData = removeOutliers(calcVizAllGrData((dataAll), startYear, endYear, currentEmpX));
  //
  //   // Reset the outliers button
  //   $('input[type="checkbox"]').prop('checked',false)
  //
  //   // Reset the country dropdown
  //   $('#incomeDropdown option').prop('selected', function() {return this.defaultSelected;})
  //
  //   // reset the default income class and date domains
  //   selCountryGroup = document.getElementById('incomeDropdown');
  //   currentCountryGroup = incomeClassKey[selCountryGroup.options[selCountryGroup.selectedIndex].value];
  //   yearDomainRange =[new Date(startYear, 1, 1), new Date(endYear, 1, 1)]
  //
  //
  //
  //   //Remove existing plot elements
  //   drawScatterAxis(empData, empPlot, xEmpScale, yEmpScale, empWidth, empHeight, 'emp')
  //   drawScatterPlot(empData, empPlot, xEmpScale, yEmpScale, toolTip, 'emp')
  //   drawRegressLine(empData, 'main', empPlot, xEmpScale, yEmpScale, 'emp')
  //
  //   // Apply current date settings to new scatter
  //   d3.select('.brush').call(brush.move, null)
  //
  //   //Draw the temporary regression line
  //
  // })
  /*
  #################################################
  SECTION 3.4: BRUSH End EVENT HANDLERS
  To-Dos: 1.
  #################################################
  */
  function brushended() {
      if (!d3.event.sourceEvent) return; // Only transition after input.

      // Keep default styling if selection is empty i.e no brush
      if (!d3.event.selection){
        yearDomainRange = [new Date(startYear, 1, 1), new Date(endYear, 1, 1)]; //reset the domain variables
        scatterHandler()
        return; // Ignore empty selections i.e exit
      }
      var domain0 = d3.event.selection.map(xBrushScale.invert)//invert the scale to get the domain value
      yearDomainRange = domain0.map(d3.timeYear.round);

      // If empty when rounded, use floor & ceil instead.
      if (yearDomainRange[0] >= yearDomainRange[1]) {
          yearDomainRange[0] = d3.timeYear.floor(domain0[0]);
          yearDomainRange[1] = d3.timeYear.ceil(domain0[1]);
      }

      //implement a smooth transition to year domain
      d3.select(this)
          .transition()
          .call(brush.move, yearDomainRange.map(xBrushScale));
      //call the redraw function
      // drawScatterPlot(empData, empPlot, xEmpScale, yEmpScale, toolTip, 'emp')
      scatterHandler()
  }
  /*
  #################################################
  SECTION 3.4: SCATTER EVENT HANDLER
  To-Dos: 1. Update the observation text
  #################################################
  */
  var fillColour = 'rgb(33, 150, 200)'
  var tempProdData, tempEmpData;
  function scatterHandler() {
    if(currentCountryGroup === 'W'){
      if(startYear === yearDomainRange[0].getFullYear() && endYear === yearDomainRange[1].getFullYear()) { //no inputs; draw default
        // set to default view
        d3.selectAll('.tempregLine').remove() //remove the previous temp line
        d3.selectAll('.dots').classed('selected', false).classed('default', true);

        // update number of obsText
      } else {
        // Hide or show scatterCircles based on the start and end year of the brush
        d3.selectAll('.dots').filter(function(d) { return d.year >= yearDomainRange[0].getFullYear() && d.year <= yearDomainRange[1].getFullYear()}).classed('default', false).classed('selected', true).attr('fill', fillColour).moveToFront();
        d3.selectAll('.dots').filter(function(d) { return d.year < yearDomainRange[0].getFullYear() || d.year > yearDomainRange[1].getFullYear()}).classed('selected', false).classed('default', true).moveToBack();

        // Draw a temparory regression line for each brush end event
        tempProdData = prodData.filter(function(d) {return d.year >= yearDomainRange[0].getFullYear() && d.year <= yearDomainRange[1].getFullYear()})
        tempEmpData = empData.filter(function(d) {return d.year >= yearDomainRange[0].getFullYear() && d.year <= yearDomainRange[1].getFullYear()})
        // d3.select('.tempregLine').remove() //remove the previous temp line

        drawRegressLine(tempProdData, 'temp', prodPlot, xProdScale, yProdScale, 'prod')
        drawRegressLine(tempEmpData, 'temp', empPlot, xEmpScale, yEmpScale, 'emp')
      }
    }

  }



}


/*
#################################################
SECTION 3.2: DRAW THE AXIS
To-Dos: 1.
#################################################
*/
function drawScatterAxis(data, plotVar, xScale, yScale, width, height, varType) {
  var className = varType + 'Axis';
  //Remove existing elements
  d3.selectAll('.' + className).remove()

  //setting the domains for the x and y scales
  xScale.domain([d3.min(data, function(d) {
      return d.xVarRate;
  }), d3.max(data, function(d) {
      return d.xVarRate;
  })])
  yScale.domain([d3.min(data, function(d) {
      return d.yVarRate;
  }), d3.max(data, function(d) {
      return d.yVarRate;
  })])
  //Calling the axis
  var xAxis = d3.axisBottom(xScale).ticks(8);
  var yAxis = d3.axisLeft(yScale).ticks(6);

  // Draw the axis
  plotVar.append('g')
      .call(yAxis)
      .attr('class', 'y--scatterAxis '+ className)

  plotVar.append('g')
      .call(xAxis)
      .attr('transform', 'translate(0,' + yScale(0) + ")")
      .attr('class', 'x--scatterAxis ' + className)

  // Draw the labels
  var yAxisText;
  if(varType === "prod"){
    yAxisText = "GDP Growth (Yearly)"
  } else {
    yAxisText = "Emp. Growth (Yearly)"
  }
  plotVar.append("text")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate("+ 10 +","+(height/6)+")rotate(-90)")
        .attr('class', 'y--prodTitle ' + className)
        // .attr('class', className)
        .text(yAxisText);

  var nObsText = "No of obs: " + data.length;
  var uniqueText = "Countries: " + unique(data.map(function(d) { return d.country;})).length
  var xOffset = 80;
  plotVar.append('g')
        .append('text')
        .attr('x', width - xOffset)
        .attr('y', yScale(0))
        .attr('dy', -2)
        .text(nObsText)
        .attr('class', 'obsText '+ className)
        // .attr('class', className)
        .moveToFront();

  plotVar.append('g')
        .append('text')
        .attr('x', width - xOffset)
        .attr('y', yScale(0))
        .attr('dy', -14)
        .text(uniqueText)
        .attr('class', 'obsText '+ className)
        // .attr('class', className)
        .moveToFront();
}

/*
#################################################
SECTION 3.2: DRAW THE SCATTER PLOT
To-Dos: 1.
#################################################
*/
function drawScatterPlot(data, plotVar, xScale, yScale, toolTip, varType) {
    var className = varType + 'Dots'
    //Remove existing elements
    d3.selectAll('.' + className).remove()

    //drawing the plot
    plotVar.append('g').selectAll('.dots').data(data)
        .enter().append('circle')
        .attr('r', 5)
        .attr('cx', function(d) {
            return xScale(d.xVarRate);
        })
        .attr('cy', function(d) {
            return yScale(d.yVarRate);
        })
        .attr('class', 'dots default ' + className )
        // .on('mouseover', mouseoverDots)
        // .on('mouseout', mouseoutDots)
        .call(toolTip);
}

/*
#################################################
SECTION 3.3: DRAW THE REGRESSION LINE
To-Dos: 1.
#################################################
*/
function drawRegressLine(data, type, plotVar, xScale, yScale, varType) {
    var className = varType + type +'regLine ';

    //Remove existing elements
    d3.selectAll('.' + className).remove()

    //Calling the d3 line function
    var line = d3.line()
        .x(function(d) {
            return xScale(d.xVarRate);
        })
        .y(function(d) {
            return yScale(d.yVarRate);
        });

    // Derive a linear regression using the simple stats library
    var regression = ss.linearRegression(data.map(function(d) {
        return [d.xVarRate, d.yVarRate];
    }));

    //function that maps x values to y
    var regLineCreater = ss.linearRegressionLine(regression);

    // Create a line based on the beginning and endpoints of the range
    var regLineData = xScale.domain().map(function(x) {
        return {
            xVarRate: x,
            yVarRate: regLineCreater(+x)
        };
    });

    var lineType = type + 'regLine'
    // Creating an id variable for the line
    plotVar.append('g').append("path")
        .datum(regLineData)
        .attr("class", className + lineType)
        .attr("d", line);
}

/*
#################################################
SECTION 3.4: CREATE A TWO HANDLE BRUSH WITH GLOBAL GDP DATA
To-Dos: 1.
#################################################
*/
function drawBrush(brushData, plotVar, brush, width, height, xScale, yScale){
  plotVar.append("g")
      .attr("class", "brushAxis brushAxis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale)
          .ticks(d3.timeYear)
          .tickPadding(2))
      .attr("text-anchor", null)
      .selectAll("text")
      .attr("x", -22); //offset the tick labels to the left of the ticks

  plotVar.append('g')
      .attr('class', 'brushAxis brushAxis--y')
      .call(d3.axisLeft(yScale)
          .ticks(3)
          .tickPadding(2));

  //Draw the gdp chart
  var gdpLine = d3.line()
      .x(function(d) {
          return xScale(d.year);
      })
      .y(function(d) {
          return yScale(d.gdpPc);
      });

  //Draw the world line
  plotVar.append('g').append('path')
      .datum(brushData)
      .attr('d', gdpLine)
      .attr('class', 'brushLine');

  // Axis title
  plotVar.append("text")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate("+ 10 +","+(height/2)+")rotate(-90)")
        .attr('class', 'y--brushTitle')
        .attr("dy", "0em")
        .text("GDP per cap.")

  //Call the brush on the svg
  plotVar.append("g")
      .attr("class", "brush")
      .call(brush)


}
