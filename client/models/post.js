Hoops.Post = function (doc) {
  _.extend(this, doc);
};

var urls = {};

function expireOnViewDestroyed(id) {
    Blaze.currentView.onViewDestroyed(function() {
        if (urls[id].expires > Date.now()) {
            urls[id].timeout = Meteor.setTimeout(function(){
                urls[id].url = undefined;
                urls[id].timeout = undefined;
            }, urls[id].expires - Date.now());
        } else
            urls[id].url = undefined;
    });
}

_.extend(Hoops.Post.prototype, Flaggable);
_.extend(Hoops.Post.prototype, {
    isLiked : function() {
        return !!Hoops.Likes.findOne({post: this._id, hashtag: this.hashtag});
    },
    isVideo : function() {
        return this.type == 'video';
    },
    isImage : function() {
        return this.type == 'image';
    },
    isAudio : function() {
        return this.type == 'audio';
    },
    isText : function() {
        return !this.type || this.type == 'text';
    },
    getUrl : function() {
        var self = this;

        urls[this._id] = urls[this._id] || {
            dep: new Tracker.Dependency()
        };

        if (urls[this._id].timeout) {
            Meteor.clearTimeout(urls[this._id].timeout);
            urls[this._id].timeout = undefined;
            expireOnViewDestroyed(this._id);
        }

        if (!urls[this._id].url) {
            expireOnViewDestroyed(this._id);

            Hoops.getDownloadUrl(this.file, function(res){
                urls[self._id].expires = res.expires;
                urls[self._id].url = res.url;
                urls[self._id].dep.changed();
            });
        }

        urls[this._id].dep.depend();
        return urls[self._id].url;
    },
    commentCount : function() {
        return Counts.get('comments-' + this._id);
    }
});