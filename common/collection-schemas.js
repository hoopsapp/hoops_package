var userSchema = new SimpleSchema({
        user: {
            type: Object,
            autoValue: function() {
                if (this.isInsert || this.isUpsert) {
                    var user = _.pick(Meteor.user(), '_id');
                    user.username = Meteor.user().profile && Meteor.user().profile.fullName?
                        Meteor.user().profile.fullName:Meteor.user().username;
                    if (this.isInsert) {
                      return user;
                    } else if (this.isUpsert) {
                      return {$setOnInsert: user};
                    }
                } else {
                  this.unset();
                }
            }
        },
        'user._id': {
            type: String,
            regEx: SimpleSchema.RegEx.Id
        },
        'user.username': {
            type: String,
            regEx: /^[a-z0-9A-Z_-]{3,15}$/
        }
    }),
    positionSchema = new SimpleSchema({
        position: {
            type: Object,
            index: "2dsphere",
            optional: true
        },
        "position.type": {
            type: String
        },
        "position.coordinates": {
            type: [Number],
            decimal: true
        }
    }),
    likeSchema = new SimpleSchema({
        likeCount: {
            type: Number,
            optional: true
        }
    }),
    timestampSchema = new SimpleSchema({
        createdAt: {
            type: Date,
            autoValue: function() {
                if (this.isInsert) {
                  return new Date();
                } else if (this.isUpsert) {
                  return {$setOnInsert: new Date()};
                } else {
                  this.unset();
                }
            }
        },
        createdOrUpdatedAt: {
            type: Date,
            autoValue: function() {
                return new Date();
            }
        },
        updatedAt: {
            type: Date,
            autoValue: function() {
              if (this.isUpdate) {
                return new Date();
              }
            },
            denyInsert: true,
            optional: true
        }
    }),
    hashtagSchema = new SimpleSchema({
        hashtag: {
            type: String,
            denyUpdate: true,
            autoValue: function() {
                var hashtag, title;

                if (!this.value)
                    return;

                title = _.str.ltrim(this.value, '#');
                hashtag = Hoops.HashTags.findOne({slug: title.toLowerCase()});

                if (hashtag) {
                    return hashtag._id;
                }

                hashtag = Hoops.HashTags.findOne(this.value);

                if (hashtag) {
                    return;
                }

                return Meteor.isServer?Hoops.HashTags.insert({
                    title: title,
                    position: this.field('position').value
                }):title;
            },
            custom: function() {
                if (Meteor.isServer && !SimpleSchema.RegEx.Id.test(this.value) ||
                    Meteor.isClient && !SimpleSchema.RegEx.Id.test(this.value) &&
                        !hashtagRegex.test(this.value))
                    return "regEx"

                return true;
            }
        }
    }),
    flagSchema = new SimpleSchema({
        flags: {
            type: [String],
            optional: true
        },
        flagCount: {
            type: Number,
            optional: true
        },
        flaggedAt: {
            type: Date,
            optional: true
        }
    }),
    hashtagRegex = /^[a-z0-9A-Z_]{3,25}$/;

/*

Meteor.users.attachSchema(new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    username: {
        type: String,
        regEx: /^[a-z0-9A-Z_]{3,15}$/
    },
    emails: {
        type: [Object],
        optional: true
    },
    "emails.$.address": {
        type: String,
        regEx: SimpleSchema.RegEx.Email
    },
    "emails.$.verified": {
        type: Boolean
    },
    createdAt: {
        type: Date
    },
    profile: {
        type: Object,
        optional: true
    },
    "profile.fullName": {
        type: String,
        optional: true
    },
    "profile.preregister" : {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },
    services: {
        type: Object,
        optional: true,
        blackbox: true
    }
}));
*/

Hoops.HashTags = new Mongo.Collection("hashtags");
Hoops.HashTags.attachSchema(new SimpleSchema([userSchema, positionSchema, timestampSchema, {
    title: {
        type: String,
        label: "Title",
        max: 200,
        index: true,
        unique: true,
        regEx: hashtagRegex
    },
    followers: {
        type: Number,
        optional: true
    },
    hotness: {
        type: Number,
        optional: true
    },
    slug: {
        type: String,
        unique: true,
        autoValue: function() {
            return this.field('title').value && this.field('title').value.toLowerCase();
        }
    }
}]));


Hoops.Posts = new Mongo.Collection("posts");
Hoops.PostsSchema = new SimpleSchema([userSchema, positionSchema, likeSchema, flagSchema, timestampSchema, hashtagSchema, {
    type: {
        type: String,
        allowedValues : ['text', 'image', 'video', 'audio']
    },
    text: {
        type: String,
        label: "Text",
        max: 10000,
        optional : true,
        custom: function(doc) {
            if (this.field('type').value == 'text' && !this.value)
                return "required";
        }
    },
    file: {
        type: String,
        max: 254,
        optional : true,
        custom: function(doc) {
            if (this.field('type').value != 'text' && !this.value)
                return "required";
        }
    },
    copies: {
        type: [String],
        optional: true
    },
    'copies.$': {
        type: String,
        custom: function() {
            return Hoops.Posts.findOne(this.value) || "invalid_post";
        }
    }
}]);
Hoops.Posts.attachSchema(Hoops.PostsSchema);

Hoops.Comments = new Mongo.Collection("comments");
Hoops.CommentsSchema = new SimpleSchema([userSchema, positionSchema, likeSchema, flagSchema, timestampSchema, {
    post: {
        type: String,
        custom: function() {
           return (!this.isInsert && !this.value ) || Hoops.Posts.findOne(this.value) || "invalid_post";
        }
    },
    text: {
        type: String,
        label: "Text",
        max: 10000
    }
}]);
Hoops.Comments.attachSchema(Hoops.CommentsSchema);

Hoops.RehashSchema = new SimpleSchema([hashtagSchema, {
    postId: {
        type: String
    },
    text: {
        type: String,
        label: "Text",
        max: 10000,
        optional : true
    },
}]);

Hoops.Likes = new Mongo.Collection("likes");
Hoops.Likes.attachSchema(new SimpleSchema({
    post: {
        type: String,
        denyUpdate: true,
        optional: true
    },
    hashtag: {
        type: String,
        denyUpdate: true,
        optional: true
    },
    comment: {
        type: String,
        denyUpdate: true,
        optional: true
    },
    user: {
        type: String,
        denyUpdate: true
    }
}));

Hoops.Followes = new Mongo.Collection("followes");
Hoops.Followes.attachSchema(new SimpleSchema({
    hashtag: {
        type: String,
        denyUpdate: true,
    },
    user: {
        type: String,
        denyUpdate: true
    }
}));