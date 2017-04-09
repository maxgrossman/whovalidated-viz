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
}
// function that builds validator groups bar chart

$(document).ready(function () {
  $(document).foundation();
  fetchData()
  Foundation.reInit('tabs');
}
)
