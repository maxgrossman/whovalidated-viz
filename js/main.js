// function to fetch data
function fetchData() {
  d3.tsv('../data/testvalidates.csv',function(data) {
    validatorData = d3.map(data, function(d){return d.class})
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
    thisClass = '<div class="checkbox"><label><input type="checkbox" onchange="filter()">' + validatorData.keys()[i] + '</label></div><br>'
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
    variables[i] = '<div class="checkbox"><label><input type="checkbox" onchange="filter()">' + variables[i] + '</label></div><br>'
  }
  $('#filter-nav-tabs').append(
    '<div class="tabs-panel" id="variable">' + variables.join('') + '</div>'
  )
}


$(document).ready(function () {
  $(document).foundation();
  fetchData()
  Foundation.reInit('tabs');
}
)
