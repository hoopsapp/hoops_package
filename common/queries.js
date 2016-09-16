Queries = {};
Queries.getFlagQuery  = function() {
    return {
        $or : [
            { flagCount: { $not : { $gte : 3} } },
            { flaggedAt: { $gt : new Date(Date.now() - 1000*60) } }
        ]
    };
};
Queries.getHashtagSearchRegexp  = function(search, allOnEmpty) {
    if (_.str.startsWith(search, '#') && search.length > 1)
        search = _.str.splice(search, 0, 1, '^');

    if (allOnEmpty && _.str.startsWith(search, '#') && search.length == 1)
        search = '';

    return new RegExp(search, 'i');
};
Queries.getHashtagSearchQuery = function(search, allOnEmpty) {
    return {title: {$regex: Queries.getHashtagSearchRegexp(search, allOnEmpty)}};
}
Queries.getCommentsQuery = function(postId) {
    return _.extend( { post: postId }, Queries.getFlagQuery());
}