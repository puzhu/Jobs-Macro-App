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
  if($('input[type="checkbox"]').prop('checked')){
    return array;
  } else {
    return removeOutliers(array);
  }
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

var prodTitleKey = {
  "Total Productivity (per year growth)": "Total Productivity",
  "Agricultural Productivity (per year growth)": "Agricultural Productivity",
  "Industrial Productivity (per year growth)": "Industrial Productivity",
  "Services Productivity (per year growth)": "Services Productivity"
}
var empTitleKey = {
  "Total Productivity (per year growth)": "Total Employment",
  "Agricultural Productivity (per year growth)": "Agricultural Employment",
  "Industrial Productivity (per year growth)": "Industrial Employment",
  "Services Productivity (per year growth)": "Services Employment"
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
function processallBrushData(data) {
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
    .defer(d3.csv, "data/gdpPerCapData.csv", processallBrushData)
    .await(ready);

function ready(error, dataAll, allBrushData) {
    draw(dataAll, allBrushData);
}

function draw(dataAll, allBrushData) {
  /*
  #################################################
  SECTION 3: GET THE DATA READY
  #################################################
  */
  //Identify the start year and end year of the data (the two dates should never be updated)
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
  var prodData = (calcVizAllGrData(dataAll, startYear, endYear, currentProdX, currentProdY));
  var empData = (calcVizAllGrData(dataAll, startYear, endYear, currentEmpX, currentEmpY));
  var currBrushData = allBrushData.filter(function(d) {return d.countryGroup === currentCountryGroup;});

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

      //CREATE BRUSH
  //Creating the svg
  var brushVars = createSVG('#brushDiv', margin = {top: 5, right: 10, bottom: 20, left: 25}, padding = {top: 2, right: 2, bottom: 2, left: 10}),
      brushWidth = brushVars.width,
      brushHeight = brushVars.height,
      brushSvg = brushVars.plotVar;

  //Create the X and Y scales
  var xBrushScale = d3.scaleTime()
      .domain([new Date(startYear, 1, 1), new Date(endYear, 1, 1)]) //based on the entire range of the dataset
      .rangeRound([0, brushWidth]);

  var yBrushScale = d3.scaleLinear() //based on the max and min values of the world gdp data
      .range([brushHeight, 0]);

  //Create the brush
  var brush = d3.brushX()
      .extent([
          [0, 0],
          [brushWidth, brushHeight]
      ])
      .on("end", brushended);
  //Call the brush on the svg (only called once)
  brushSvg.append("g")
      .attr("class", "brush")
      .call(brush)

  // Draw the x axis for the brush (only drawn once)
  brushSvg.append("g")
      .attr("class", "brushAxis brushAxis--x")
      .attr("transform", "translate(0," + brushHeight + ")")
      .call(d3.axisBottom(xBrushScale)
          .ticks(d3.timeYear)
          .tickPadding(2))
      .attr("text-anchor", null)
      .selectAll("text")
      .attr("x", -22); //offset the tick labels to the left of the ticks

  // Draw the default charts for productivity
  drawScatterAxis(prodData, prodPlot, xProdScale, yProdScale, prodWidth, prodHeight, 'prod')
  drawScatterPlot(prodData, prodPlot, xProdScale, yProdScale, toolTip, 'prod')
  drawRegressLine(prodData, 'main', prodPlot, xProdScale, yProdScale, 'prod')

  // Draw the default charts for employment
  drawScatterAxis(empData, empPlot, xEmpScale, yEmpScale, empWidth, empHeight, 'emp')
  drawScatterPlot(empData, empPlot, xEmpScale, yEmpScale, toolTip, 'emp')
  drawRegressLine(empData, 'main',empPlot, xEmpScale, yEmpScale, 'emp')

  //Draw the brush line
  drawBrushLine(currBrushData, currentCountryGroup, brushSvg, xBrushScale, yBrushScale, brushHeight, 'main')


  /*
  #################################################
  SECTION 3.4: EVENT HANDLER FOR THE X AXIS DROPDOWNS
  To-Dos: 1.
  #################################################
  */
  // Event listener for x Axis dropdown FOR productivity
  d3.select('#xProdDropDown').on('change.line', function() {
    // update the x variable for the productivity chart (based on sector selected)
    selProdXVar = document.getElementById('xProdDropDown');
    currentProdX = xProdVarKey[selProdXVar.options[selProdXVar.selectedIndex].value];
    //update the data based on the new x variable
    prodData = (calcVizAllGrData(dataAll, startYear, endYear, currentProdX, currentProdY));

    // update the y variable for the employment chart
    currentEmpY = yEmpVarKey[selProdXVar.options[selProdXVar.selectedIndex].value];
    // update the data based on the new employment data
    empData = (calcVizAllGrData(dataAll, startYear, endYear, currentEmpX, currentEmpY));

    //Redraw existing productivity plot elements
    drawScatterAxis(prodData, prodPlot, xProdScale, yProdScale, prodWidth, prodHeight, 'prod')
    drawScatterPlot(prodData, prodPlot, xProdScale, yProdScale, toolTip, 'prod')
    drawRegressLine(prodData, 'main', prodPlot, xProdScale, yProdScale, 'prod')

    //Redraw existing employment plot elements
    drawScatterAxis(empData, empPlot, xEmpScale, yEmpScale, empWidth, empHeight, 'emp')
    drawScatterPlot(empData, empPlot, xEmpScale, yEmpScale, toolTip, 'emp')
    drawRegressLine(empData, 'main', empPlot, xEmpScale, yEmpScale, 'emp')

    // Reflect existing inputs on new data
    scatterHandler()
  })

  // Event listener for x Axis dropdown FOR employment
  d3.select('#xEmpDropDown').on('change.line', function() {
    // update the x variable (gdp or productivity)
    if (selEmpXVar.options[selEmpXVar.selectedIndex].value === "Productivity (Per year growth)") {
      currentEmpX = currentProdX
    } else {
      currentEmpX = currentProdY
    }
    // update the data based on the new x variable
    empData = (calcVizAllGrData(dataAll, startYear, endYear, currentEmpX, currentEmpY));

    //Remove existing plot elements
    drawScatterAxis(empData, empPlot, xEmpScale, yEmpScale, empWidth, empHeight, 'emp')
    drawScatterPlot(empData, empPlot, xEmpScale, yEmpScale, toolTip, 'emp')
    drawRegressLine(empData, 'main', empPlot, xEmpScale, yEmpScale, 'emp')

    // Reflect existing inputs on new data
    scatterHandler()
    // d3.select('.brush').call(brush.move, null)
  })

  /*
  #################################################
  SECTION 3.4: EVENT HANDLER FOR THE OUTLIERS SWITCH
  To-Dos: 1.
  #################################################
  */

  d3.select('#outlierCheck').on('change', function(){
    if($('input[type="checkbox"]').prop('checked')) { //checkbox is checked then redraw
      // update the two data sets
      prodData = calcVizAllGrData(dataAll, startYear, endYear, currentProdX, currentProdY);
      empData = calcVizAllGrData(dataAll, startYear, endYear, currentEmpX, currentEmpY);

      ///Redraw existing productivity plot elements
      drawScatterAxis(prodData, prodPlot, xProdScale, yProdScale, prodWidth, prodHeight, 'prod')
      drawScatterPlot(prodData, prodPlot, xProdScale, yProdScale, toolTip, 'prod')
      drawRegressLine(prodData, 'main', prodPlot, xProdScale, yProdScale, 'prod')

      //Redraw existing employment plot elements
      drawScatterAxis(empData, empPlot, xEmpScale, yEmpScale, empWidth, empHeight, 'emp')
      drawScatterPlot(empData, empPlot, xEmpScale, yEmpScale, toolTip, 'emp')
      drawRegressLine(empData, 'main', empPlot, xEmpScale, yEmpScale, 'emp')

      //Apply existing inputs on new charts
      scatterHandler();

    } else{
      // update the two data sets
      prodData = (calcVizAllGrData(dataAll, startYear, endYear, currentProdX, currentProdY));
      empData = (calcVizAllGrData(dataAll, startYear, endYear, currentEmpX, currentEmpY));

      ///Redraw existing productivity plot elements
      drawScatterAxis(prodData, prodPlot, xProdScale, yProdScale, prodWidth, prodHeight, 'prod')
      drawScatterPlot(prodData, prodPlot, xProdScale, yProdScale, toolTip, 'prod')
      drawRegressLine(prodData, 'main', prodPlot, xProdScale, yProdScale, 'prod')

      //Redraw existing employment plot elements
      drawScatterAxis(empData, empPlot, xEmpScale, yEmpScale, empWidth, empHeight, 'emp')
      drawScatterPlot(empData, empPlot, xEmpScale, yEmpScale, toolTip, 'emp')
      drawRegressLine(empData, 'main', empPlot, xEmpScale, yEmpScale, 'emp')

      //Apply existing inputs on new charts
      scatterHandler();
    }
  })
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
      scatterHandler()
  }

  /*
  #################################################
  SECTION 3.4: COUNTRY GROUPS DROPDOWN
  To-Dos: 1.
  #################################################
  */
  d3.select('#incomeDropdown').on('change.line', function() {
    // update the values of control variables
    selCountryGroup = document.getElementById('incomeDropdown');
    currentCountryGroup = incomeClassKey[selCountryGroup.options[selCountryGroup.selectedIndex].value];
    scatterHandler()

    // Change the line on the brush
    currBrushData = allBrushData.filter(function(d) {return d.countryGroup === currentCountryGroup || d.countryGroup === 'W'});
    drawBrushLine(currBrushData, currentCountryGroup, brushSvg, xBrushScale, yBrushScale, brushHeight)
  });

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
        nObs(prodData, prodPlot, prodWidth, prodHeight, 'prod')
        nObs(empData, empPlot, empWidth, empHeight, 'emp')
      } else {
        // Hide or show scatterCircles based on the start and end year of the brush
        d3.selectAll('.dots').filter(function(d) { return d.year >= yearDomainRange[0].getFullYear() && d.year <= yearDomainRange[1].getFullYear()}).classed('default', false).classed('selected', true).attr('fill', fillColour).moveToFront();
        d3.selectAll('.dots').filter(function(d) { return d.year < yearDomainRange[0].getFullYear() || d.year > yearDomainRange[1].getFullYear()}).classed('selected', false).classed('default', true).moveToBack();

        // Draw a temparory regression line for each brush end event
        tempProdData = prodData.filter(function(d) {return d.year >= yearDomainRange[0].getFullYear() && d.year <= yearDomainRange[1].getFullYear()})
        tempEmpData = empData.filter(function(d) {return d.year >= yearDomainRange[0].getFullYear() && d.year <= yearDomainRange[1].getFullYear()})
        drawRegressLine(tempProdData, 'temp', prodPlot, xProdScale, yProdScale, 'prod')
        drawRegressLine(tempEmpData, 'temp', empPlot, xEmpScale, yEmpScale, 'emp')

        // update number of obsText
        nObs(tempProdData, prodPlot, prodWidth, prodHeight, 'prod')
        nObs(tempEmpData, empPlot, empWidth, prodHeight, 'emp')
      }
    } else {
      // Hide or show scatterCircles based on the start and end year of the brush
      d3.selectAll('.dots').filter(function(d) { return d.year >= yearDomainRange[0].getFullYear() && d.year <= yearDomainRange[1].getFullYear() && d.incomeClass === currentCountryGroup}).classed('default', false).classed('selected', true).attr('fill', fillColour).moveToFront()
      d3.selectAll('.dots').filter(function(d) { return d.year < yearDomainRange[0].getFullYear() || d.year > yearDomainRange[1].getFullYear() || d.incomeClass != currentCountryGroup} ).classed('selected', false).classed('default', true).moveToBack();

      // Draw a temparory regression line for each brush end event
      tempProdData = prodData.filter(function(d) {return d.year >= yearDomainRange[0].getFullYear() && d.year <= yearDomainRange[1].getFullYear() && d.incomeClass === currentCountryGroup})
      tempEmpData = empData.filter(function(d) {return d.year >= yearDomainRange[0].getFullYear() && d.year <= yearDomainRange[1].getFullYear() && d.incomeClass === currentCountryGroup})

      drawRegressLine(tempProdData, 'temp', prodPlot, xProdScale, yProdScale, 'prod')
      drawRegressLine(tempEmpData, 'temp', empPlot, xEmpScale, yEmpScale, 'emp')

      // update number of obsText
      nObs(tempProdData, prodPlot, prodWidth, prodHeight, 'prod')
      nObs(tempEmpData, empPlot, empWidth, prodHeight, 'emp')
    }
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
          .on('mouseover', mouseoverDots)
          .on('mouseout', mouseoutDots)
          .call(toolTip);

      //Draw titles
      var tempProdXVar = document.getElementById('xProdDropDown');
      var currentProdTitle = prodTitleKey[tempProdXVar.options[tempProdXVar.selectedIndex].value];
      if(varType === 'prod'){
        d3.select('#prodChartXVar').html(currentProdTitle)
      } else {
        var tempEmpYVar = document.getElementById('xEmpDropDown');
        var currentEmpTitle = empTitleKey[tempProdXVar.options[tempProdXVar.selectedIndex].value];
        if(tempEmpYVar.options[tempEmpYVar.selectedIndex].value === "Productivity (Per year growth)") {
          d3.select('#empChartXVar').html(currentProdTitle)
          d3.select('#empChartYVar').html(currentEmpTitle)
        } else {
          d3.select('#empChartXVar').html("GDP Growth")
          d3.select('#empChartYVar').html(currentEmpTitle)
        }
      }

      function mouseoverDots(d){
        d3.selectAll('.dots').filter(function(e) {return e.country === d.country}).classed('default', false).classed('selected', true).attr('fill', fillColour).moveToFront()
        d3.selectAll('.dots').filter(function(e) {return e.country != d.country}).classed('selected', false).classed('default', true).moveToBack()
        toolTip.show(d)
      }
      // Mouseout function fo scatter plot
      function mouseoutDots(d){
        scatterHandler()
        toolTip.hide(d)
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

  // Add text for observations
  nObs(data, plotVar, width, height, varType)

}
//Scatter Helper for number of observations
function nObs(data, plotVar, width, height, varType) {
  // create plot specific unique class
  var obsClass = varType + "obsText"
  // remove existing text for specified chart
  // console.log(obsClass)
  d3.selectAll('.' + obsClass).remove()

  // Create first line
  var nObsText = "No of obs: " + data.length;

  // create second line
  var uniqueText = "Countries: " + unique(data.map(function(d) { return d.country;})).length
  // Append the text to the plot
  plotVar.append('g')
        .append('text')
        .attr('x', width - 80)
        .attr('y', height - 0)
        .attr('dy', -2)
        .text(nObsText)
        .attr('class', 'obsText '+ obsClass)
        .moveToFront();

  plotVar.append('g')
        .append('text')
        .attr('x', width - 80)
        .attr('y', height - 0)
        .attr('dy', -14)
        .text(uniqueText)
        .attr('class', 'obsText '+ obsClass)
        .moveToFront();
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
SECTION 3.4: CREATE A LINE CHART ON TOP OF THE BRUSH
To-Dos: 1.
#################################################
*/
function drawBrushLine(brushData, countryGroup, plotVar, xScale, yScale, height) {


  // Remove existing elements
  d3.select('.brushAxis--y').remove();
  d3.select('.tempbrushLine').remove();
  d3.select('.mainbrushLine').remove();
  d3.selectAll('.y--brushTitle').remove();

  //update the scale domains
  yScale.domain([d3.min(brushData, function(d) {
      return d.gdpPc
  }), d3.max(brushData, function(d) {
      return d.gdpPc
  })])

  //Draw the Y-Axis
  plotVar.append('g')
      .attr('class', 'brushAxis brushAxis--y')
      .call(d3.axisLeft(yScale)
          .ticks(3)
          .tickPadding(2));

  // Axis title
  plotVar.append("text")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate("+ 10 +","+(height/2)+")rotate(-90)")
        .attr('class', 'y--brushTitle')
        .attr("dy", "0em")
        .text("GDP per cap.")
  plotVar.append("text")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate("+ 10 +","+(height/2)+")rotate(-90)")
        .attr('class', 'y--brushTitle')
        .attr("dy", "1em")
        .text("(in ,100s)")

    //The line function for the brush chart
    var gdpLine = d3.line()
        .x(function(d) {
            return xScale(d.year);
        })
        .y(function(d) {
            return yScale(d.gdpPc);
        });

    //Draw the brush line
    if(countryGroup === 'W') {
      plotVar.append('g').append('path')
          .datum(brushData)
          .attr('d', gdpLine)
          .attr('class', 'mainbrushLine');
    } else {
      plotVar.append('g').append('path')
          .datum(brushData.filter(function(d) {return d.countryGroup === 'W'}))
          .attr('d', gdpLine)
          .attr('class', 'mainbrushLine');

      plotVar.append('g').append('path')
          .datum(brushData.filter(function(d) {return d.countryGroup != 'W'}))
          .attr('d', gdpLine)
          .attr('class', 'tempbrushLine');
    }

}
