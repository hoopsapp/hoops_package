Hoops.Comment = function (doc) {
  _.extend(this, doc);
};

_.extend(Hoops.Comment.prototype, Flaggable);
_.extend(Hoops.Comment.prototype, {
    isLiked : function() {
        return !!Hoops.Likes.findOne({comment: this._id});
    }
});