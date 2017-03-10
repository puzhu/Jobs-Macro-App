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
<!-- <meta http-equiv="Cache-control" content="no-store"> -->

<head>
<title>Jobs Macro Visualization</title>

<link rel="stylesheet" href="libs/font-awesome/css/font-awesome.min.css">
<link rel="stylesheet" href="libs/bootstrap/css/bootstrap.min.css">
<link rel="stylesheet" href="styles/main.css">
<link rel="stylesheet" href="styles/tool-tip-style.css">


</head>
<body>
  <div class="container-fluid">
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
        <div class="col-sm-5 container-fluid text-center", id="controls-container">
          <div class="row" id='controls-row-1'>
            <div class="col-xs-4 controlItem" id='control1 control'>
              <p>
              </p>
            </div>
            <div class="col-xs-4 container-fluid controlItem" id='control2'>
              <div class="row" id="control2-title">
                <p class="lead helpText">
                  Select country group
                </p>
              </div>
              <div class="row" id='control2'>
                <!-- <label class='appDropDown'>
                  <select id="incomeDropdown">
                    <option selected="selected">All Countries</option>
                    <option>Low Income</option>
                    <option>Lower Middle Income</option>
                    <option>Upper Middle Income</option>
                    <option>High Income</option>
                  </select>
                </label> -->
                <div class="dropdown" id="countryClassDropdown">
                  <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
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
            <div class="col-xs-4 controlItem" id='control3'>
              <p>

              </p>
            </div>
          </div>
          <div class="row" id='controls-row-2'>
            <div class="col-xs-4 controlItem" id='control4'>
              <p>

              </p>
            </div>
            <div class="col-xs-4 container-fluid controlItem" id='control5'>
              <div class="row" id="control2-title">
                <p class="lead helpText">
                  Include Outliers
                </p>
              </div>
              <div class="row">
                <label class="switch">
                  <input type="checkbox" id="outlierCheck">
                  <div class="slider round"></div>
                </label>
              </div>
            </div>
            <div class="col-xs-4 controlItem" id='control6'>
              <p>

              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="row container-fluid" id='chart-area'>
        <div class="col-sm-6 container-fluid" id='prodChart-container'>
          <div class="row chartTitle">
            <p class="lead">
              <span id='prodChartXVar'></span> vs. GDP
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
              <span id='empChartXVar'></span> vs. <span id='empChartYVar'></span>
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
  <script src="libs/jquery-2.2.4.min.js"></script>
  <script src="libs/bootstrap/js/bootstrap.min.js"></script>
  <script src="libs/d3.min.js"></script>
  <script src="libs/d3-tool-tip.js"></script>
  <script src="scripts/main.js"></script>
</body>
</html>
