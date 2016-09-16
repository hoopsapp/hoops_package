if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position){
        Session.set("current-position", {
            type: "Point",
            coordinates: [position.coords.longitude, position.coords.latitude]
        });
    }, function(error){
        console.log(error);
        Session.set("current-position", undefined);
    },{
        timeout: 5000,
    });
}