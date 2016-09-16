Hoops.getUploadPolicy = function(file, callback) {

     Meteor.call('s3Upload', file, function (error, policy) {

         if (error) {
            console.log(error);
            throw error;
        }

         if (callback)
             callback(policy);
     });
}

Hoops.getDownloadUrl = function(file, callback) {

    Meteor.call('s3Download', file, function(error, res){

        if (error) {
            console.log(error);
            throw error;
        }

        // XXX: why is this guard needed? Only happens once after upload
        if (res && callback)
            callback(res);
    });
}