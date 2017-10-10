/**
 * Created by danielsilhavy on 20.06.16.
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


describe('Testvectors - no login : ', function () {

    it('Should list all testvectors', function (done) {
        utils.createTestVectorsWithTestcasesAndFeaturesAndFeatureGroups(utils.sampleData.featureGroups, utils.sampleData.features, utils.sampleData.testCases,utils.sampleData.testVectors, utils.sampleData.featureGroupAttributes, utils.sampleData.featureAttributes, utils.sampleData.testcaseAttributes,utils.sampleData.testvectorAttributes)
          .then(function () {
              return chai.request(requestURL).get('/testvectors')
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


describe('Testvectors - with login :', function () {

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

    it('Should create a new testvector', function (done) {
        var payload = {
            "createdby": utils.testUser._id,
            "name": "Testvector New",
            "active": true,
            "attributeInstances": [],
            "testcases": null
        };
        utils.createAttributeEntries(utils.sampleData.testvectorAttributes)
          .then(function (docs) {
              docs.forEach(function (item, i) {
                  payload.attributeInstances.push(
                    {
                        "value": i,
                        "attribute": item._id
                    }
                  )
              });
              return utils.createTestCaseEntries(utils.sampleData.testCases)
          })
          .then(function (docs) {
              payload.testcases = [docs[0]._id];
              return chai.request(requestURL).post('/mytestvectors').set('Authorization', 'Bearer ' + token).send(payload)
          })
          .then(function (res) {
              res.should.have.status(200);
              res.should.be.json;
              return utils.getTestvectors();
          })
          .then(function (docs) {
              docs.length.should.be.equal(1);
              done();
          })
          .catch(function (err) {
              done(err);
          })
    });

    it('Should return a testvector by id', function (done) {
        var id;

        utils.createTestVectorEntries([utils.sampleData.testVectors[0]])
          .then(function (docs) {
              id = docs[0]._id.toString();
              return chai.request(requestURL).get('/testvectors/' + id).set('Authorization', 'Bearer ' + token)
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

    it('Should update a testvector', function (done) {
        var element;
        var payload = {
            name: 'Updated name',
            active: false
        };
        var current;

        utils.createTestVectorsWithTestcasesAndFeaturesAndFeatureGroups(utils.sampleData.featureGroups, utils.sampleData.features, utils.sampleData.testCases,utils.sampleData.testVectors, utils.sampleData.featureGroupAttributes, utils.sampleData.featureAttributes, utils.sampleData.testcaseAttributes,utils.sampleData.testvectorAttributes)
          .then(function (docs) {
              element = docs.testvectors[0];
              payload._id = element._id;
              payload.attributeInstances = [];
              element.attributeInstances.forEach(function (item) {
                  current = {};
                  current._id = item.toString();
                  current.value = "Updated value";
                  payload.attributeInstances.push(current);
              });
              return chai.request(requestURL).put('/testvectors/' + element._id).set('Authorization', 'Bearer ' + token).send(payload)
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

    it('Should delete a testvector', function (done) {
        var element;

        utils.createElementsWithAttributes([utils.sampleData.testVectors[0]], utils.sampleData.testvectorAttributes, 'testvector')
          .then(function (docs) {
              element = docs[0];
              return chai.request(requestURL).delete('/testvectors/' + element._id.toString()).set('Authorization', 'Bearer ' + token)
          })
          .then(function (res) {
              return utils.getTestvectorById(element._id.toString())
          })
          .then(function (result) {
              should.not.exist(result);
              done();
          })
          .catch(function (err) {
              done(err);
          })
    });

    it('Should return elements in my testvector list', function (done) {
        utils.createTestVectorEntries(utils.sampleData.testVectors)
          .then(function () {
              return chai.request(requestURL).get('/mytestvectors').set('Authorization', 'Bearer ' + token)
          })
          .then(function (res) {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.equal(utils.sampleData.testVectors.length);
              done();
          })
          .catch(function (err) {
              done(err);
          })
    });
});

