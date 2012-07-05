/* BYU-I Campus Map */
/* 07.05.2012 */

//mobile detection and handling
// Resize map pane to fit with menu width
  var mobile = 0;
  var menuOn = 0;

  if ($('body').width() < 950) {
    
    var mobile = 1;
    $('body').attr('id',"mobile");
    
    var menuWidth = $('#menu').width();
    //"height() - 100 / 2" below means map height - tab height / 2 to vertically center
    var vertCenter = ($('#map_canvas').height() - 100) / 2;
    $('#map_canvas').css("width","100%");
    $('#menu_tab').css(
      "top", vertCenter,
      "right", "85%"
    );

  } else {
    var mobile = 0;
  }
  //end mobile handling

// LOADING SECTION
  // GLOBAL VARS

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
  var polygonFile = 'http://www2.byui.edu/Map/parking_data2.xml';
  var campusFile = 'http://www2.byui.edu/Map/campus-outline.xml';

  var parkingLayer;

  //html5 video detection
  // var noHtmlVideo = false;
  // if (Modernizr.video) {
  //   // let's play some video!
  //   html5Video = true;
  // } else {
  //   // no native video support available :(
  //   html5Video = false;
  // }

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
        var type = s.type;
        var link = s.link;

        $('<div class="marker_category" class="white"/>')
        .html('<a href="#" class="marker_category_a" name="catIndex_' + i + '" id="category_' + name + '" alt="type_' + type + '">' +
          '<img class="cat_icon" src="images/icons/numeral-icons/' + icon + '/0.png" alt="' + id + '"/>' +
           title + '<span class="cat_indicator">&nbsp;</span></a><div id="category_div_' +
           name + '" class="hidden"/>')
        .appendTo('#categories');

        markerArray[i - 0] = new Array();
        markerArray[name + '_bounds'] = new Array();

      });/*end each loop*/

    })
    // JSON XHR error handlers
    .success(function() {/*console.log('json success')*/})
    .error(function() {/*console.log('json failed')*/})
    .complete(function() {/*console.log('json completed')*/});//end getJSON main

  }/* end listCategories() */


// CACHE SECONDARY RESOURCES?

// LOAD MAP (INIT)

  // INIT SETTINGS
  var myLatlng = new google.maps.LatLng( 43.815045, -111.783515);
  var myOptions = {
    //maxZoom: 18,
    zoom: 16,
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
    campusLayer = new google.maps.KmlLayer(campusFile,
                  {
                      suppressInfoWindows: true,
                      map: map,
                      preserveViewport: true,
                      zoom: 18
                  });
    campusLayer.setMap(map);

    //zoom in a bit more than usual
    //map.setZoom(map.getZoom() + 1);

  }//end initialize()

