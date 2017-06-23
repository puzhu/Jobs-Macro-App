<?php
// header('Location: /index.html');
// header('X-Frame-Options: SAMEORIGIN');
header("Cache-Control: no-cache, must-revalidate"); //HTTP 1.1
header("Pragma: no-cache"); //HTTP 1.0
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
header("X-XSS-Protection: 1; mode=block"); //X-XSS-Protection
header('X-Content-Type-Options: nosniff'); //Prevent MIME types security risk
?>
<!DOCTYPE html>
<html>
<meta charset="utf-8">
<meta http-equiv="Cache-control" content="no-store">

<head>
<title>Jobs Macro Visualization</title>

<link rel="stylesheet" href="libs/font-awesome/css/font-awesome.min.css">
<link rel="stylesheet" href="libs/bootstrap/css/bootstrap.min.css">
<link rel="stylesheet" href="styles/main.css">
<link rel="stylesheet" href="styles/tool-tip-style.css">
<script src="libs/jquery-2.2.4.min.js"></script>
<link href="libs/select2-4.0.3/dist/css/select2.min.css" rel="stylesheet" />
<script src="libs/select2-4.0.3/dist/js/select2.min.js"></script>


</head>
<body>
  <div class="container">
    <div class="row" id='lead-section'>
      <h2>Jobs Macro Data Dashboard</h2>
      <p>
        This dashboard shows the relationships between jobs, productivity and GDP (growth rates). Use the dropdowns on the x-axis of the scatter charts to change plotting variables. Please note that selection of sector specific productivity on the x-axis of the left-most chart also changes the y-axis of the chart on the right side (to reflect the current sector). The x-axis on the rightmost chart swaps between x-axis variable on the first chart and GDP growth rates. The best way to get familiarized with the dashboard is to start using. Keep an eye on the chart headings since they automatically update to give you the current plotting variables.
      </p>
      <p>
        The controls on the top row are used to highlight specific parts of the scatter plots and show trendlines for those that can be compared with the default. The brush on the leftmost side is used to select year ranges. The selections can be unmade by clicking on a part of the brush that is not currently selected. The dropdown selects different country groupings based on income. Play around with these to see if relationships persist across country groups and time ranges. The include outliers button uses the entire dataset for the two plots (the default view ignores observations that are 2.5 St. Dev. above the mean for each variable). You can also highlight individual observations to highlight country specific data points on the two charts.
      </p>


    </div>
    <div class="row" id="app-area">
      <div class="row container-fluid" id='controls-area'>
        <div class="col-sm-7 container-fluid" id="brush-container">
          <div class="row chartTitle">
            <p class="lead">
              Select Years
            </p>
            <p class="lead helpText">
              (Click and drag below to select years)
            </p>
          </div>
          <div class="row text-center" id='brushDiv'></div>
        </div>

        <div class="col-sm-5 text-center" id="controls-container">
          <div class="col-sm-5 col-sm-offset-1" id="controlGroup1">
            <div class="row" id="control1">
              <div class="row" id="control1-title"><p class="lead helpText">Pick a Country</p></div>
              <div class="row">
                <select id="countryList" style="width: 75%">
                  <option value="None" selected="selected">None</option>
                </select>
              </div>
            </div>
            <div class="row" id="saveChart">
              <div class="row" id="saveChart-title"><p class="lead helpText">Download Charts</p></div>
              <button class="btn btn-sm btn-default" id="saveChartsButton" style="width: 90%"><i class="fa fa-floppy-o fa-fw" aria-hidden="true"></i>   Charts</button>
            </div>
          </div>
          <div class="col-sm-5 col-sm-offset-1" id="controlGroup2">
            <div class="row">
              <div class="container-fluid " id='control2'>
                <div class="row" id="control2-title">
                  <p class="lead helpText">
                    Select country group
                  </p>
                </div>
                <div class="row" id='control2'>
                  <div class="dropdown " id="countryClassDropdown">
                    <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true" style="width: 90%">
                      All Countries
                      <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu" >
                      <li class="defaultCountryClass">All Countries</li>
                      <li class="dropdown-header">Income</li>
                      <li class="incomeClass">Low Income</li>
                      <li class="incomeClass">Lower Middle Income</li>
                      <li class="incomeClass">Upper Middle Income</li>
                      <li class="incomeClass">High Income</li>
                      <li class="dropdown-header">Regions</li>
                      <li class='region'>East Asia &amp; Pacific</li>
                      <li class='region'>Europe &amp; Central Asia</li>
                      <li class='region'>Latin America &amp; Caribbean</li>
                      <li class='region'>Middle East &amp; North Africa</li>
                      <li class='region'>North America</li>
                      <li class='region'>Sub-Saharan Africa</li>
                      <li class='region'>South Asia</li>
                      <li class="dropdown-header">Resource Rich</li>
                      <li class='resourceRich'>Resource Rich</li>
                      <li class='resourceRich'>Not Resource Rich</li>
                      <li class="dropdown-header">Youth</li>
                      <li class='youth'>Young</li>
                      <li class='youth'>Not Young</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="container-fluid " id='control3'>
                <div class="row" id="control3-title">
                  <p class="lead helpText">
                    Include Outliers
                  </p>
                </div>
                <div class="row" id="switchDiv">
                  <label class="switch">
                    <input type="checkbox" id="outlierCheck">
                    <div class="slider round"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row container-fluid" id='chart-area'>
        <div class="col-sm-6 container-fluid" id='prodChart-container'>
          <div class="row chartTitle">
            <p class="lead">
              <span id='prodChartXVar'></span> vs. GDP (growth rates)
            </p>
            <p class="lead helpText">
              (Hover on dots to highlight individual countries)
            </p>
          </div>
          <div class="row text-center" id='prodChart'></div>
          <div class="row text-center" id='prodChart-x-dropdown'>
            <label class='appDropDown'>
              <select id="xProdDropDown">
                <option>Total Productivity (per year growth)</option>
                <option>Agricultural Productivity (per year growth)</option>
                <option>Industrial Productivity (per year growth)</option>
                <option>Services Productivity (per year growth)</option>
              </select>
            </label>
          </div>
        </div>
        <div class="col-sm-6 container-fluid" id='empChart-container'>
          <div class="row chartTitle">
            <p class="lead">
              <span id='empChartXVar'></span> vs. <span id='empChartYVar'></span> (growth rates)
            </p>
            <p class="lead helpText">
              (Hover on dots to highlight individual countries)
            </p>
          </div>
          <div class="row text-center" id='empChart'>

          </div>
          <div class="row text-center" id='empChart-x-dropdown'>
            <label class='appDropDown'>
              <select id="xEmpDropDown">
                <option>Productivity (per year growth)</option>
                <option>Gross Domestic Product (per year growth)</option>
              </select>
            </label>
          </div>
        </div>
    </div>
    <div class="row text-right bottomText">
      <p><i class="fa fa-envelope-o fa-1x"></i> Developed by <a href="mailto:hari.subhash@gmail.com" target="_blank">Hari Subhash</a></p>
    </div>
  </div>


  <!-- <script src="scripts/preventCJ.js"></script> -->
  <!-- <script src="https://npmcdn.com/simple-statistics@2.0.0-beta3/dist/simple-statistics.min.js"></script> -->
  <script src="libs/simple-statistics.min.js"></script>
  <script src="libs/bootstrap/js/bootstrap.min.js"></script>
  <script src="libs/saveSvgAsPng/saveSvgAsPng.js"></script>
  <script src="libs/d3.min.js"></script>
  <script src="libs/d3-tool-tip.js"></script>
	<script src="scripts/main.js"></script>
</body>
</html>
