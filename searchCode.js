var homeId = "";
var workId = "";

/**
 * setup page to help user create a valid url
 * (only call after google maps api has loaded)
 *
 * errMsg: (optional) message to display in alert before setting up page
 */
function setup(errMsg) {
    $("#setup-page").removeClass("hidden");
    $("#results-page").addClass("hidden");
    ///window.history.pushState({}, document.title, "/"); // TODO: uncomment
    if (errMsg !== undefined)
        alert(errMsg);

    var searchBox = new google.maps.places.SearchBox(document.getElementById('mysearchbox'));
    searchBox.addListener('places_changed', function () { // if searchbox is used
        homeId = searchBox.getPlaces()[0].place_id;
    });
    var searchBox2 = new google.maps.places.SearchBox(document.getElementById('mysearchbox2'));
    searchBox2.addListener('places_changed', function () { // if searchbox is used
        workId = searchBox2.getPlaces()[0].place_id;
    });

    $("#submit-btn").on("click", function(e) {
        //window.location.href = window.location + "?home=" + homeId + "&work=" + workId;
        var dest = location.protocol + '//' + location.host + location.pathname;
        dest += "?home=" + homeId + "&work=" + workId;
        window.location.href = dest;
    });
}


/**
 * function called after the google maps api is loaded
 */
function initMaps() {
    var homeId = String(getUrlParams()["home"]);
    var workId = String(getUrlParams()["work"]);
    if (homeId == "undefined" || workId == "undefined") {
        setup();
        return;
    }

    // calculate and display travel times
    getLocById(homeId, function(homeLoc) {
        getLocById(workId, function(workLoc) {
            $("#home-address").html(homeLoc.formatted_address);
            $("#work-address").html(workLoc.formatted_address);

            // get duration of route to home (w/ and w/o tolls)
            getDuration(homeLoc.geometry.location, workLoc.geometry.location, true, function(durTolls) {
                getDuration(homeLoc.geometry.location, workLoc.geometry.location, false, function(durNoTolls) {
                    console.log("home -> work");
                    console.log("durTolls:"); console.log(durTolls);
                    console.log("durNoTolls:"); console.log(durNoTolls);
                    var diffString = getDiffString(durTolls, durNoTolls);
                    var res = durTolls.text + " (+" + diffString + " if avoiding tolls)";
                    res += "<span class='big-arrow big-arrow-right'></span>";
                    $("#result-info").html(res); // display results
                });
            });

            // get duration of route to home (w/ and w/o tolls)
            getDuration(workLoc.geometry.location, homeLoc.geometry.location, true, function(durTolls) {
                getDuration(workLoc.geometry.location, homeLoc.geometry.location, false, function(durNoTolls) {
                    console.log("\nwork -> home");
                    console.log("durTolls:"); console.log(durTolls);
                    console.log("durNoTolls:"); console.log(durNoTolls);
                    var diffString = getDiffString(durTolls, durNoTolls);
                    var res = "<span class='big-arrow big-arrow-left'></span>";
                    res += durTolls.text + " (+" + diffString + " if avoiding tolls)";
                    $("#result-info2").html(res); // display results
                });
            });
        });
    });
}

/**
 * find the duration of a driving route
 *
 * loc1: latlng object
 * loc2: latlng object
 * allowTolls: bool (true if tolls enabled)
 * callback: function to pass the resulting duration object
 */
function getDuration(loc1, loc2, allowTolls, callback) {
    // https://developers.google.com/maps/documentation/javascript/directions
    var request = {
        origin: loc1, // latlng object
        destination: loc2,
        avoidFerries: true,
        avoidTolls: !allowTolls,
        travelMode: google.maps.TravelMode.DRIVING,
        // take traffic into account!
        drivingOptions: {
            departureTime: new Date(Date.now()), // assuming we leave now
            trafficModel: 'bestguess'
        }
    }
    
    var directionsService = new google.maps.DirectionsService
    directionsService.route(request, function(result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            // get fastest route from results
            var best = result.routes[0].legs[0].duration;
            for (var i=1; i<result.routes; i++) {
              if (result.routes[i].legs[0].duration.value < best.value)
                best = result.routes[i].legs[0].duration;
            }
            callback(best);
        } else
            setup("Error: calculating direction information failed");
    });
}

/**
 * lookup a location by placeId
 *
 * callback: function to pass the result object
 *           (its .geometry.location property is a latlng object)
 *
 * https://developers.google.com/maps/documentation/javascript/examples/geocoding-place-id
 */
function getLocById(placeId, callback) {
    var geocoder = new google.maps.Geocoder;
    geocoder.geocode({'placeId': placeId}, function(results, status) {
        if (status === 'OK') {
            if (results[0]) {
                ///callback(results[0].geometry.location);
                callback(results[0]);
            } else
                setup("Error: Geocoder unable to find results for url parameter");
        } else
            setup("Error: Geocoder failed due to: " + status);
    });
}

/**
 * return a string containing the travel time
 * (converts from total seconds to ?h?m format
 */
function getDiffString(durTolls, durNoTolls) {
    // calculate time difference
    var diffSec = durNoTolls.value - durTolls.value;
    var diffMin = Math.floor(diffSec / 60);
    var diffHour = Math.floor(diffMin / 60);
    diffMin = diffMin - diffHour * 60;
    diffSec = diffSec - diffMin * 60;

    if (diffSec >= 30) // round if needed
        diffMin++;
    var diffString = "";
    if (diffHour !== 0) {
        diffString += diffHour + "h ";
    }
    diffString += diffMin + "m";
    return diffString;
}

/**
 * returns dict of URL parameters
 */
function getUrlParams() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}
