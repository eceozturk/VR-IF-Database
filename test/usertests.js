/**
 * Created by danielsilhavy on 19.07.16.
 */



process.env.NODE_ENV = "test";

var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var config = require('config');
var utils = require('./utils');
var mongoose = require('mongoose');
var requestURL = 'http://localhost:' + config.webConfig.port + '/v1';
chai.use(chaiHttp);

describe('Users - with login :', function () {

    var token;

    beforeEach('Login with a valid user, delete old users', function (done) {
        mongoose.connection.db.dropCollection('users', function () {
            utils.createTestUser(utils.testUser.name, utils.testUser.password, 'admin')
              .then(function () {
                  return chai.request(requestURL).post('/users/login').send({
                      username: utils.testUser.name,
                      password: utils.testUser.password
                  })
              })
              .then(function (res) {
                  res.should.have.status(200);
                  token = res.body.token;
                  done();
              })
              .catch(function (err) {
                  done(err);
              })
        })
    });

    it('Should return a list of users', function (done) {
        utils.createUserEntries(utils.sampleData.users)
          .then(function () {
              return chai.request(requestURL).get('/users').set('Authorization', 'Bearer ' + token)
          })
          .then(function (res) {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.equal(utils.sampleData.users.length + 1); // one more user because we have the admin user also in the table
              done();
          })
          .catch(function (err) {
              done(err);
          })
    });

    it('Should create a new user', function (done) {
        var payload = {
            username: 'User1',
            firstname: 'User 1 Firstname',
            lastname: 'User 1 Lastname',
            companyname: 'User 1 Companyname',
            email: 'User 1 Email',
            password: 'pw',
            role: 'admin'
        };
        chai.request(requestURL).post('/users').set('Authorization', 'Bearer ' + token).send(payload)
          .then(function (res) {
              res.should.have.status(200);
              res.should.be.json;
              return utils.getUsers();
          })
          .then(function (users) {
              users.length.should.be.equal(2); // one more user because we have the admin user also in the table
              done();
          })
          .catch(function (err) {
              done(err);
          })
    });


    it('Should return a user by id', function (done) {
        var id;
        utils.createUserEntries([utils.sampleData.users[0]])
          .then(function (docs) {
              id = docs[0]._id.toString();
              return chai.request(requestURL).get('/users/' + id).set('Authorization', 'Bearer ' + token)
          })
          .then(function (res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body._id.should.be.equal(id);
              done();
          })
          .catch(function (err) {
              done(err);
          })

    });

    it('Should update a user', function (done) {
        var payload = {
            username: 'Updated User',
            password: 'test2',
            role: 'admin'
        };

        utils.createUserEntries(utils.sampleData.users[0])
          .then(function (users) {
              return chai.request(requestURL).put('/users/' + users[0]._id.toString()).set('Authorization', 'Bearer ' + token).send(payload)
          })
          .then(function (res) {
              res.should.have.status(200);
              res.body.username.should.be.equal(payload.username);
              done();
          })
          .catch(function (err) {
              done(err);
          })
    });

    it('Should delete a user', function (done) {
        utils.createUserEntries(utils.sampleData.users[0])
          .then(function (users) {
              return chai.request(requestURL).delete('/users/' + users[0]._id.toString()).set('Authorization', 'Bearer ' + token)
          })
          .then(function (res) {
              return utils.getUserById(utils.sampleData.users[0]._id.toString())
          })
          .then(function (result) {
              should.not.exist(result);
              done();
          })
          .catch(function (err) {
              done(err);
          })
    });
});

