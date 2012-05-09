/* BYU-I Campus Map */
/* 4.10.2012 */

// LOADING SECTION
  // GLOBAL VARS

  //var map;
  var categories = new Array();
  var categoryItems = new Array();

  var markerCatArray = new Array();
  var markers = new Array();
  var markerArray = new Array();

  var infoWindow;
  var mapBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(43.811265, -111.786779),
    new google.maps.LatLng(43.821521, -111.778185));

  // LOAD JSON AND KML FILES INTO VAR
  /* changed JSON file to txt to get past lehi server filetype filters */
  var objectFile = 'data/objectFile.txt';
  var polygonFile = 'http://www2.byui.edu/Map/parking_data.xml';
  var campusFile = 'http://www2.byui.edu/Map/BYU-IdahoCampus.xml';

  var parkingLayer;

  //html5 video detection
  var noHtmlVideo = false;
  if (Modernizr.video) {
    // let's play some video!
    html5Video = true;
  } else {
    // no native video support available :(
    html5Video = false;
  }


// POPULATE CATEGORY LIST

function listCategories() {

    // Assign handlers immediately after making the request
    $.getJSON(objectFile, function(data) {

      categories = data.info.categories;
      categoryItems = data.dataObjects;

      $.each(categories, function(i, s) {

        var id = s.ID;
        var name = s.name;
        var title = s.title;
        var text = s.text;
        var icon = s.icon;

        $('<div class="marker_category" class="white"/>')
        .html('<a href="#" class="marker_category_a" name="catIndex_' + i + '" id="category_' + name + '">' +
          '<img class="cat_icon" src="images/icons/' + icon + '" alt="' + id + '"/>' +
           title + '<span class="cat_indicator">&nbsp;</span></a><div id="category_div_' +
           name + '" class="hidden"/>')
        .appendTo('#categories');

        markerArray[i - 0] = new Array();
        markerArray[name + '_bounds'] = new Array();

      });/*end each loop*/

    })
    // JSON XHR error handlers
    .success(function() {console.log('json success')})
    .error(function() {console.log('json failed')})
    .complete(function() {console.log('json completed')});//end getJSON main

  }/* end listCategories() */


// CACHE SECONDARY RESOURCES?


// LOAD MAP (INIT)

  // INIT SETTINGS
  var myLatlng = new google.maps.LatLng(43.814188, -111.783515);
  var myOptions = {
    maxZoom: 18,
    zoom: 17,
    center: myLatlng,
    mapTypeId: google.maps.MapTypeId.HYBRID,
    mapTypeControlOptions: {
      mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.TERRAIN]
    }
  };

  // INIT
  function initialize() {

    map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);

    infoWindow = new google.maps.InfoWindow();
    listCategories();

    //load campus boundary map layer
    campusLayer = new google.maps.KmlLayer(campusFile);
    campusLayer.setMap(map);

  }//end initialize()


