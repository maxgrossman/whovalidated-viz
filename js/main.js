// function to generate filters to visualize different barcharts
counter=0;
function filter() {
  // for all other instaces except the page load instance, filter what to draw
  if(counter>0) {
    activeFilters = []
    // add selected filters in checkboxes to activeFilters
    checkboxes = $("#filter-nav-tabs input[type=checkbox]");
    for (i=0; i<checkboxes.length; i++) {
      if(checkboxes[i].checked === true) {
        activeFilters.push({
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
      function(d){if(parseInt(d)>=0)return d}
    )
    if(groupFilter.length>1){
        groupFilter.sort(function(a,b){return parseInt(a[1])<parseInt(b[1]);});
    }
    variableFilter = activeFiltersLST.filter(
      function(d){if(!(parseInt(d)>=0))return d}
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
      graphTitle = d === "acct_age" ? 'Days Mapping' :
      d === "validations" ? 'Validated Squares' :
      d === "build_count_add" ? 'Added Buildings' :
      d === "build_count_mod" ? 'Modified Buildings':
      d === "changesets" ? 'Changesets' :
      d === "josm_edits" ? 'JOSM Edits' :
      d === "poi_count_add" ? 'Points of Interest Added' :
      d === "road_km_add" ? 'Road Added (km)' :
      d === "road_km_mod" ? 'Road Modified (km) ' :
      d === "waterway_km_add" ? 'Waterway Added (km)' :
      d === "mapping_freq" ? 'Mapping Frequency' : '';
      return graphTitle
}

// functoin to properly label x axis for horizontal bar
function variableAxisTitle(d) {
      axisLabel = d === "acct_age" ? 'days' :
      d === "validations" ? 'sqaures' :
      d === "build_count_add" ? 'buildings' :
      d === "build_count_mod" ? 'buildings':
      d === "changesets" ? 'changesets' :
      d === "josm_edits" ? 'edits' :
      d === "poi_count_add" ? 'points of interest' :
      d === "road_km_add" ? 'road (km)' :
      d === "road_km_mod" ? 'km (km)' :
      d === "waterway_km_add" ? 'waterway (km)' :
      d === "mapping_freq" ? 'frequency (days)' : '';
      return axisLabel
}

// similar to variableTitles, but for group titles
function groupTitle(k) {
  keyTitle = k === '0' ? 'Non Validator' :
   k === '1' ? 'Frequent Validator' :
   k === '2' ? 'Master Validator' : ''
  return keyTitle
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
  d3.csv('../data/validatorsPCAclassified.csv',function(data) {
    validatorData = d3.map(data, function(d){return d.user_name})
    console.log(validatorData)
    // build tabs
    fillClassFieldTabs()
  })
}

// function that builds out class and field tabs
function fillClassFieldTabs() {
  // fill the validator group tab with validator groups checkboxes
  keys = d3.values(validatorData).map(
    function(d){return d.kmeansClassc1c2}).filter(
    function(d){if(typeof(d)==="string") {return d}
  })
  // TODO: MAKE THIS WORK IN SAFARI
  keys = $.unique(keys)
  classTab = []
  for(i=0;i<keys.length;i++) {
    keyTitle = groupTitle(keys[i])
    thisClass = '<div class="checkbox"><label><input type="checkbox" value="' +
    keys[i] + '" onchange="filter()">' + keyTitle + '</label></div><br>'
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
  // final column is classes, we already gave that its own drop down so not here
  variables = variables.slice(4,10).filter(function(a){if(!(a.match(/freq/))){return a}})
  // change variable names in dropdown
  variablesText = variables.map(function(d) {return variableTitles(d)})
  for(i=0;i<(variables.length);i++) {
    variables[i] = '<div class="checkbox"><label><input type="checkbox" value="' +
    variables[i] + '" onchange="filter()">' + variablesText[i] + '</label></div><br>'
  }
  $('#filter-nav-tabs').append(
    '<div class="tabs-panel" id="variable">' + variables.join('') + '</div>'
  )
  filter()
  validatorScatter()
}

// get height, width, and margins based on div
var scattHWplus = {top: 100, right: 100, bottom: 100, left: 40,
  height: $('#validatorScatter').innerWidth(),
  width: $('#validatorScatter').innerWidth() };

// function that builds validator groups scatter plot
function validatorScatter() {
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
    pcaX = d3.values(validatorData).map(function(d){return d.c1})
      .filter(function(d){if(typeof(d)==='string')return d})
    pcaY = d3.values(validatorData).map(function(d){return d.c2})
      .filter(function(d){if(typeof(d)==='string')return d})

    // make scattXScale and scattYScale & scattXAxis and scattYAxis
    scattXScale = d3.scaleLinear()
      .domain([d3.min(pcaX.map(Number))
              ,d3.max(pcaX.map(Number))])
      .range([0,(scattHWplus.width)]);
    scattYScale = d3.scaleLinear()
      .domain([d3.min(pcaY.map(Number))
              ,d3.max(pcaY.map(Number))])
      .range([scattHWplus.height,0]);
    scattXAxis = d3.axisBottom().scale(scattXScale)
    scattYAxis = d3.axisLeft().scale(scattYScale);

    // draw x and y axes
    scattSVG.append("g")
      .attr("class","x kaxis")
      .attr("transform","translate(0," + scattHWplus.height + ")")
      .call(scattXAxis)
    scattSVG.append("g")
      .attr("class","y kaxis")
      .call(scattYAxis)

    // label axes
    scattSVG.append('text')
      .attr('class','y label')
      .attr('text-anchor','end')
      .attr('y', -40)
      .attr('dy','.75em')
      .attr('transform','rotate(-90)')
      .text('First Principal Component')
    scattSVG.append('text')
      .attr('class','x label')
      .attr('text-anchor','end')
      .attr('x', scattHWplus.width-(scattHWplus.right-35))
      .attr('y', scattHWplus.height+30)
      .attr('dy','.75em')
      .text('Second Principal Component')

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
        validatorData["$"+validatorData.keys()[i]].kmeansClassc1c2,
        validatorData["$"+validatorData.keys()[i]].user_name,
      ]
      scattDPs.push(scattDP)
    }

    // add legend
    var legend = scattSVG.selectAll('.legend')
        .data(keys).enter()
        .append('g')
        .attr('class','legend')
        .attr('transform',function(d,i){
          var vert = i * 14;
          return 'translate(10' + ','
          +  (vert) + ')'
        });

      legend.append('rect')
        .attr('width',18)
        .attr('height',18)
        .style('fill',function(d){return d3.schemeCategory10[d]});

      legend.append('text')
        .attr("x", 22)
        .attr('y', 14)
        .attr("font-size","10px")
        .text(function(d) { return groupTitle(d) })

    // draw scatter plot and add interactivity
    scattSVG.selectAll('.scattDot')
      .data(scattDPs)
      .enter().append("circle")
        .attr("class","scattDot")
        .attr("r",4)
        .attr("cx",function(d,i){return scattXScale(d[0])})
        .attr("cy",function(d,i){return scattYScale(d[1])})
        .attr("fill",function(d){return d3.schemeCategory10[d[2]]})
        .attr("fill-opacity", '0.6')
        .on("mouseover", function(d) {
          // get mouse coordinates to place tooltip
          mouseCoords = d3.mouse(this)
          //get username as username less the spaces
          id = d[3].replace(/\s/g, '').replace(/\W/g, '').replace(/\d/g,'')
          // add validator text to svg
          scattSVG.append("text")
            .attr("id",id)
            .attr("x",mouseCoords[0] + 10)
            .attr("y",mouseCoords[1]-10)
            .style("font-size","10px")
            .text(function() {return d[3]})

          //focus on current scatter .dot
          this.parentElement.appendChild(this);
          d3.select(this)
            .attr("stroke",'rgba(250,250,250,1)')
            .attr("fill-opacity", '0.9')

        })
        .on("mouseout",function(d) {
          d3.select("#"+id).remove()
          d3.select(this)
            .attr("stroke",'rgba(250,250,250,0)')
            .attr("fill-opacity", '0.6')
        })

}

// function to draw variable graph after filters selected
function variableGraphDraw() {
  // remove current graph before adding the new one
  d3.select("#variableBar").select("svg").remove();
  // decide how to draw graphs. when just one variable, draw normal bar
  // when more than one to be drawn; normalize, then stack ba
  // build the graph
  var varBarGraph = d3.select("#variableBar").append("svg")
    .attr("width",scattHWplus.width + scattHWplus.left + scattHWplus.right)
    .attr("height", scattHWplus.height + scattHWplus.bottom + scattHWplus.bottom)
    .append('g').attr("transform","translate(" +
      scattHWplus.left + "," + scattHWplus.top + ")")

  if(variableFilter.length===1){
    // if trying to filter by group, subset list to only include
    // get list of bar chart values and user_name to draw

    barVar = validatorData.values().map(function(d)
      {return _.pick(d,['user_name', 'kmeansClassc1c2', variableFilter[0]])}).sort(function(a,b)
      {return parseInt(b[variableFilter[0]])-parseInt(a[variableFilter[0]]);})

    barVar = _.groupBy(barVar,'kmeansClassc1c2')

    if(groupFilter.length>0) {
      barVar = d3.values(_.pick(barVar,groupFilter))[0]
      if(groupFilter.length>1) {
        barVar = barVar[groupFilter[0]].concat(barVar[groupFilter[1]])
      } else {}
    } else {
      barVar = barVar[2].concat(barVar[1]).concat(barVar[0])
    }
    
      // make scales/axes
      barVarXScale = d3.scaleLinear()
        .domain([0,d3.max(barVar,function(d)
          {return parseInt(d[variableFilter[0]])})])
        .range([0,scattHWplus.width]);
      barVarYScale = d3.scaleBand()
        .domain(barVar.map(function(d) {return d.user_name}))
        .range([0, scattHWplus.height])
        .padding(0.1)

      barVarXAxis = d3.axisBottom()
        .scale(barVarXScale)
      barVarYAxis = d3.axisLeft()
        .scale(barVarYScale)
        .tickFormat(function (d) { return ''; });



      varBarGraph.append("g")
        .attr("class","x kaxis")
        .attr("transform","translate(0," + scattHWplus.height + ")")
        .call(barVarXAxis)
      varBarGraph.append("g")
        .attr("class","y kaxis")
        .call(barVarYAxis)
      varBarGraph.append('text')
        .attr("x",scattHWplus.width/2.2)
        .attr("y",-50)
        .text(variableTitles(variableFilter[0]))
      // add the bars and rects for chart
      var bars = varBarGraph.selectAll(".bar")
        .data(barVar)
        .enter()
        .append("g")

      bars.append("rect")
        .attr("class","bar")
        .attr("y",function(d) {
          return (barVarYScale(d.user_name)+(barVarYScale.bandwidth()/4))
        })
        .attr('x',0)
        .attr("height",barVarYScale.bandwidth()/2)
        .attr("width", function(d) {return barVarXScale(
          parseInt(d[variableFilter[0]])
        )})
        .attr('fill',function(d) {return d3.schemeCategory10[d.kmeansClassc1c2]})
        .on('mouseover',function(d){
          barClass = d.kmeansClassc1c2
          barVariable = d[variableFilter[0]]
          // add validator text to svg
          id = d.user_name.replace(/\s/g, '').replace(/\W/g, '').replace(/\d/g,'')
          d3.select(this).attr("height",barVarYScale.bandwidth()*2)
          varBarGraph.append("rect")
            .attr("id", id)
            .attr("class","bar")
            .attr("y",-20)
            .attr('x',0)
            .attr("height",barVarYScale.bandwidth()*8)
            .attr("width", barVarXScale(barVariable))
            .attr('fill',function(d) {return d3.schemeCategory10[barClass]})
          varBarGraph.append("text")
            .attr("id",id)
            .attr("y",-25)
            .attr('x',barVarXScale(barVariable)/2)
            .style("font-size","12px")
            .text(d.user_name + ": " + d[variableFilter[0]]
             + " " + variableAxisTitle(variableFilter[0]))
        })
        .on('mouseout',function(d){
          d3.select(this).attr("height",barVarYScale.bandwidth()/2)
          d3.select("#"+id).remove()
          d3.select("#"+id).remove()
        })

      // add title
      varBarGraph.append("text")
        .attr("x",scattHWplus.width/2)
        .attr("y", -30)
        .attr("text-anchor",'middle')
        .text(variableTitles(variableFilter))

      // legend title too
      varBarGraph.append('text')
        .attr('class','x label')
        .attr('text-anchor','end')
        .attr('x', scattHWplus.width-20)
        .attr('y', scattHWplus.height+30)
        .attr('dy','.75em')
        .text(variableAxisTitle(variableFilter[0]))
      varBarGraph.append('text')
        .attr('class','y label')
        .attr('text-anchor','end')
        .attr('y', -40)
        .attr('dy','.75em')
        .attr('transform','rotate(-90)')
        .text('OSM Users')
  }
  else {
    barVar = validatorData.values().map(function(d){
		    return _.pick(d,['user_name', 'class'].concat(variableFilter))
    })
    for(var bar in barVar) {
      if(barVar.hasOwnProperty(bar)){
        barVar[bar][barVar[bar].class] = {}
        barVar[bar][barVar[bar].class][barVar[bar].user_name] = _.omit(barVar[bar],
          ['user_name','class',barVar[bar].class]
        )
        barVar[bar] = _.pick(barVar[bar],[barVar[bar].class])
      }
    }
    var BarKeys = _.keys(d3.values(d3.values(barVar[0])[0])[0])
    // function to normalize each value before mapping.
    // takes each value from each of the users, normalizes them,
    // then slices them by number of slices such that
    // the normalized range for a given variable is scaled to 1 divided by
    // number of variables being mapped.
    // this way, the max value stays at 1, and a max value for a category
    // is 1/slices. this is not true to analysis per say, but it allows
    // a way to visualize how well different people do in different
    var validators = barVar.map(function(d) {return _.keys(d3.values(d)[0])[0]})
    var normVals;
    function normalizeValues() {
      slices = BarKeys.length
      // normalize each users' values for given variable based on other users'
      _.forEach(d3.values(d3.values(barVar[0])[0])[0],function(key,value){
        normVals = []
        // push ith element for each user to a normVals list
        for(j=0;j<barVar.length;j++){
          normVals.push(parseInt(d3.values(d3.values(barVar[j])[0])[0][value]))
        }
        range = (d3.max(normVals) - d3.min(normVals))
        min = d3.min(normVals)
        normVals = normVals.map(function(d){
          normalized = (d-min)/range
          nomalizedSliced = normalized/slices
          return nomalizedSliced
        })
        // take the normalized values and add them back to the users.
        for(j=0;j<barVar.length;j++){
          d3.values(d3.values(barVar[j])[0])[0][value] = normVals[j]
        }
      })
      // sort based on largest sum of variables
      barVar.sort(function(a,b){
        // sum the normalized stacks for a and b
        a = d3.values(a)[0][(_.keys(d3.values(a)[0])[0])]
        a = d3.values(a).reduce(function(a,b){return a + b},0)
        b = d3.values(b)[0][(_.keys(d3.values(b)[0])[0])]
        b = d3.values(b).reduce(function(a,b){return a + b},0)
        return a<b
      })
    }
    normalizeValues()
    // make scales/axes
    barVarXScale = d3.scaleLinear()
       .domain([0,1])
       .range([0,scattHWplus.width]);
    barVarYScale = d3.scaleBand()
       .domain(validators)
       .range([0, scattHWplus.height])
       .padding(0.1);
    barVarColorScale = d3.scaleOrdinal()
      .domain(keys)
      .range(d3.schemeCategory10.slice(0,slices))
    barVarXAxis = d3.axisBottom().scale(barVarXScale)
    barVarYAxis = d3.axisLeft().scale(barVarYScale);
    var stack = d3.stack()
      .keys(BarKeys)(barVar.map(function(d)
      { return d3.values(d)[0][(_.keys(d3.values(d)[0])[0])] }))
    varBarGraph.append("g")
       .attr("class","x kaxis")
       .attr("transform","translate(0," + scattHWplus.height + ")")
      .call(barVarXAxis)
    varBarGraph.append("g")
      .attr("class","y kaxis")
      .call(barVarYAxis)
    varBarGraph.append("g")
      .selectAll('g')
      .data(stack)
      .enter().append("g")
        .attr("fill",function(d){return barVarColorScale(d.key)})
      .selectAll('rect')
      .data(function(d) {return d;})
      .enter().append('rect')
  }
}

//function for running scripts on page load
$(document).ready(function () {
  $(document).foundation();
  fetchData()
  Foundation.reInit('tabs');
})
