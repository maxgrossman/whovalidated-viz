// function to generate filters to visualize different barcharts
counter=0;
function filter() {
  // for all other instaces less the page load instance, filter what to draw
  if(counter>0) {
    activeFilters = []
    // add selected filters in checkboxes to activeFilters
    checkboxes = $("#filter-nav-tabs input[type=checkbox]");
    for (i=0; i<checkboxes.length; i++) {
      if(checkboxes[i].checked === true) {
        activeFilters.push({
          filterKey: checkboxes[i].name,
          filterValue: checkboxes[i].value
        })
      }
    }
    // get keys in activeFilters obj as list by setting filter value as key, then
    // mapping those keys to a list
    activeFiltersLST = d3.nest().key(function(d){return d.filterValue})
      .entries(activeFilters).map(function(d){return d.key})
    // separate this filter list into those defining validator groups and variables
    groupFilter = activeFiltersLST.filter(
      function(d){if(parseInt(d))return d}
    ).sort(function(a,b){return parseInt(a[1])<parseInt(b[1]);});
    variableFilter = activeFiltersLST.filter(
      function(d){if(!(parseInt(d)))return d}
    )
  }
  else {
   variableFilter = Object.keys(validatorData.values()[0]).filter(
        function(a){if(!(a.match(/pca/))){return a}}).filter(
        function(a){if(!(a.match(/user/))){return a}}).filter(
        function(a){if(!(a.match(/class/))){return a}})
  }
  counter++
  variableGraphDraw()
}

// function to set rename variable names where relevant
function variableTitles(d) {
  if(Array.isArray(d)) {
    if(d.length===1) {
      graphTitle = variableFilter[0] === "acct_age" ? 'Days Mapping' :
      variableFilter[0] === "validations" ? 'Validated Squares' :
      variableFilter[0] === "mapping_freq" ? 'Mapping Frequency' : '';
    }
  } else {
    graphTitle = d === "acct_age" ? 'Days Mapping' :
    d === "validations" ? 'Validated Squares' :
    d === "mapping_freq" ? 'Mapping Frequency' : '';
  }
  return graphTitle
}

// function to clear all checked boxes
function clearAllCheckboxes(){
  var allCheckboxes = $.find("input:checkbox");
  $.each(allCheckboxes, function(i, box){ $(box).prop('checked',false); });
  filter();
}
// function to fetch
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
  variables = Object.keys(validatorData.values()[0]).filter(
    function(a){if(!(a.match(/pca/))){return a}}).filter(
    function(a){if(!(a.match(/user/))){return a}}).filter(
    function(a){if(!(a.match(/class/))){return a}})
  // change variable names in dropdown
  variablesText = variables.map(function(d) {return variableTitles(d)})
  for(i=0;i<variables.length;i++) {
    variables[i] = '<div class="checkbox"><label><input type="checkbox" value="' +
    variables[i] + '" onchange="filter()">' + variablesText[i] + '</label></div><br>'
  }
  $('#filter-nav-tabs').append(
    '<div class="tabs-panel" id="variable">' + variables.join('') + '</div>'
  )
  filter()
  validatorScatter()
}
// function that builds validator groups scatter plot
function validatorScatter() {
  // get height, width, and margins based on div
  scattHWplus = {top: 100, right: 100, bottom: 100, left: 100,
    height: $('#validatorScatter').innerWidth() - 100,
    width: $('#validatorScatter').innerWidth() - 100 };
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

    // add title
    scattSVG.append("text")
      .attr("x",scattHWplus.width/2)
      .attr("y", -30)
      .attr("text-anchor",'middle')
      .text('Validator Groups')
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

    // add legend
    var legend = scattSVG.selectAll('.legend')
        .data(scattDPs).enter()
        .append('g')
        .attr('class','legend')
        .attr('transform',function(d,i){
          var height = 22;
          var offset = height * scattDPs.length/2;
          var horz = -2 * 18;
          var vert = i * 14;
          return 'translate(' + (scattHWplus.width + horz*3) + ','
          +  ((scattHWplus.width-30) - vert) + ')'
        });

      legend.append('rect')
        .attr('width',18)
        .attr('height',18)
        .style('fill',function(d){return d3.schemeCategory10[d[2]]});

      legend.append('text')
        .attr("x", 22)
        .attr('y', 14)
        .attr("font-size","10px")
        .text(function(d,i) {
          validatorType = d[2] === "1" ? 'Non Validator' :
          d[2] === "2" ? 'Frequent Validator' :
          d[2] === "3" ? 'Master Validator' : '';
          return validatorType })


    // draw scatter plot and add interactivity
    scattSVG.selectAll('.scattDot')
      .data(scattDPs)
      .enter().append("circle")
        .attr("class","scattDot")
        .attr("r",4)
        .attr("cx",function(d,i){return scattXScale(d[0])})
        .attr("cy",function(d,i){return scattYScale(d[1])})
        .attr("fill",function(d){return d3.schemeCategory10[d[2]]})
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
            .attr("y",mouseCoords[1]-10)
            .style("font-size","10px")
            .text(function() {return d[3]})

          //focus on current scatter .dot
          d3.select(this).attr("stroke",'rgba(57,57,57,1)')
        })
        .on("mouseout",function(d) {
          d3.select("#"+d[3]).remove()
          d3.select(this).attr("stroke",'rgba(57,57,57,0)')
        })

}

