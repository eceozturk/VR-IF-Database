/**
 * Created by danielsilhavy on 17.06.16.
 */

var utils = require('./utils');

var role = 'admin';
var username = 'test';
var password = 'test';

before('Connect to the database and add a user and roles',function (done) {
    return utils.conntectToDatabase()
        .then(function () {
            return utils.addUserRoles();
        })
        .then(function () {
            return utils.createTestUser(username,password,role);
        })
        .then(function () {
            return utils.defineSampleData();
        })
        .then(function () {
            done();
        })
        .catch(function (error) {
            done(error);
        })
});

afterEach('Clear the features,testcases,testvectors tables so we can start from scratch for each test', function (done) {
    return utils.clearDatabase()
        .then(function () {
            done();
        })
        .catch(function (err) {
            done(err);
        })
});

after('Delete the test database',function (done) {
    return utils.deleteDatabase()
        .then(function () {
            done();
        })
        .catch(function (err) {
            done(err)
        })
});
