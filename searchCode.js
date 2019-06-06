// https://developers.google.com/maps/documentation/javascript/reference?hl=en
const homeId = "ChIJ2V1MbzTdt4kRYN9Qf8r1y38"; // place_id
const workId = "ChIJ651lxsIrtokRDijRKFtvbB4";

// called after the google maps api is loaded
function initMaps() {
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


    getLocById(homeId, function(homeLoc) {
        getLocById(workId, function(workLoc) {
            console.log(homeLoc);
            console.log(workLoc);

            // now get directions
            getDirections(homeLoc, workLoc, false);

        });
    });


}

function getDirections(loc1, loc2, avoidTolls) {
    // https://developers.google.com/maps/documentation/javascript/directions
    var request = {
        origin: loc1, // latlng object
        destination: loc2,
        avoidFerries: true,
        avoidTolls: avoidTolls,
        travelMode: google.maps.TravelMode.DRIVING
    }
    
    // TODO: use this instead: https://stackoverflow.com/questions/1042885/using-google-maps-api-to-get-travel-time-data
    var directionsService = new google.maps.DirectionsService
    directionsService.route(request, function(result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            console.log("success");
            console.log(result);

            // get fastest route from results
            var best = result.routes[0].legs[0].duration;
            for (var i=1; i<result.routes; i++) {

            }
        }
    });

}

// place_id lookup: https://developers.google.com/maps/documentation/javascript/examples/geocoding-place-id
function getLocById(placeId, callback) {
    var geocoder = new google.maps.Geocoder;
    geocoder.geocode({'placeId': placeId}, function(results, status) {
        if (status === 'OK') {
            if (results[0]) {
                //console.log(results[0]);
                callback(results[0].geometry.location);
            }
            else
                window.alert('No results found');
        } else
        window.alert('Geocoder failed due to: ' + status);
    });
}
