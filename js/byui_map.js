/* BYU-I Campus Map (from skeleton) */
/* 3.30.2012 */

// LOAD
	// GLOBAL VARS
	
	//var map;
	var categories = new Array();
	var categoryItems = new Array();
	
	var markerCatArray = new Array();
	var markers = new Array();
	var markerArray = new Array();
	
	var infoWindow;
	var mapBounds = new google.maps.LatLngBounds(new google.maps.LatLng( 43.811265, -111.786779), new google.maps.LatLng(43.821521, -111.778185));

	// LOAD JSON AND KML FILES INTO VAR
	var objectFile = 'objectFile.txt';
	var polygonFile = 'parking.kml';


// POPULATE CATEGORY LIST
	
	function listCategories(){

		// Assign handlers immediately after making the request,
		$.getJSON(objectFile, function(data) {
		    
		    categories 	  = data.info.categories;
			categoryItems = data.dataObjects;

		    //console.log("success inside getJSON");

		    $.each(categories, function(i,s) {

				var id = s.ID;;
				var name = s.name;;
				var title = s.title;;
				var text = s.text;;

				$('<div class="marker_category"/>')
		        .html('<a href="#" name="catIndex_' + i + '" id="category_' + name + '" onclick="populateCategories($(this).attr(\'id\'),$(this).siblings(\'div\'),$(this).attr(\'name\'))">' + title + '</a><div id="category_div_' + name +'" class="hidden" />')
		        .appendTo("#categories");

				markerArray[i-0]= new Array();

			});/*end each loop*/

		})
		.success(function() { 
			//console.log("JSON XHR outside success"); 
		})
		.error(function() { 
			//console.log("JSON XHR error"); 
		})
		.complete(function() { 
			//console.log("JSON XHR complete"); 
		});//end getJSON main 

	}/* end listCategories() */


// CACHE SECONDARY RESOURCES?
	

// LOAD MAP (INIT)

	// INIT SETTINGS
	var myLatlng = new google.maps.LatLng(43.814188,-111.783515);
	var myOptions = {
		zoom: 17,
		center: myLatlng,
		mapTypeId: google.maps.MapTypeId.SATELLITE,
		mapTypeControlOptions: {
			mapTypeIds: ["map", google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.TERRAIN]
		}
	}

	// INIT
	function initialize() {
		//console.log("start initialize");
		map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);
		infowindow = new google.maps.InfoWindow();
		listCategories()
		//console.log("end initialize");
	}//end initialize()


