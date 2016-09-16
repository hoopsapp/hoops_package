Meteor.startup(function () {

    Meteor.publish("comments", function (postId, limit) {
        var query = Queries.getCommentsQuery(postId),
            options = {sort : {createdAt: -1}};

        console.log("New comments subscription from:" + this.connection.clientAddress);

        check(postId, String);
        check(limit, Match.OneOf(null, undefined, Number));

        if (limit)
            options.limit = limit;

        publishCount(this, 'comment-count', Hoops.Comments.find(query), { noReady: true });
        return [Hoops.Comments.find(query, options),
                Hoops.Likes.find({post: postId, comment: { $exists: true }, user: this.userId})];
    });

    Meteor.publish("posts", function (hashTagIds, search, limit, sort) {
        var self = this,
            query,
            matchedIds,
            options = { sort : {createdAt: -1}},
            handle,
            commentCountHandles = {};

        console.log("New posts subscription from:" + this.connection.clientAddress);

        check(hashTagIds, [String]);
        check(search, Match.OneOf(null, undefined, String));
        check(limit, Match.OneOf(null, undefined, Number));

        query = {
            $and : [
                {hashtag: { $in : hashTagIds }},
                Queries.getFlagQuery()
            ]
        };

        if (search) {
            matchedIds = Hoops.HashTags.find(_.extend({ _id: { $in: hashTagIds } },
                                                 Queries.getHashtagSearchQuery(search, true))).map(function(hashtag) {
                return hashtag._id;
            });

            query.$and.push( { $or : [ { hashtag : { $in : matchedIds } },
                                       {'user.username' : { $regex: search, $options: 'i' } } ] });
        }

        if (limit)
            options.limit = limit;

        options.sort = sort || options.sort;

        handle = Hoops.Posts.find(query, options).observeChanges({
            added: function (id) {
                commentCountHandles[id] = publishCount(self, 'comments-' + id, Hoops.Comments.find(
                    Queries.getCommentsQuery(id)), { noReady: true });
            },
            removed: function (id) {
                commentCountHandles[id].stop();
                delete commentCountHandles[id];
            }
            // don't care about changed
        });

        self.onStop(function () {
            handle.stop();
        });

        publishCount(this, 'posts-count', Hoops.Posts.find(query), { noReady: true });
        return [Hoops.Posts.find(query, options),
                Hoops.Likes.find({hashtag: {$in: hashTagIds}, user: this.userId})];
    });

    function getHashtagsCursor(userId, position, search, limit, sort) {
        var query = {},
            options = {};

        check(position, Match.OneOf(null, undefined, {
            type: String,
            coordinates: [Number]
        }));
        check(search, Match.OneOf(null, undefined, String));
        check(limit, Match.OneOf(null, undefined, Number));

        if (position)
            query.position = { $near: { $geometry: position} };

        if (search)
            _.extend(query, Queries.getHashtagSearchQuery(search, true));

        if (limit)
            options.limit = limit;

        if (sort)
            options.sort = sort;

        return [Hoops.HashTags.find(query, options),
                Hoops.Followes.find({ user: userId})];
    }

    Meteor.publish("hashtag", function (slug) {
        console.log("New hashtag subscription from:" + this.connection.clientAddress);

        check(slug, String);
        return Hoops.HashTags.find({slug : slug});
    });

    Meteor.publish("nearestHashtags", function (position, search, limit) {

        console.log("New nearest hashtag subscription from:" + this.connection.clientAddress);

        return getHashtagsCursor(this.userId, position, search, limit);
    });

    Meteor.publish("hottestHashtags", function (search, limit) {

        console.log("New hottest hashtag subscription from:" + this.connection.clientAddress);

        return getHashtagsCursor(this.userId, null, search, limit, {hotness: -1});
    });

    Meteor.publish("followedHashtags", function (search, limit) {
        var handle,
            self = this,
            followes = [],
            published = [],
            count = 0,
            regexp = Queries.getHashtagSearchRegexp(search, true);

        console.log("New followed hashtag subscription from:" + this.connection.clientAddress);

        check(search, Match.OneOf(null, undefined, String));
        check(limit, Match.OneOf(null, undefined, Number));

        handle = Hoops.Followes.find({user: this.userId}).observe({
            added: function (document) {
                var hashtag = Hoops.HashTags.findOne(document.hashtag);

                followes[hashtag._id] = hashtag;
                if ((!limit || limit > _.keys(published).length) && (!search || regexp.test(hashtag.title))) {
                    self.added('hashtags', hashtag._id, hashtag);
                    published[hashtag._id] = hashtag;
                }
            },
            removed: function (oldDocument) {
                var hashtag;

                delete followes[oldDocument.hashtag];

                if (published[oldDocument.hashtag]) {
                    self.removed('hashtags', oldDocument.hashtag);
                    delete published[oldDocument.hashtag];
                }

                if (!limit || limit > _.keys(published).length) {
                    hashtag = _.find(_.values(followes), function(hashtag){
                        return  (!search || regexp.test(hashtag.title)) && !published[hashtag._id];
                    });

                    if (hashtag) {
                        self.added('hashtags', hashtag._id, hashtag);
                        published[hashtag._id] = hashtag;
                    }
                }

            }
            // don't care about changed
        });

        self.onStop(function () {
            handle.stop();
        });

        return Hoops.Followes.find({ user: this.userId});
    });
});