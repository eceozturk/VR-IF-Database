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


describe('Features - no login : ', function () {

    it('Should list all features, should be greater than zero', function (done) {
        utils.createFeaturesWithFeatureGroups(utils.sampleData.featureGroups, utils.sampleData.features, utils.sampleData.featureGroupAttributes, utils.sampleData.featureAttributes)
          .then(function () {
              return chai.request(requestURL).get('/features')
          })
          .then(function (res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('array');
              res.body.length.should.be.equal(utils.sampleData.features.length);
              utils.sampleData.features.forEach(function (item, i) {
                  res.body[i]._id.should.be.equal(item._id.toString())
              });
              done();
          })
          .catch(function (err) {
              done(err)
          })
    });

    it('Should return all testcases of a feature', function (done) {
        utils.createFeaturesWithFeatureGroupsAndTestcases(utils.sampleData.featureGroups, utils.sampleData.features, utils.sampleData.testCases, utils.sampleData.featureGroupAttributes, utils.sampleData.featureAttributes, utils.sampleData.testcaseAttributes)
          .then(function (docs) {
              return chai.request(requestURL).get('/features/' + docs.features[0]._id.toString() + '/testcases')
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

    it('Should return all testvectors of a feature', function (done) {
        utils.createTestVectorsWithTestcasesAndFeaturesAndFeatureGroups(utils.sampleData.featureGroups, utils.sampleData.features, utils.sampleData.testCases, utils.sampleData.testVectors, utils.sampleData.featureGroupAttributes, utils.sampleData.featureAttributes, utils.sampleData.testcaseAttributes, utils.sampleData.testvectorAttributes)
          .then(function (docs) {
              return chai.request(requestURL).get('/features/' + docs.features[0]._id.toString() + '/testvectors')
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


describe('Features - with login :', function () {

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

    it('Should create a new feature', function (done) {
        var payload = {
            "createdby": utils.testUser._id,
            "name": "Feature Group New",
            "active": true,
            "attributeInstances": [],
            "featureGroup": null
        };
        utils.createAttributeEntries(utils.sampleData.featureGroupAttributes)
          .then(function (docs) {
              docs.forEach(function (item, i) {
                  payload.attributeInstances.push(
                    {
                        "value": i,
                        "attribute": item._id
                    }
                  )
              });
              return utils.createFeatureGroupEntries(utils.sampleData.featureGroups)
          })
          .then(function (docs) {
              payload.featureGroup = docs[0]._id;
              return chai.request(requestURL).post('/myfeatures').set('Authorization', 'Bearer ' + token).send(payload)
          })
          .then(function (res) {
              res.should.have.status(200);
              res.should.be.json;
              return utils.getFeatures();
          })
          .then(function (docs) {
              docs.length.should.be.equal(1);
              done();
          })
          .catch(function (err) {
              done(err);
          })
    });

    it('Should return a feature by id', function (done) {
        var id;
        utils.createFeatureEntries([utils.sampleData.features[0]])
          .then(function (docs) {
              id = docs[0]._id.toString();
              return chai.request(requestURL).get('/features/' + id).set('Authorization', 'Bearer ' + token)
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

    it('Should update a feature', function (done) {
        var element;
        var payload = {
            name: 'Updated name',
            active: false
        };
        var current;

        utils.createFeaturesWithFeatureGroups([utils.sampleData.featureGroups[0]], [utils.sampleData.features[0]], utils.sampleData.featureGroupAttributes, utils.sampleData.featureAttributes)
          .then(function (docs) {
              element = docs.features[0];
              payload._id = element._id;
              payload.attributeInstances = [];
              element.attributeInstances.forEach(function (item) {
                  current = {};
                  current._id = item.toString();
                  current.value = "Updated value";
                  payload.attributeInstances.push(current);
              });
              return chai.request(requestURL).put('/features/' + element._id).set('Authorization', 'Bearer ' + token).send(payload)
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

    it('Should delete a feature', function (done) {
        var element;

        utils.createElementsWithAttributes([utils.sampleData.features[0]], utils.sampleData.featureAttributes, 'feature')
          .then(function (docs) {
              element = docs[0];
              return chai.request(requestURL).delete('/features/' + element._id.toString()).set('Authorization', 'Bearer ' + token)
          })
          .then(function (res) {
              return utils.getFeatureById(element._id.toString())
          })
          .then(function (result) {
              should.not.exist(result);
              done();
          })
          .catch(function (err) {
              done(err);
          })
    });

    it('Should return elements in my feature list', function (done) {
        utils.createFeatureEntries(utils.sampleData.features)
          .then(function () {
              return chai.request(requestURL).get('/myfeatures').set('Authorization', 'Bearer ' + token)
          })
          .then(function (res) {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.equal(utils.sampleData.features.length);
              done();
          })
          .catch(function (err) {
              done(err);
          })
    });
});

