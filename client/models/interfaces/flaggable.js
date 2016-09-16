Flaggable = {
    isFlagged : function() {
        return _.contains(this.flags, Meteor.userId());
    }
}