// MAP FUNCTIONS

  // BEGIN CATEGORY POPULATION ROUTING
  function populateCategories(category, obj, catIndex, type) {
    
    //close any open info windows
    infoWindow.close();
    category = category.substring(9);
    catIndex = catIndex.substring(9);

    // Detect Existing Markers
    if ($.inArray(category, markerCatArray) != -1) {
      showHideCategory(category, obj, catIndex, type);
      windowResize();
    }
    else {
      if (type == 0) {
        loadPins(category, obj, false);
        showHideCategory(category, obj, catIndex, type);
        windowResize();
      } else {
        if (parkingLayer != '') {
          loadPolygonCategory(category, obj, true);
          showHideCategory(category, obj, catIndex, type);
          windowResize();
        }
        else {
          showHideCategory(category, obj, catIndex, type);
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
      .html('<div class="inner_desc">' + categories[catID].text + '<br/><a class="cat_link" href="'+ categories[catID].link +'" target="_blank" >' + categories[catID].link + '</a></div>')
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
            if (s.icon) {var iconpath = 'images/icons/numeral-icons/' + s.icon;} else {var iconpath = 'images/icons/numeral-icons/' + defaultIcon;}
            if (s.link) {var link = s.link;}
            if (s.code) {var id = category + '_' + code;}

            var marker = new google.maps.Marker({
              position: new google.maps.LatLng(lat, lon),
              map: map,
              title: name,
              icon: iconpath + '/' + (i+1) + ".png"
            });

            markerArray[category + '_bounds'][markerArray[category + '_bounds'].length] = bounds;

            markerCatArray[markerCatArray.length] = category;

            markerArray[catID][markerArray[catID].length] = marker;

            var target = 'div#category_div_' + category + ' ul';

            // create object navigation list
            $("<li name='" + id + "'/>")
            .html('<img src="' + iconpath + '/' + (i+1) + '.png" alt="' + id + '"/><span class="object_name">' + name + '</span>')
            .click(function() {
              //console.log("this = " + $(this).parent().toggleClass('active_item'));
              
              $(this).siblings('li').removeClass('active_item');
              $(this).toggleClass('active_item');
              //console.log("obj = " + obj);
              displayPoint(marker, i);
            })
            .appendTo(target);

            // Listener that builds the infopane popups on marker click
            google.maps.event.addListener(marker, 'click', function() {

              // Check to see if an InfoWindow already exists
              if (!infoWindow) {
                infoWindow = new google.maps.InfoWindow();
              }
              //close menu to show object just selected
              if (mobile == 1 && menuOn == 1){
                closeMenu();
              }
              // Create the info panes which hold content about each building
              var content = '<div id="' + category + '_info" class="infopane">' +
              '<h2>' + name + '</h2>' +
              '<div>';
              if (img)
              {
                content += '<img src="' + img + '" alt="' + name + '" width="40%" style="float:right"/>';
              }
              // video content portion taken until a decent support model can be created
              // if (video)
              //   /* If no html video support detected, play quicktime video using quicktime plugin */
              //   if (html5Video !== true)
              //   {
              //     content += '<iframe src="video/objects/' + '/' + category + '/' + video + '.mov"></iframe><br/>';
              //   }
              //   /* If html5 video supported is detected, play with one of the two following formats to cover all modern browsers */
              //   else {
              //   content += '<video width="100%" id="' + category + '_id "class="html5_video" controls autoplay preload >' +
              //                '<source src="video/objects/' + '/' + category + '/' + video + '.mp4" type="video/mp4;" codecs="avc1.42E01E, mp4a.40.2" width="100%" />' +
              //                '<source src="video/objects/' + '/' + category + '/' + video + '.webm" type="video/webm;" codecs="vp8, vorbis" width="100%" />' +
              //                'Your browser does not support the <code>video</code> element.' +
              //              '</video><br/>';
              // }
              if (info)
              {
                content += info;
              }
              if (link)
              {
                content += '<br/><br/><a href="' + link + '" target="_blank">More information about ' + name + ' on the web</a>';
              }
              content += '</div>' +
              '</div>';

              // Set the content of the InfoWindow
              infoWindow.setContent(content);

              // Open the InfoWindow
              infoWindow.open(map, marker);

            }); //end click listener

      });//end markers each loop

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
    .html('<div class="inner_desc">' + categories[catID].text + '<br/><a class="cat_link" href="'+ categories[catID].link +'" target="_blank" >' + categories[catID].link + '</a></div>')
    .appendTo(catTarget);

    $('<ul class="polygon_list"/>').appendTo(catTarget);

        //category content building loop
        $.each(categoryItems[category], function(i, s) {

      //pull data for layer's key
      var name = s.name;
      var contains = s.contains;
      var borderColor = s.borderColor;
      var fillColor = s.fillColor;
      var polyIcon = s.icon;

      // push category to array to check if populated later

      markerCatArray[markerCatArray.length] = category;

          //build polygon key icon
          var icon = '<div class="polygon_key" style="border-color:' + borderColor + ';background-color:' + fillColor + '">&nbsp;</div><img src="images/polygons/' + category + "/" + polyIcon + '"/>';

          //specify target to insert html into
          var target = 'div#category_div_' + category + ' ul';

          // create building navigation list
          $('<li name="polygon_' + name + '" title="' + contains + '"/>')
          .html(icon + '<span class="polygon_name">' + name + '</span>')
          .appendTo(target);

        });

    //load map layer
    parkingLayer = new google.maps.KmlLayer(polygonFile,
                  {
                      suppressInfoWindows: true,
                      map: map,
                      preserveViewport: true,
                      zoom: 18
                  });

  }// end loadPolygonCategory()

  // CATEGORY OPEN AND CLOSE
  function showHideCategory(category, obj, catIndex, type) {

    // COLLAPSE/SHOW CHILD OBJECT LIST
    obj.stop().slideToggle();
    obj.toggleClass('hidden');
    obj.siblings('a.marker_category_a').children('span.cat_indicator').toggleClass('active');

    // IF Polygons
    if (type == 1) {

      //Hide this layer's polygons
      if (obj.attr('class') == 'hidden') {
        //console.log('obj == hidden, set map to null');
        parkingLayer.setMap(null);
      }
      //Show this layer's polygons
      else {
        //console.log('obj != hidden, set map to show');
        parkingLayer.setMap(map);
      }

    }
    // IF objects
    else {
      // ERASE / HIDE THIS CATEGORY'S MARKERS
      if (obj.attr('class') == 'hidden') {
        for (var i in markerArray[catIndex]) {
          markerArray[catIndex][i].setVisible(false);
          obj.find('li').removeClass('active_item');
        }
      }
      else {
        for (var i in markerArray[catIndex]) {
          //fitToMarkers(markerArray[catIndex]);
          markerArray[catIndex][i].setVisible(true);
        }
      }
    }

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

  }/* END displayPoint() */

// GENERAL FUNCTIONS

  //function for passing array values through other object/function args cleanly
  function perform(array_name) {
    return this[array_name];
  }//end perform()  

  function windowResize() {
 
    if (mobile == 1) {
      console.log("mobile view");
      menuOn = 1;    
    } else {
      console.log("desktop view");
      var menuWidth = $('#menu').width() + 20;
      //var mapWidth = $('#map_canvas').width();
      var bodyWidth = $('body').width();
      $('#map_canvas').width(bodyWidth - menuWidth);
      //is not mobile size
    }
    
  }//end windowResize()
  
//mobile menu functions 
  
  function openMenu() {

    var menuWidth = $('#menu').width() + 20;
    //animate menu sliding onto screen
    $('#menu').animate({
        right: "0",
      }, 500, function() {
    }).removeClass('closed');
    menuOn = 1;
    console.log("menu is on");
  }

  function closeMenu() {
    
    var menuWidth = $('#menu').width() + 20;
    //animate menu slide-out
    $('#menu').animate({
        right: -(menuWidth),
      }, 500, function() {
    }).addClass('closed');
    menuOn = 0;
    console.log("menu is off");
  }

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
    catIndex = $(this).attr('name'),
    type = $(this).attr('alt').substring(5);
    populateCategories(category, obj, catIndex, type);
  });

  //automatigically switch to vector map for close-up, and satellite map for farther view
  google.maps.event.addListener(map, 'zoom_changed', function () {
    var z = map.getZoom();
    if (z >= 17){
      //closer, do vector texture map
      map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
    }
    else {
      //farther, do satellite texture map
      map.setMapTypeId(google.maps.MapTypeId.HYBRID);
    }
  });

  var menuWidth = $('#menu').width() + 20;

  //mobile menu functionality
    //mobile menu click event
  $('#menu_tab').live('click', function() {
    //if menu is off-screen, bring it on-screen
    if (menuOn == 0){
      openMenu();
    }
    //if menu is on-screen, bring it off-screen
    else {
      closeMenu();
    }
  });//end click event


    
});//end (window).load()

$(document).click(function(e){
  //deactivate menu item highlighting when clicking anywhere but the menu items
  if ($(e.target).closest("li").length == 0) {
    $('li').removeClass('active_item');
  }
});

$('.swipe').swipe({
  
  swipeLeft: function() {
    alert("inside left swipe event");
    openMenu();
  },
  swipeRight: function() {
    alert("inside right swipe event");
    closeMenu(); 
  },
});

//window resize event trigger
window.onresize = function() {
  // resize map pane when window is resized to fit menu
  windowResize();
};//end window.onresize()
 
  // SELECT & PAN TO OBJECT FROM EXTERNAL SOURCE (FUTURE FEATURE)
    // OPEN / SHOW INFO PANE (should already be populated from when category was opened)
    // WRITE OBJECT ID TO URL HISTORY