// function to draw variable graph after filters selected
function variableGraphDraw() {
  // remove current graph before adding the new one
  d3.select("#variableBar").select("svg").remove();
  // function to choose graph title

  // decide how to draw graphs. when just one variable, draw normal bar
  // when more than one to be drawn; normalize, then stack ba
  if(variableFilter.length===1){
    // get list of bar chart values and user_name to draw
    barVar = d3.values(validatorData).map(
      function(d){return [d.user_name, d[variableFilter[0]],d.class]}).filter(
      function(d){if(typeof(d[1])==='string')return d}
    ).sort(function(a,b){return parseInt(a[1])<parseInt(b[1]);})

    // if trying to filter by group, subset list to only include
    if(groupFilter.length>0) {
      barVar = barVar.filter(function(group) {
        return groupFilter.map(Number).includes(parseInt(group[2]))}
      );
    }

    // add graph svg to div
    // add scatter to #validatorScatter div
    var varBarGraph = d3.select("#variableBar").append("svg")
      .attr("width",scattHWplus.width + scattHWplus.left + scattHWplus.right)
      .attr("height", scattHWplus.height + scattHWplus.bottom + scattHWplus.bottom)
      .append('g').attr("transform","translate(" +
        scattHWplus.left + "," + scattHWplus.top + ")")

      // make scales/axes
      barVarXScale = d3.scaleLinear()
        .domain([0,d3.max(barVar,function(d){return parseInt(d[1])})])
        .range([0,scattHWplus.width]);
      barVarYScale = d3.scaleBand()
        .domain(barVar.map(function(d) {return d[0]}))
        .range([0, scattHWplus.height])
        .padding(0.1);


      barVarXAxis = d3.axisBottom().scale(barVarXScale)
      barVarYAxis = d3.axisLeft().scale(barVarYScale);

      varBarGraph.append("g")
        .attr("class","x kaxis")
        .attr("transform","translate(0," + scattHWplus.height + ")")
        .call(barVarXAxis)
      varBarGraph.append("g")
        .attr("class","y kaxis")
        .call(barVarYAxis)
      // add the bars and rects for chart
      var bars = varBarGraph.selectAll(".bar")
        .data(barVar)
        .enter()
        .append("g")
      bars.append("rect")
        .attr("class","bar")
        .attr("y",function(d) {
          return (barVarYScale(d[0])+(barVarYScale.bandwidth()/4))
        })
        .attr('x',0)
        .attr("height",barVarYScale.bandwidth()/2)
        .attr("width", function(d) {return barVarXScale(d[1])})
        .attr('fill',function(d) {return d3.schemeCategory10[d[2]]})
        .on('mouseover',function(d){
          // add validator text to svg
          varBarGraph.append("text")
            .attr("id",d[0])
            .attr("x",barVarXScale(d[1])+4)
            .attr("y", (barVarYScale(d[0])+(barVarYScale.bandwidth()/2)))
            .style("font-size","12px")
            .text(d[1])
          d3.select(this).attr("stroke",'rgba(57,57,57,1)')
        })
        .on('mouseout',function(d){
          d3.select("#"+d[0]).remove()
          d3.select(this).attr("stroke",'rgba(57,57,57,0)')
        })

      // add title
      varBarGraph.append("text")
        .attr("x",scattHWplus.width/2)
        .attr("y", -30)
        .attr("text-anchor",'middle')
        .text(function(){return variableTitles(variableFilter)})
  }

}


$(document).ready(function () {
  $(document).foundation();
  fetchData()
  Foundation.reInit('tabs');
}
)
