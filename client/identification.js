Tracker.autorun(function () {
    if (Meteor.loggingIn()) {
        console.log("Logging in");
    } else if (!Meteor.userId()) {
        console.log("Creating user");
        Accounts.createUser({
            username: Random.secret(13),
            password: Random.id()
        });
    } else {
       // Meteor.logout();
        console.log("Logged in as:" + Meteor.userId());
    }
});