// GLOBAL FUNCTIONS

	function populateCategories(category,obj,catIndex){
		//console.log("start populateCategories");
		//infoWindow.close();

		//console.log("populateCategories arg values = " + category + ', ' + obj + ', ' + catIndex);

		var category = category.substring(9);
		catIndex = catIndex.substring(9);

		console.log("passed category = " + category);
		console.log("passed catIndex = " + catIndex);

		// Detect Existing Markers
		if ($.inArray(category, markerCatArray) != -1) {
			if (category != 'parking'){
				console.log("inside populate if (markers DO exist already)");
				showHideCategory(category,obj,catIndex);
			}else {
				alert("parking category isn't done yet");
			}
		}
		else {
			if (category != 'parking'){
				console.log("inside populate else (markers do not exist yet, launching loadPins() and showHideCategory())");
				loadPins(category,obj,false);

				showHideCategory(category,obj,catIndex)
			}else {
				
				//Test if polygon layer exists
				//if (~polygon layer exists~){
					loadPolygonCategory(category,obj);
				//}
			}
		}
		//console.log("end populateCategories");
	} // end populateCategories()

	function loadPins(category,obj,markersExist) {
		//console.log("start loadPins");
		if (markersExist == false) {

			//console.log("markersExist == false");
			//console.log("category = " + category);


			var catID = 'category not found';
			var defaultIcon = 'default.png';

			markerArray.push(perform(category)); 

			// extract important category info & defaults
			$.each(categories, function(i,s){
				if (s.name == category) {
					
					defaultIcon = s.icon;
					//console.log("defaultIcon = " + defaultIcon);

					catID = s.ID - 1;

				}
			});

			var catTarget = "div#category_div_" + category;
	        
	        $("<div name='" + categories[catID].name + "_cat_description' class='cat_description'/>")
	        .html(categories[catID].text)
	        .appendTo(catTarget);

	        //categoryArr = new Array();

	        // create building navigation list
			$.each(categoryItems[category], function(i,s){

				//console.log("defaultIcon = " + defaultIcon);

				var name = s.name;;
				var code = s.code;;
				var lat  = s.lat;;
				var lon  = s.lon;;
				if (s.info){var info = s.info;;}
				if (s.img){var img  = 'images/' + s.img;;}
				if (s.icon){var icon = 'images/' + s.icon;;} else {var icon = 'images/' + defaultIcon;;}
				if (s.link){var link = s.link;;}
				if (s.code){var id   = category + "_" + code;}
				
				//console.log("name " + i + " = " + name);
				//console.log(name + " " + code + " " + lat + " " + lon + " " + info + " " + img + " " + icon + " " + link );

				//markerArray.buildings.push("1","6","4","8");

				var marker = new google.maps.Marker({
		          position: new google.maps.LatLng(lat, lon),
		          map: map,
		          title: name,
		          icon: icon
		        });
				
				markerCatArray.push(category);

				// console.log("catID = " + Number(catID));

		        markerArray[catID].push(marker);


		    	
		    	var target = "div#category_div_" + category;
		        // create building navigation list
		        $("<li name='" + id + "'/>")
		        .html('<img src="' + icon + '" alt="' + id + '"/><span>' + name + '</span>')
		        //.html(name)
		        .click(function(){
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
					var content =   '<div id="' + id + '" class="infopane">' +
										'<h2>' + name + '</h2>' +
										'<div>';
					if(img) 
					{
						content +=  		'<img src="' + img + '" alt="' + name + '" width="300"/>';
					}
					if(info)
					{
						content +=	info;
					}	
					if(link)
					{
						content +=			'<br/><a href="' + link + '">More information about ' + name + ' on the web.</a>';
					}				
						content +=		'</div>' +
									'</div>';

					// Set the content of the InfoWindow
					infoWindow.setContent(content);

					// Open the InfoWindow
					infoWindow.open(map, marker);
		          
		        }); //end click listener

			});
			
		}//end if markersExist
		//console.log("end loadpins");
	} //end loadPins()
	
	function loadPolygonCategory(category,obj,layerExists){
		alert("parking category isn't done yet");
		// var parkingLayer = new google.maps.KmlLayer('parking.kml');  
		// parkingLayer.setMap(map);
	}

	// Shared functions between all category layers

	function debugArray(arr){
		if (arr != '') {
			for (var i; i < arr.length; i++) {
				console.log("array value = " + arr.i);
			}
		} else {
			console.log("array does not exist or is empty");
		}
	}
	
	// CATEGORY CLOSE
	function showHideCategory(category,obj,catIndex) {
		
		//console.log("start showHideCategory");
		
		//console.log("inside showHideCategory " + category + ", " + obj + ", " + markersExist);
		//var catIndex = 0;

		// COLLAPSE CHILD OBJECT LIST
		obj.slideToggle();
		obj.toggleClass('hidden');

		// IF OBJECTS
			// ERASE / HIDE THIS CATEGORY'S MARKERS (erase array? change z-index?)
			if (obj.attr('class') == 'hidden'){
				for (var i in markerArray[catIndex]){
					console.log('inside hidden == true');
					console.log('catIndex = ' + catIndex);
					markerArray[catIndex][i].setVisible(false);
				}
			}
			else {
				for (var i in markerArray[catIndex]) {
					console.log('inside hidden == false');
					console.log('catIndex = ' + catIndex);
					markerArray[catIndex][i].setVisible(true);
				}
			}
		// ELSE (POLYGON AREAS)
			// ERASE / HIDE THIS CATEGORY'S POLYGONS
		//console.log("end showHideCategory");
	}

	// OBJECT SELECT
	function displayPoint(marker, index){
		//console.log("start displayPoint");
		$("#message").hide();

		var moveEnd = google.maps.event.addListener(map, "moveend", function(){
		  var markerOffset = map.fromLatLngToDivPixel(marker.getPosition());
		  $("#message")
		  .fadeIn()
		  .css({ top:markerOffset.y, left:markerOffset.x });
		  
		  google.maps.event.removeListener(moveEnd);
		});
		map.panTo(marker.getPosition());
		google.maps.event.trigger(marker, 'click');
		//console.log("end DisplayPoint");
	}/* END displayPoint() */

	function perform(array_name) {
	    return this[array_name];
	}
	
		
	// Binding
	// Resize map pane to fit with menu width
	function windowResize(){
		var menuWidth = $('#menu').width();
		var mapWidth  = $('#map_canvas').width();
		var bodyWidth = $('body').width();
		$('#map_canvas').width(bodyWidth - menuWidth); 
	}
		
	// Binding
	
	// resize map pane when window is resized to fit menu
	window.onresize = function(){
		console.log('inside window.onresize binding');
		windowResize();
	}