// MAP FUNCTIONS

  // BEGIN CATEGORY POPULATION ROUTING
  function populateCategories(category, obj, catIndex) {

    //close any open info windows
    infoWindow.close();

    category = category.substring(9);
    catIndex = catIndex.substring(9);

    // Detect Existing Markers
    if ($.inArray(category, markerCatArray) != -1) {
      showHideCategory(category, obj, catIndex);
      windowResize();
    }
    else {
      if (category != 'parking') {
        //console.log("inside populate else (markers do not exist yet, launching loadPins() and showHideCategory())");
        loadPins(category, obj, false);
        showHideCategory(category, obj, catIndex);
        windowResize();
      } else {
        if (parkingLayer != '') {
          console.log("parkingLayer != ''");

          loadPolygonCategory(category, obj, true);
          showHideCategory(category, obj, catIndex);

          windowResize();
        }
        else {
          console.log("parkingLayer == ''");

          showHideCategory(category, obj, catIndex);

          windowResize();
        }
      }
    }

  } // end populateCategories()

  // POPULATE OBJECT CATEGORY AND MAP MARKERS
  function loadPins(category, obj, markersExist) {

    if (markersExist == false) {

      var catID = 'category not found';
      var defaultIcon = 'default.png';


      markerArray[markerArray.length] = perform(category);

      // extract important category info & defaults
      $.each(categories, function(i, s) {
        if (s.name == category) {

          defaultIcon = s.icon;
          catID = s.ID - 1;

        }
      });

      var catTarget = 'div#category_div_' + category;

      $('<div name="' + categories[catID].name + '_cat_description" class="cat_description"/>')
      .html('<div class="inner_desc">' + categories[catID].text + '</div>')
      .appendTo(catTarget);

      $('<ul class="object_list"/>').appendTo(catTarget);

          // create var for extending map bounds to fit all markers
          var bounds = new google.maps.LatLngBounds();

          // create building navigation list
          $.each(categoryItems[category], function(i, s) {

            var name = s.name;
            if (s.code) {var code = s.code;}
            var lat = s.lat;
            var lon = s.lon;
            if (s.info) {var info = s.info;}
            if (s.img) {
              if (s.img.indexOf(':') === -1) {
                var img = 'images/objects/' + category + '/' + s.img;
              }
              else {
                var img = s.img;
              }
            }
            if (s.video) {var video = s.video;}
            if (s.icon) {var icon = 'images/icons/' + s.icon;} else {var icon = 'images/icons/' + defaultIcon;}
            if (s.link) {var link = s.link;}
            if (s.code) {var id = category + '_' + code;}

            var marker = new google.maps.Marker({
              position: new google.maps.LatLng(lat, lon),
              map: map,
              title: name,
              icon: icon
            });

            markerArray[category + '_bounds'][markerArray[category + '_bounds'].length] = bounds;

            markerCatArray[markerCatArray.length] = category;

            markerArray[catID][markerArray[catID].length] = marker;

            var target = 'div#category_div_' + category + ' ul';

            // create building navigation list
            $("<li name='" + id + "'/>")
            .html('<img src="' + icon + '" alt="' + id + '"/><span class="object_name">' + name + '</span>')
            .click(function() {
              displayPoint(marker, i);
            })
            .appendTo(target);

            // Listener that builds the infopane popups on marker click
            google.maps.event.addListener(marker, 'click', function() {

          // Check to see if an InfoWindow already exists
          if (!infoWindow) {
            infoWindow = new google.maps.InfoWindow();
          }

          // Create the info panes which hold content about each building
          var content = '<div id="' + category + '_info" class="infopane">' +
          '<h2>' + name + '</h2>' +
          '<div>';
          if (img)
          {
            content += '<img src="' + img + '" alt="' + name + '" width="40%"/>';
          }
          if (video)
            /* If no html video support detected, play quicktime video using quicktime plugin */
            if (html5Video !== true)
            {
              content += '<iframe src="video/objects/' + '/' + category + '/' + video + '.mov"></iframe><br/>';
            }
            /* If html5 video supported is detected, play with one of the two following formats to cover all modern browsers */
            else {
            content += '<video width="100%" id="' + category + '_id "class="html5_video" controls autoplay preload >' +
                         '<source src="video/objects/' + '/' + category + '/' + video + '.mp4" type="video/mp4;" codecs="avc1.42E01E, mp4a.40.2" width="100%" />' +
                         '<source src="video/objects/' + '/' + category + '/' + video + '.webm" type="video/webm;" codecs="vp8, vorbis" width="100%" />' +
                         'Your browser does not support the <code>video</code> element.' +
                       '</video><br/>';
            }
          if (info)
          {
            content += info;
          }
          if (link)
          {
            content += '<br/><a href="' + link + '">More information about ' + name + ' on the web</a>';
          }
          content += '</div>' +
          '</div>';

          // Set the content of the InfoWindow
          infoWindow.setContent(content);

          // Open the InfoWindow
          infoWindow.open(map, marker);
          
          fitToMarkers(markerArray[catID]);

          
          
          console.log("after v.play()");

            }); //end click listener
            //fitToMarkers(markerArray[])
      });//end markers each loop

      //fitToMarkers(markerArray[catID]);

    }//end if markersExist

  } //end loadPins()

  // POPULATE POLYGON CATEGORY AND MAP DATA
  function loadPolygonCategory(category, obj, layerExists) {
    //load key items in navigation
    var catID = 'category not found';
    var defaultIcon = '<div class="polygon_key" style="border-color:black;background-color:black">&nbsp;</div>';

    markerArray[markerArray.length] = perform(category);

    // extract important category info & defaults
    $.each(categories, function(i, s) {
      if (s.name == category) {

        defaultIcon = s.icon;
        catID = s.ID - 1;
      }
    });

    markerCatArray[markerCatArray.length] = category;

    var catTarget = 'div#category_div_' + category;

    $('<div name="' + categories[catID].name + '_cat_description" class="cat_description"/>')
    .html(categories[catID].text)
    .appendTo(catTarget);

    $('<ul class="polygon_list"/>').appendTo(catTarget);

        //category content building loop
        $.each(categoryItems[category], function(i, s) {

      //pull data for layer's key
      var name = s.name;
      var contains = s.contains;
      var borderColor = s.borderColor;
      var fillColor = s.fillColor;

      // push category to array to check if populated later

      markerCatArray[markerCatArray.length] = category;

          //build polygon key icon
          var icon = '<div class="polygon_key" style="border-color:' + borderColor + ';background-color:' + fillColor + '">&nbsp;</div>';

          //specify target to insert html into
          var target = 'div#category_div_' + category + ' ul';

          // create building navigation list
          $('<li name="polygon_' + name + '" title="' + contains + '"/>')
          .html(icon + '<span class="polygon_name">' + name + '</span>')
          .appendTo(target);

        });

    //load map layer
    parkingLayer = new google.maps.KmlLayer(polygonFile);

    // google.maps.event.addListener(parkingLayer, "metadata_changed", function() {
    //     console.log("metadata_changed");
    // });

console.log('end loadPolygonCategory()');

  }// end loadPolygonCategory()

  // CATEGORY OPEN AND CLOSE
  function showHideCategory(category, obj, catIndex, bounds) {

    // COLLAPSE/SHOW CHILD OBJECT LIST
    obj.stop().slideToggle();
    obj.toggleClass('hidden');
    obj.siblings('a.marker_category_a').children('span.cat_indicator').toggleClass('active');

    // IF Polygons
    if (category == 'parking') {

      //Hide this layer's polygons
      console.log('category == parking');

      if (obj.attr('class') == 'hidden') {
        console.log('obj == hidden, set map to null');
        parkingLayer.setMap(null);
      }
      //Show this layer's polygons
      else {
        console.log('obj != hidden, set map to show');
        parkingLayer.setMap(map);
      }

    }
    // IF objects
    else {
      // ERASE / HIDE THIS CATEGORY'S MARKERS
      if (obj.attr('class') == 'hidden') {
        for (var i in markerArray[catIndex]) {
          markerArray[catIndex][i].setVisible(false);
        }
      }
      else {
        for (var i in markerArray[catIndex]) {
          fitToMarkers(markerArray[catIndex]);
          markerArray[catIndex][i].setVisible(true);
        }
      }
    }

    // ELSE (POLYGON AREAS)
      // ERASE / HIDE THIS CATEGORY'S POLYGONS

  }//end showHideCategory()

  // OBJECT SELECT AND DISPLAY
  function displayPoint(marker, index) {

    $('#message').hide();

    var moveEnd = google.maps.event.addListener(map, 'moveend', function() {
      var markerOffset = map.fromLatLngToDivPixel(marker.getPosition());
      $('#message')
      .fadeIn()
      .css({ top: markerOffset.y, left: markerOffset.x });
      google.maps.event.removeListener(moveEnd);
    });
    map.panTo(marker.getPosition());
    google.maps.event.trigger(marker, 'click');
    
    console.log("inside displayPoint");
    // $('video')[0].load( function(){
    //   this.play();
    // });
    console.log("after play");
  }/* END displayPoint() */

