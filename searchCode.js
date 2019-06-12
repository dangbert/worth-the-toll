/**
 * setup page to help user create a valid url
 * (only call after google maps api has loaded)
 *
 * errMsg: (optional) message to display in alert before setting up page
 */
function setup(errMsg) {
    if (errMsg !== undefined)
        alert(errMsg);
    window.history.pushState({}, document.title, "/");

    var searchBox = new google.maps.places.SearchBox(document.getElementById('mysearchbox'));
    //if searchbox is used
    searchBox.addListener('places_changed', function () {
        //document.getElementById("mysearchbox").value = ""; //clear searchbox
        
        var start = searchBox.getPlaces()[0]; //add the first place from the search
        console.log(JSON.stringify(start)); //print in JSON format

        console.log(start['formatted_address']);

        /*
        document.getElementById("startInfo").innerHTML = "<br>" + start['name']; //shortened name
        document.getElementById("startInfo").title = start['formatted_address'];
        */
        
        //document.getElementById("startInfo").innerHTML = "<br>" + start['formatted_address'];
    });
}


/**
 * function called after the google maps api is loaded
 */
function initMaps() {
    var homeId = String(getUrlParams()["home"]);
    var workId = String(getUrlParams()["work"]);
    if (homeId == undefined || workId == undefined) {
        setup();
        return;
    }
    console.log("'" + homeId + "'");
    console.log("'" + workId + "'");


    // calculate time difference
    getLocById(homeId, function(homeLoc) {
        getLocById(workId, function(workLoc) {
            console.log(homeLoc);
            console.log(workLoc);

            // now get duration of each route
            getDuration(homeLoc.geometry.location, workLoc.geometry.location, true, function(durTolls) {
                getDuration(homeLoc.geometry.location, workLoc.geometry.location, false, function(durNoTolls) {
                    console.log(durTolls);
                    console.log(durNoTolls);
                    // calculate time difference
                    var diffSec = durNoTolls.value - durTolls.value;
                    var diffMin = Math.floor(diffSec / 60);
                    var diffHour = Math.floor(diffMin / 60);
                    diffMin = diffMin - diffHour * 60;
                    diffSec = diffSec - diffMin * 60;

                    var diffString = "";
                    if (diffHour !== 0) {
                        diffString += diffHour + "h ";
                    }
                    diffString += diffMin + "m";
                    console.log(diffString);

                    // display results
                    // TODO: also display total without tolls
                    var res = "(" + diffString + " extra avoiding tolls)";
                    console.log(res);

                    $("#home-address").html(homeLoc.formatted_address);
                    $("#work-address").html(workLoc.formatted_address);
                    $("#result-info").html(res);

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
        travelMode: google.maps.TravelMode.DRIVING
    }
    
    var directionsService = new google.maps.DirectionsService
    directionsService.route(request, function(result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            console.log("success");
            console.log(result);

            // get fastest route from results
            var best = result.routes[0].legs[0].duration;
            for (var i=1; i<result.routes; i++) {
              if (result.routes[i].legs[0].duration.value < best.value)
                best = result.routes[i].legs[0].duration;
            }
            console.log("time: " + best.text);
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
 * returns dict of URL parameters
 */
function getUrlParams() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}
