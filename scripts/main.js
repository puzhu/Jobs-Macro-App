/*
#################################################
SECTION 1: HELPER FUNCTIONS
To-Dos: 1. DONE     calcVizData -> figure out how to use a string input to extract values from an array using dot notation
#################################################
*/
// process the country gdp and productivity csv
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

// process the world gdp per cap data for the brush
function processWorldData(data) {
    var array = {
        year: new Date(deString(data.year), 1, 1),
        gdp: deString(data.gdp),
        gdpGr: deString(data.gdpGr),
        gdpPc: deString(data.gdpPc)
    }
    return array
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
// Create global variables to map html inputs to data
var incomeClassKey = {
  'Low Income': "L",
  'Lower Middle Income': 'LM',
  'Upper Middle Income': 'UM',
  'High Income': 'H'
}
var xVarKey = {
  "Agricultural Productivity (per year growth)": "prodAg",
  "Industrial Productivity (per year growth)": "prodInd",
  "Services Productivity (per year growth)": "prodServ"
}

/*
#################################################
SECTION 2: LOAD THE DATA FILES AND PROCESS THEM
#################################################
*/
d3.queue()
    .defer(d3.csv, "data/allGrDataWithoutEth.csv", processAllGrData)
    .defer(d3.csv, "data/worldGDPData.csv", processWorldData)
    .await(ready);

function ready(error, dataAll, worldData) {
    draw(dataAll, worldData);
}

function draw(dataAll, worldData) {
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
    var selXVar = document.getElementById('xScatterTitleDropDown');
    var currentX = xVarKey[selXVar.options[selXVar.selectedIndex].value]
    var data = calcVizAllGrData(dataAll, startYear, endYear, currentX)

    /*
    #################################################
    SECTION 3.1: SETTING UP THE GLOBAL VARIABLES AND DRAWING AREAS FOR THE MAP
    To-Dos: 1. DONE		   Update margin convention
    #################################################
    */
    //Creating the margin convention(source: http://bl.ocks.org/mbostock/3019563)
    var scatterOuterWidth = d3.select('#scatterChart').node().clientWidth,
        scatterOuterHeight = d3.select('#scatterChart').node().clientHeight,
    		scatterMargin = {top: 10, right: 5, bottom: 5, left: 80},
        scatterPadding = {top: 2, right: 5, bottom: 2, left: 10},
        scatterInnerWidth = scatterOuterWidth - scatterMargin.left - scatterMargin.right,
        scatterInnerHeight = scatterOuterHeight - scatterMargin.top - scatterMargin.bottom,
        scatterWidth = scatterInnerWidth - scatterPadding.left - scatterPadding.right,
        scatterHeight = scatterInnerHeight - scatterPadding.top - scatterPadding.bottom;

    var scatterPlot = d3.select('#scatterChart').append('svg')
        .attr('width', scatterOuterWidth)
        .attr('height', scatterOuterHeight)
        .append('g')
        .attr("transform", "translate(" + scatterMargin.left + "," + scatterMargin.top + ")");

    //Setting the scales
    var xScatterScale = d3.scaleLinear()
        .range([0, scatterWidth]);
    var yScatterScale = d3.scaleLinear()
        .range([scatterHeight, 0]);
    // Creating the tool tip for the scatter PLOT
    //Create the map tool tip
    var scatterTip = d3.tip()
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
    To-Dos: 1. Investigate different variable formulations (yearly Y vs panel growth X-Var, yearly Y vs yearly X-Var)
              2. DONE        Investigate why some of the dots are truncated
    					3. DONE        X axis should always intersect at y=0
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
            .on('mouseover', mouseoverDots)
            .on('mouseout', mouseoutDots)
            .call(scatterTip);

        // Draw the axis
        scatterPlot.append('g')
            .call(yScatterAxis)
            .attr('class', 'x--scatterAxis');
        scatterPlot.append('g')
            .call(xScatterAxis)
            .attr('transform', 'translate(0,' + yScatterScale(0) + ")")
            .attr('class', 'y--scatterAxis');

      // Adding a text element with no. of observations
      addObs(data);

      // Draw the labels
      scatterPlot.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("+ scatterPadding.left +","+(scatterHeight/6)+")rotate(-90)")
            .attr('class', 'y--scatterTitle')
            .text("GDP Growth (Yearly)")
    }

    // Function to append text to scatter plot (kep outside the block so that it is accessible to the redraw functions)
    function addObs(data){
      var nObsText = "No of obs: " + data.length;
      var uniqueText = "Countries: " + unique(data.map(function(d) { return d.country;})).length
      var xOffset = 80;
      scatterPlot.append('g')
            .append('text')
            .attr('x', scatterWidth - xOffset)
            .attr('y', yScatterScale(0))
            .attr('dy', -10)
            .text(nObsText)
            .attr('class', 'obsText')
            .moveToFront();

      scatterPlot.append('g')
            .append('text')
            .attr('x', scatterWidth - xOffset)
            .attr('y', yScatterScale(0))
            .attr('dy', -20)
            .text(uniqueText)
            .attr('class', 'obsText')
            .moveToFront();
    }

    /*
    #################################################
    SECTION 3.3: DRAW THE REGRESSION LINE
    To-Dos: 1. DONE		   Figure out why the css class is not being applied to the line
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

    /*
    #################################################
    SECTION 3.4: CREATE A TWO HANDLE BRUSH WITH GLOBAL GDP DATA
    To-Dos: 1. Explore the option of swapping world with country gdp variable
              2. DONE			Figure out why the css class is not being applied to the line
    					3. DONE			Add data to the brush
    					4. DEL			Show years on top of the brush handles and only show first and last on the axis
    					5. DEL      Add Brush Handles
    					7. DONE			Clean the grid
							8. DONE      Style the chart and brush for brush events
              9. DONE     Draw default chart when the brush is not applied
    #################################################
    */

    //Create the Brush canvas margin system
    var brushOuterWidth = d3.select('#brushDiv').node().clientWidth,
        brushOuterHeight = d3.select('#brushDiv').node().clientHeight,
				brushMargin = {top: 5, right: 10, bottom: 20, left: 80},
        brushPadding = {top: 2, right: 2, bottom: 2, left: 10},
        brushInnerWidth = brushOuterWidth - brushMargin.left - brushMargin.right,
        brushInnerHeight = brushOuterHeight - brushMargin.top - brushMargin.bottom,
        brushWidth = brushInnerWidth - brushPadding.left - brushPadding.right,
        brushHeight = brushInnerHeight - brushPadding.top - brushPadding.bottom;

    // Creating a popup over the brush areas
    var brushTip = d3.tip()
      .attr('class', 'd3-tip')
      .attr('id', 'popUp')
      .offset([0, 20])
        .direction('e')
            .html(function(d) {return "<p>Click and drag to select years</p>"})

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
        .domain([d3.min(worldData, function(d) {
            return d.gdpPc
        }), d3.max(worldData, function(d) {
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

    //Append the X and Y axis to the brush svg
    function drawBrush(worldData){
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

  		brushSvg.append('g').append('path')
          .datum(worldData)
  				.attr('d', gdpLine)
          .attr('class', 'brushLine');

      // Axis title
      brushSvg.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("+ brushPadding.left +","+(brushHeight/2)+")rotate(-90)")
            .attr('class', 'y--brushTitle')
            .attr("dy", "0em")
            .text("World GDP")
      brushSvg.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("+ brushPadding.left +","+(brushHeight/2)+")rotate(-90)")
            .attr('class', 'y--brushTitle')
            .attr("dy", "0.9em") // you can vary how far apart it shows up
            .text("per cap.")

      //Call the brush on the svg
      var popUp = 0
      var mouseOutCount = 0
      brushSvg.append("g")
          .attr("class", "brush")
          .call(brush)
          .call(brushTip)
          .on('mouseover', function(){
            if(popUp < 1){
              brushTip.show();
              setTimeout(function(){brushTip.hide()}, 5000)
              popUp++
            }
          })
          .on('mouseout', function() {
            if(mouseOutCount < 2){
              setTimeout(function(){
                popUp = 0}, 10000)
              mouseOutCount++
            }
          })
    }



    // Draw the default chart
    drawScatter(data)
    drawRegressLine(data, 'main')
    drawBrush(worldData)


    /*
    #################################################
    SECTION 3.5: EVENT LISTENERS FOR BRUSH, DROPDOWN, SCATTER PlOT AND OUTLIER BUTTON
    To-Dos: 1.
    #################################################
    */
    // Creating date and dropdown defaults for reference within funciton blocks
    var currentIncome = "All Countries";
    var domain1 =[new Date(startYear, 1, 1), new Date(endYear, 1, 1)]
    var tempData;

    // Brush event listener (listens for end of brushing and implements a smooth transition)
    function brushended() {
        if (!d3.event.sourceEvent) return; // Only transition after input.

        // Keep default styling if selection is empty i.e no brush
        if (!d3.event.selection){
          //
          // d3.selectAll('.scatterCircles').classed('selected', false).classed('default', true);
          domain1 = [new Date(startYear, 1, 1), new Date(endYear, 1, 1)]; //reset the domain variables
          scatterHandler(data, currentIncome, domain1)
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
        scatterHandler(data, currentIncome, domain1)
    }

    // Event listener for the dropdown
    d3.select('#incomeDropdown').on('change.line', function() {
      var sel = document.getElementById('incomeDropdown'); //selecting the default based on current input
  		currentIncome = sel.options[sel.selectedIndex].value //getting the value of the indicator
      if($('input[type="checkbox"]').prop('checked')){
        scatterHandler(tempData, currentIncome, domain1)
      } else{
        scatterHandler(data, currentIncome, domain1)
      }

    });

    // Event listener for x Axis dropdown
    d3.select('#xScatterTitleDropDown').on('change.line', function() {
      // change the data based on new x variable
      selXVar = document.getElementById('xScatterTitleDropDown');
      currentX = xVarKey[selXVar.options[selXVar.selectedIndex].value]
      data = calcVizAllGrData(dataAll, startYear, endYear, currentX)

      // Reset the outliers button
      $('input[type="checkbox"]').prop('checked',false)

      // Reset the country dropdown
      $('#incomeDropdown option').prop('selected', function() {return this.defaultSelected;})

      //Remove existing plot elements
      d3.selectAll('.scatterCircles').remove();
      d3.select('.tempregLine').remove();
      d3.select('.mainregLine').remove();
      d3.selectAll('.obsText').remove();
      d3.select('.x--scatterAxis').remove();
      d3.select('.y--scatterAxis').remove();
      d3.select('.y--scatterTitle').remove();

      // remove brush elements
      d3.select('.brush').remove();
      d3.selectAll('.brushAxis').remove();
      d3.selectAll('.y--brushTitle').remove();

      // reset the default income class and date domains
      currentIncome = "All Countries";
      domain1 =[new Date(startYear, 1, 1), new Date(endYear, 1, 1)]

      // Draw the default chart
      drawScatter(data)
      drawRegressLine(data, 'main')
      drawBrush(worldData)
    })

    var fillColour = 'rgb(33, 150, 200)'
    //Mouseover function for scatter PlOT
    function mouseoverDots(d){
      d3.selectAll('.scatterCircles').filter(function(e) {return e.country === d.country}).classed('default', false).classed('selected', true).attr('fill', fillColour).moveToFront()
      d3.selectAll('.scatterCircles').filter(function(e) {return e.country != d.country}).classed('selected', false).classed('default', true).moveToBack()
      scatterTip.show(d)
    }
    // Mouseout function fo scatter plot
    function mouseoutDots(d){
      scatterHandler(data, currentIncome, domain1)
      scatterTip.hide(d)
    }

    // Event listener for outlier button
    tempData = removeOutliers(data); //keeping this outside since it needs to be computed only once
    d3.select('#outlierCheck').on('change', function(){
      if($('input[type="checkbox"]').prop('checked')) { //checkbox is checked then redraw
        //Remove existing plot elements
        d3.selectAll('.scatterCircles').remove();
        d3.select('.tempregLine').remove();
        d3.select('.mainregLine').remove();
        d3.selectAll('.obsText').remove();
        d3.select('.x--scatterAxis').remove();
        d3.select('.y--scatterAxis').remove();
        d3.select('.y--scatterTitle').remove();

        // Draw the default no outlier charts with new data
        drawScatter(tempData)
        drawRegressLine(tempData, 'main')

        //Draw the current brush and dropdown selection with new data
        scatterHandler(tempData, currentIncome, domain1);

      } else{
        //Remove existing scatter plot elements
        d3.selectAll('.scatterCircles').remove();
        d3.select('.tempregLine').remove();
        d3.select('.mainregLine').remove();
        d3.selectAll('.obsText').remove();
        d3.select('.x--scatterAxis').remove();
        d3.select('.y--scatterAxis').remove();
        d3.select('.y--scatterTitle').remove();

        // Draw the default no outlier charts with new data
        drawScatter(data)
        drawRegressLine(data, 'main')

        //Aply the handler the current brush and dropdown selection with new data
        scatterHandler(data, currentIncome, domain1);
      }
    })


    /*
    #################################################
    SECTION 3.5: THE HANDLER FUNCTION FOR SCATTER FOR THE BRUSH AND DROPDOWN EVENTS
    To-Dos: 1. Investigate why the fill attribute cannot be modified through css class
              2. DONE         Find the ideal 'selected' fill color
    #################################################
    */

    function scatterHandler(data, currentIncome, domain1){
      if(currentIncome === "All Countries"){ //checking if default view should be applied
        if(domain1[0].getFullYear() === startYear && domain1[1].getFullYear() === endYear){
          // set to default view
          d3.select('.tempregLine').remove() //remove the previous temp line
          d3.selectAll('.scatterCircles').classed('selected', false).classed('default', true);

          //Updating the nObs text
          d3.selectAll('.obsText').remove()
          addObs(data);
        } else {
          // Hide or show scatterCircles based on the start and end year of the brush
          d3.selectAll('.scatterCircles').filter(function(d) { return d.year >= domain1[0].getFullYear() && d.year <= domain1[1].getFullYear()}).classed('default', false).classed('selected', true).attr('fill', fillColour).moveToFront();
          d3.selectAll('.scatterCircles').filter(function(d) { return d.year < domain1[0].getFullYear() || d.year > domain1[1].getFullYear()}).classed('selected', false).classed('default', true).moveToBack();

          // Draw a temparory regression line for each brush end event
          var tempRedrawData = data.filter(function(d) {return d.year >= domain1[0].getFullYear() && d.year <= domain1[1].getFullYear()})
          d3.select('.tempregLine').remove() //remove the previous temp line
          drawRegressLine(tempRedrawData, 'temp') //draw new temp line

          //Updating the nObs text
          d3.selectAll('.obsText').remove()
          addObs(tempRedrawData);
        }

      } else{
        // Hide or show scatterCircles based on the start and end year of the brush
        d3.selectAll('.scatterCircles').filter(function(d) { return d.year >= domain1[0].getFullYear() && d.year <= domain1[1].getFullYear() && d.incomeClass === incomeClassKey[currentIncome]}).classed('default', false).classed('selected', true).attr('fill', fillColour).moveToFront()
        d3.selectAll('.scatterCircles').filter(function(d) { return d.year < domain1[0].getFullYear() || d.year > domain1[1].getFullYear() || d.incomeClass != incomeClassKey[currentIncome]} ).classed('selected', false).classed('default', true).moveToBack();

        // Draw a temparory regression line for each brush end event
        var tempRedrawData = data.filter(function(d) {return d.year >= domain1[0].getFullYear() && d.year <= domain1[1].getFullYear() && d.incomeClass === incomeClassKey[currentIncome]})
        d3.select('.tempregLine').remove() //remove the previous temp line
        drawRegressLine(tempRedrawData, 'temp') //draw new temp line

        //Updating the nObs text
        d3.selectAll('.obsText').remove()
        addObs(tempRedrawData);
      }
    }
}
