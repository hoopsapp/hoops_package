Package.describe({
    summary: "Hoops package"
});

Package.on_use(function (api) {
    api.use(['underscore', 'tracker', 'mongo', 'accounts-password', 'random', 'session', 'aldeed:simple-schema', 'tmeasday:publish-counts']);
    api.export('Hoops');
    api.export('Queries');
    api.add_files([
        'common/exports.js',
        'common/collection-schemas.js',
        'common/queries.js',
        'common/methods.js'
    ], ['client', 'server']);
    api.add_files([
        'client/identification.js',
        'client/location.js',
        'client/methods.js',
        'client/models/interfaces/flaggable.js',
        'client/models/post.js',
        'client/models/comment.js',
        'client/models/hashtag.js'
    ], 'client');
    api.add_files([
        'server/publish.js',
        'server/security.js'
    ], 'server');
});