// GENERAL FUNCTIONS

  //function for passing array values through other object/function args cleanly
  function perform(array_name) {
    return this[array_name];
  }//end perform()

  

  // Pan & Zoom map to show all markers
  function fitToMarkers(markers) {

    var bounds = new google.maps.LatLngBounds();

      // Create bounds from markers
      for (var index in markers) {
        var latlng = markers[index].getPosition();
        bounds.extend(latlng);
      }

      // Don't zoom in too far on only one marker (zoomed out too far for the relative size of our campus...)
      // if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
      //    var extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + 0.01, bounds.getNorthEast().lng() + 0.01);
      //    var extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - 0.01, bounds.getNorthEast().lng() - 0.01);
      //    bounds.extend(extendPoint1);
      //    bounds.extend(extendPoint2);
      // }

      map.fitBounds(bounds);

  }//end fitToMarkers()

  // Resize map pane to fit with menu width
  function windowResize() {
  //$(function() {  
    // if ($('body').width() < 768) {
      
    //   console.log("mobile view");

    //   var bodyWidth = $('body').width();
    //   $('#map_canvas').css("width","100%");
    //   //$('#menu').css("width":"90%","position":"fixed","right": "-90%");

    // } else {

      console.log("desktop view");

      var menuWidth = $('#menu').width() + 20;
      //var mapWidth = $('#map_canvas').width();
      var bodyWidth = $('body').width();
      $('#map_canvas').width(bodyWidth - menuWidth);
      //$('#menu').css("width":"300px","position":"relative","right": "0");
    }
    
  //});//end windowResize()

// BINDINGS
$(window).load(function() {

    //initialize map when page loads
    initialize();
    //resize window when page loads
    windowResize();

    //bind category populating and hide/show to the menu item
    $('.marker_category_a').live('click', function() {

      category = $(this).attr('id'),
      obj = $(this).siblings('div'),
      catIndex = $(this).attr('name');

      populateCategories(category, obj, catIndex);

    });



  });//end (window).load()

  // resize map pane when window is resized to fit menu
  window.onresize = function() {
    windowResize();
  };//end window.onresize()
  
  

    // $('video').load( function() {
    //   var obj = $('video'); 
    //   obj[0].play();
    //   obj.attr('title','autoplay');
    // });
 
  // SELECT & PAN TO OBJECT FROM EXTERNAL SOURCE (FUTURE FEATURE)
    // OPEN / SHOW INFO PANE (should already be populated from when category was opened)
    // WRITE OBJECT ID TO URL HISTORY







