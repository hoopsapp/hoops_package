// allow insert for logged in users on posts and comments
_.each([Hoops.Posts, Hoops.Comments], function(collection) {
    collection.allow({
        insert: function() {
            return !!Meteor.userId();
        }
    });
});

Meteor.users.deny({
    update: function (userId, docs, fields, modifier) {
        return fields != 'profile' || !modifier && !modifier.$set ||
            !_.isEmpty(_.omit(modifier.$set, 'profile.fullName'));
    }
});