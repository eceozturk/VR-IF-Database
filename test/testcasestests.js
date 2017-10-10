/**
 * Created by danielsilhavy on 14.06.16.
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


describe('Testcases - no login : ', function () {

    it('Should list all testcases, should be greater than zero', function (done) {
        utils.createFeaturesWithFeatureGroupsAndTestcases(utils.sampleData.featureGroups, utils.sampleData.features, utils.sampleData.testCases, utils.sampleData.featureGroupAttributes, utils.sampleData.featureAttributes, utils.sampleData.testcaseAttributes)
          .then(function () {
              return chai.request(requestURL).get('/testcases')
          })
          .then(function (res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('array');
              res.body.length.should.be.equal(utils.sampleData.testCases.length);
              utils.sampleData.testCases.forEach(function (item, i) {
                  res.body[i]._id.should.be.equal(item._id.toString())
              });
              done();
          })
          .catch(function (err) {
              done(err)
          })
    });

    it('Should return all testvectors of a testcase', function (done) {
        utils.createTestVectorsWithTestcasesAndFeaturesAndFeatureGroups(utils.sampleData.featureGroups, utils.sampleData.features, utils.sampleData.testCases, utils.sampleData.testVectors, utils.sampleData.featureGroupAttributes, utils.sampleData.featureAttributes, utils.sampleData.testcaseAttributes, utils.sampleData.testvectorAttributes)
          .then(function (docs) {
              return chai.request(requestURL).get('/testcases/' + docs.testcases[0]._id.toString() + '/testvectors')
          })
          .then(function (res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('array');
              res.body.length.should.be.equal(utils.sampleData.testVectors.length);
              utils.sampleData.testVectors.forEach(function (item, i) {
                  res.body[i]._id.should.be.equal(item._id.toString())
              });
              done();
          })
          .catch(function (err) {
              done(err)
          })
    });
});


describe('Testcases - with login : ', function () {

    var token;

    before('Login with a valid user', function (done) {
        chai.request(requestURL)
          .post('/users/login')
          .send({username: utils.testUser.name, password: utils.testUser.password})
          .then(function (res) {
              res.should.have.status(200);
              token = res.body.token;
              done();
          })
          .catch(function (err) {
              done(err);
          })
    });

    it('Should create a new testcase', function (done) {
        var payload = {
            "createdby": utils.testUser._id,
            "name": "Testcase New",
            "active": true,
            "attributeInstances": [],
            "feature": null
        };
        utils.createAttributeEntries(utils.sampleData.testcaseAttributes)
          .then(function (docs) {
              docs.forEach(function (item, i) {
                  payload.attributeInstances.push(
                    {
                        "value": i,
                        "attribute": item._id
                    }
                  )
              });
              return utils.createFeatureEntries(utils.sampleData.features)
          })
          .then(function (docs) {
              payload.feature = docs[0]._id;
              return chai.request(requestURL).post('/mytestcases').set('Authorization', 'Bearer ' + token).send(payload)
          })
          .then(function (res) {
              res.should.have.status(200);
              res.should.be.json;
              return utils.getTestcases();
          })
          .then(function (docs) {
              docs.length.should.be.equal(1);
              done();
          })
          .catch(function (err) {
              done(err);
          })
    });

    it('Should return a testcase by id', function (done) {
        var id;

        utils.createTestCaseEntries([utils.sampleData.testCases[0]])
          .then(function (docs) {
              id = docs[0]._id.toString();
              return chai.request(requestURL).get('/testcases/' + id).set('Authorization', 'Bearer ' + token)
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

    it('Should update a testcase', function (done) {
        var element;
        var payload = {
            name: 'Updated name',
            active: false
        };
        var current;

        utils.createFeaturesWithFeatureGroupsAndTestcases([utils.sampleData.featureGroups[0]], [utils.sampleData.features[0]],utils.sampleData.testCases, utils.sampleData.featureGroupAttributes, utils.sampleData.featureAttributes, utils.sampleData.testcaseAttributes)
          .then(function (docs) {
              element = docs.testcases[0];
              payload._id = element._id;
              payload.attributeInstances = [];
              element.attributeInstances.forEach(function (item) {
                  current = {};
                  current._id = item.toString();
                  current.value = "Updated value";
                  payload.attributeInstances.push(current);
              });
              return chai.request(requestURL).put('/testcases/' + element._id).set('Authorization', 'Bearer ' + token).send(payload)
          })
          .then(function (res) {
              res.should.have.status(200);
              res.body.name.should.be.equal('Updated name');
              res.body.attributeInstances.forEach(function (item) {
                  item.value.should.be.equal("Updated value");
              });
              done();
          })
          .catch(function (err) {
              done(err);
          })
    });

    it('Should delete a testcase', function (done) {
        var element;

        utils.createElementsWithAttributes([utils.sampleData.testCases[0]], utils.sampleData.testcaseAttributes, 'testcase')
          .then(function (docs) {
              element = docs[0];
              return chai.request(requestURL).delete('/testcases/' + element._id.toString()).set('Authorization', 'Bearer ' + token)
          })
          .then(function (res) {
              return utils.getTestcaseById(element._id.toString())
          })
          .then(function (result) {
              should.not.exist(result);
              done();
          })
          .catch(function (err) {
              done(err);
          })
    });

    it('Should return elements in my testcase list', function (done) {
        utils.createTestCaseEntries(utils.sampleData.testCases)
          .then(function () {
              return chai.request(requestURL).get('/mytestcases').set('Authorization', 'Bearer ' + token)
          })
          .then(function (res) {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.equal(utils.sampleData.testCases.length);
              done();
          })
          .catch(function (err) {
              done(err);
          })
    });

});


