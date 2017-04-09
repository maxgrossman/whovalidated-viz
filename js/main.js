// function to generate filters to visualize different barcharts
function filter() {
  activeFilters = []
  checkboxes = $("#filter-nav-tabs input[type=checkbox]");
  for (i=0; i<checkboxes.length; i++) {
    if(checkboxes[i].checked === true) {
      activeFilters.push({
        filterKey: checkboxes[i].name,
        filterValue: checkboxes[i].value
      })
    }
    // // # reformat the data on checks to make it easier to work with
    // // ? combine this into what's above
    // filterData = d3.nest().key(function(d){ return d.filterKey })
    //   .rollup(function(value){
    //     var valuesArray = [];
    //     value.forEach(function(d){
    //       valuesArray.push(d.filterValue);
    //     });
    //     return valuesArray;
    //   }).entries(activeFilters)
    // // # update the html on the page to let the user know what filters are active
    // var keyGroups = [];
    // $.each(filterData,function(i,filterKey){
    //   var keyGroupHtml = '(<b>' + filterKey.key + '</b> <small>=</small> ';
    //   var valueGroups = [];
    //   console.log(filterKey)
    //   $.each(filterKey.value, function(j,filterValue){
    //     valueGroups.push('<b>' + filterValue + '</b>');
    //   })
    //   keyGroupHtml += valueGroups.join(" <small>OR</small> ") + ")"
    //   keyGroups.push(keyGroupHtml);
    // });
    // $('#filter-active-text').html(keyGroups.join(" <small>AND</small> "));
    // // # filter the data
    // var filterKeyCount = filterData.length;
    // filteredData = data.filter(function(d){
    //   var passCount = 0;
    //   var project = d;
    //   $.each(filterData,function(iKey, filterKey){
    //     var pass = false;
    //     var thisKey = filterKey.key;
    //     $.each(filterKey.value, function(iValue, filterValue){
    //       // # if any of the filter values for a given key are present, that filter key is passed
    //       if($.inArray(filterValue, project[thisKey]) !== -1){ pass = true; }
    //     });
    //     if(pass === true){ passCount ++; }
    //   });
    //   // # if all filter keys are passed, the project passes the filtering
    //   return passCount === filterKeyCount;
    // })
    //   console.log(filteredData.length)
    // }
  }
  console.log(activeFilters)
}
// function to clear all checked boxes
function clearAllCheckboxes(){
  var allCheckboxes = $.find("input:checkbox");
  $.each(allCheckboxes, function(i, box){ $(box).prop('checked',false); });
  filter();
}
// function to fetch data
function fetchData() {
  // load in validator data
  d3.tsv('../data/testvalidates.csv',function(data) {
    validatorData = d3.map(data, function(d){return d.class})
    console.log(validatorData)
    // build tabs
    fillClassFieldTabs()
  })
}
// function that builds out class and field tabs
function fillClassFieldTabs() {
  // fill the validator group tab with validator groups checkboxes
  keys = validatorData.keys()
  console.log(keys)
  classTab = []
  for(i=0;i<keys.length;i++) {
    thisClass = '<div class="checkbox"><label><input type="checkbox" value="' +
    validatorData.keys()[i] + '" onchange="filter()">' + validatorData.keys()[i] + '</label></div><br>'
    classTab.push(thisClass)
  }
  $('#filter-nav-tabs').append(
    '<div class="tabs-panel" id="validType">' + classTab.join('') + '</div>'
  )
  // fill variable tab with variable checkboxes
  variables = Object.keys(validatorData.values()[0])
  variables = variables.filter(function(a){if(!(a.match(/pca/))){return a}}).filter(
    function(a){if(!(a.match(/user/))){return a}})
  for(i=0;i<variables.length;i++) {
    variables[i] = '<div class="checkbox"><label><input type="checkbox" value="' +
    variables[i] + '" onchange="filter()">' + variables[i] + '</label></div><br>'
  }
  $('#filter-nav-tabs').append(
    '<div class="tabs-panel" id="variable">' + variables.join('') + '</div>'
  )
  validatorScatter()
}
// function that builds validator groups scatter plot
function validatorScatter() {
  // get height, width, and margins based on div
  scattHWplus = {top: 40, right: 100, bottom: 40, left: 100, height: 300, width: 500 - 50 - 50};
  // create tooltip div, used later for interactivity
  var tooltip = d3.select("#validatorScatterDiv").append("div")
    .attr("class", "tooltip")
    .style("opacity",0)
  // add scatter to #validatorScatter div
  var scattSVG = d3.select("#validatorScatter").append("svg")
    .attr("width",scattHWplus.width + scattHWplus.left + scattHWplus.right)
    .attr("height", scattHWplus.height + scattHWplus.bottom + scattHWplus.bottom)
    .append('g').attr("transform","translate(" +
      scattHWplus.left + "," + scattHWplus.top + ")")

    // get pca_x and pca_y values
    pcaX = d3.values(validatorData).map(function(d){return d.pca_x})
      .filter(function(d){if(typeof(d)==='string')return d})
    pcaY = d3.values(validatorData).map(function(d){return d.pca_y})
      .filter(function(d){if(typeof(d)==='string')return d})

    // make scattXScale and scattYScale & scattXAxis and scattYAxis
    scattXScale = d3.scaleLinear()
      .domain([d3.min(pcaX,function(d){return d})
              ,d3.max(pcaX,function(d){return d})])
      .range([0,(scattHWplus.width)]);
    scattYScale = d3.scaleLinear()
      .domain([d3.min(pcaY,function(d){return d})
              ,d3.max(pcaY,function(d){return d})])
      .range([scattHWplus.height,0]);
    scattXAxis = d3.axisBottom().scale(scattXScale)
    scattYAxis = d3.axisLeft().scale(scattYScale).tickFormat(d3.format("d"));

    // draw x and y axes
    scattSVG.append("g")
      .attr("class","x kaxis")
      .attr("transform","translate(0," + scattHWplus.height + ")")
      .call(scattXAxis)
    scattSVG.append("g")
      .attr("class","y kaxis")
      .call(scattYAxis)

    // combine pcaX and pcaY for ease of adding to scatter
    // also add class and name
    scattDPs = []
    for(i=0;i<pcaX.length;i++) {
      scattDP = [
        pcaX[i],pcaY[i],
        validatorData.keys()[i],
        validatorData.values()[i]['user_name']
      ]
      scattDPs.push(scattDP)
    }
    // draw scatter plot and add interactivity
    scattSVG.selectAll('.scattDot')
      .data(scattDPs)
      .enter().append("circle")
        .attr("class","scattDot")
        .attr("r",4)
        .attr("cx",function(d,i){return scattXScale(d[0])})
        .attr("cy",function(d,i){return scattYScale(d[1])})
        .attr("fill",function(d,i){return d3.schemeCategory10[d[2]]})
        .on("mouseover", function(d) {
          // use encoded class to determine validator type
          validatorType = d[2] === "1" ? 'Non Validator' :
          d[2] === "2" ? 'Frequent Validator' :
          d[2] === "3" ? 'Master Validator' : '';
          // get mouse coordinates to place tooltip
          mouseCoords = d3.mouse(this)
          // add validator text to svg
          scattSVG.append("text")
            .attr("id",d[3])
            .attr("x",mouseCoords[0] + 10)
            .attr("y",mouseCoords[1]-20)
            .append("tspan")
            .attr('x', mouseCoords[0] + 10)
            .attr("dy",0)
            .style("font-size","10px")
            .text(function() {return d[3]})
            .append("tspan")
            .attr('x', mouseCoords[0] + 10)
            .attr("dy", 10)
            .style("font-size","10px")
            .text(validatorType)
          //focus on current scatter .dot
          d3.select(this).attr("stroke",'rgba(57,57,57,1)')
        })
        .on("mouseout",function(d) {
          d3.select("#"+d[3]).remove()
          d3.select(this).attr("stroke",'rgba(57,57,57,0)')
        })
}


$(document).ready(function () {
  $(document).foundation();
  fetchData()
  Foundation.reInit('tabs');
}
)
