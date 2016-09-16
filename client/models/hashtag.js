Hoops.Hashtag = function (doc) {
  _.extend(this, doc);
};

_.extend(Hoops.Hashtag.prototype, {
    isFollowed : function() {
        return !!Hoops.Followes.findOne({hashtag: this._id});
    }
});