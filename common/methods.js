function likeDocument(collection, id, likeProp, parentProp){
    var query = {},
        like,
        document = collection.findOne(id);

    if (!document)
        throw new Meteor.Error(404, likeProp + " not found");

    if (!Meteor.userId())
        throw new Meteor.Error(400, "Not logged in");

    query[likeProp] = id;
    query[parentProp] = document[parentProp]
    query.user = Meteor.userId();

    like = Hoops.Likes.findOne(query);
    if (like) {
        Hoops.Likes.remove(like._id);
        collection.update({_id: id}, { $inc : { likeCount: -1} });
    } else {
        Hoops.Likes.insert(query);
        collection.update({_id: id}, { $inc : { likeCount:  1} });
    }

    return document;
}

function flagDocument(collection, id, documentName){
    var doc = collection.findOne(id);

    if (!doc)
        throw new Meteor.Error(404, documentName + " not found");

    if (!Meteor.userId())
        throw new Meteor.Error(400, "Not logged in");

    if (_.contains(doc.flags, Meteor.userId())){
        collection.update({_id: id}, {
            $pull : { flags : Meteor.userId() },
            $inc : { flagCount: -1},
            $set : { flaggedAt: new Date() }
        });
    } else {
        collection.update({_id: id}, {
            $addToSet : { flags : Meteor.userId() },
            $inc : { flagCount: 1},
            $set : { flaggedAt: new Date() }
        });
    }

    return doc;
}

Meteor.methods({
    rehash: function (doc) {
        Hoops.RehashSchema.clean(doc);
        check(doc, Hoops.RehashSchema);

        var post = Hoops.Posts.findOne(doc.postId), newPost;

        if (!post)
            throw new Meteor.Error(404, "Post not found");

        newPost = _.pick(post, ['file', 'type', 'position']);
        newPost.text = doc.text || post.text;
        newPost.hashtag = doc.hashtag;
        newPost.type = newPost.type || 'text';

        newPost = Hoops.Posts.insert(newPost);

        if (newPost) {
            Hoops.Posts.update(doc.postId,  {
                $push : { copies : newPost }
            });
        }
    },
    flagPost: function(postId) {
        check(postId, String);

        flagDocument(Hoops.Posts, postId, 'Post');
    },
    flagComment: function(commentId) {
        check(commentId, String);

        flagDocument(Hoops.Comments, commentId, 'Comment');
    },
    likePost: function(postId) {
        check(postId, String);

        likeDocument(Hoops.Posts, postId, 'post', 'hashtag');
    },
    likeComment: function(commentId) {
        check(commentId, String);

        var comment = likeDocument(Hoops.Comments, commentId, 'comment', 'post');

        // update related post, so the updatedAt field gets updated
        Hoops.Posts.update(comment.post, { $set: { updatedAt: new Date() }}, {validate: false});
    },
    follow: function(hashtagId, noToggle) {
        check(hashtagId, String);

        var query = { user: Meteor.userId(), hashtag: hashtagId},
            followDoc;

        if (!Meteor.userId())
            throw new Meteor.Error(400, "Not logged in");

        if (!Hoops.HashTags.findOne(hashtagId))
            throw new Meteor.Error(400, "Hashtag not found");

        followDoc = Hoops.Followes.findOne(query);

        if (followDoc && !noToggle) {
            Hoops.Followes.remove(followDoc._id);
            Hoops.HashTags.update(hashtagId, { $inc : { followers: -1} });
        } else if (!followDoc) {
            Hoops.Followes.insert(query);
            Hoops.HashTags.update(hashtagId, { $inc : { followers: 1} });
        }
    },
    searchHashtags: function(query) {
        var options = {
            limit: 50
        };

        return Hoops.HashTags.find(Queries.getHashtagSearchQuery(query), options).fetch();
    }
});