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


describe('Feature Groups - no login : ', function () {

    it('Should list all feature groups, should be greater than zero', function (done) {
        utils.createElementsWithAttributes(utils.sampleData.featureGroups, utils.sampleData.featureGroupAttributes, 'featureGroup')
          .then(function () {
              chai.request(requestURL)
                .get('/featuregroups')
                .then(function (res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('array');
                    res.body.length.should.be.equal(utils.sampleData.featureGroups.length);
                    utils.sampleData.featureGroups.forEach(function (item, i) {
                        res.body[i]._id.should.be.equal(item._id.toString())
                    });
                    done();
                })
                .catch(function (err) {
                    done(err);
                })
          })
          .catch(function (err) {
              done(err)
          })
    });


    it('Should return all features of a feature group', function (done) {
        utils.createFeaturesWithFeatureGroups(utils.sampleData.featureGroups, utils.sampleData.features, utils.sampleData.featureGroupAttributes, utils.sampleData.featureAttributes)
          .then(function (docs) {
              chai.request(requestURL)
                .get('/featuregroups/' + docs.featureGroups[0]._id.toString() + '/features')
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
                    done(err);
                })
          })
          .catch(function (err) {
              done(err)
          })
    });

});


describe('Feature Groups - with login :', function () {

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

    it('Should create a new feature group', function (done) {
        var payload = {
            "createdby": utils.testUser._id,
            "name": "Feature Group New",
            "active": true,
            "attributeInstances": []
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
              chai.request(requestURL)
                .post('/myfeaturegroups')
                .set('Authorization', 'Bearer ' + token)
                .send(payload)
                .then(function (res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    utils.getFeatureGroups()
                      .then(function (featureGroup) {
                          featureGroup.length.should.be.equal(1);
                          done();
                      })
                      .catch(function (err) {
                          done(err);
                      })
                })
                .catch(function (err) {
                    done(err);
                })
          })
    });

    it('Should return a feature group by id', function (done) {
        utils.createFeatureGroupEntries([utils.sampleData.featureGroups[0]])
          .then(function (docs) {
              var id = docs[0]._id.toString();
              chai.request(requestURL)
                .get('/featuregroups/' + id)
                .set('Authorization', 'Bearer ' + token)
                .then(function (res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body._id.should.be.equal(id);
                    done();
                })
                .catch(function (err) {
                    done(err);
                })
          })
          .catch(function (err) {
              done(err);
          })
    });

    it('Should update a feature group', function (done) {
        var element;
        var payload = {
            name: 'Updated name',
            active: false
        };
        var current;

        utils.createElementsWithAttributes([utils.sampleData.featureGroups[0]], utils.sampleData.featureGroupAttributes, 'featureGroup')
          .then(function (docs) {
              element = docs[0];
              payload._id = element._id;
              payload.attributeInstances = [];
              element.attributeInstances.forEach(function (item) {
                  current = {};
                  current._id = item.toString();
                  current.value = "Updated value";
                  payload.attributeInstances.push(current);
              });
              chai.request(requestURL)
                .put('/featuregroups/' + element._id)
                .set('Authorization', 'Bearer ' + token)
                .send(payload)
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
          })
          .catch(function (err) {
              done(err);
          })
    });

    it('Should delete a feature group', function (done) {
        var element;

        utils.createElementsWithAttributes([utils.sampleData.featureGroups[0]], utils.sampleData.featureGroupAttributes, 'featureGroup')
          .then(function (docs) {
              element = docs[0];
              chai.request(requestURL)
                .delete('/featuregroups/' + element._id.toString())
                .set('Authorization', 'Bearer ' + token)
                .then(function (res) {
                    utils.getFeatureGroupById(element._id.toString())
                      .then(function (result) {
                          should.not.exist(result);
                          done();
                      })
                })
          })
          .catch(function (err) {
              done(err);
          })
    });

    it('Should return elements in myfeaturegroup list', function (done) {
        utils.createElementsWithAttributes(utils.sampleData.featureGroups, utils.sampleData.featureGroupAttributes, 'featureGroup')
          .then(function () {
              chai.request(requestURL)
                .get('/myfeaturegroups')
                .set('Authorization', 'Bearer ' + token)
                .then(function (res) {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.equal(utils.sampleData.featureGroups.length);
                    done();
                })
                .catch(function (err) {
                    done(err);
                })
          })
          .catch(function (err) {
              done(err);
          })
    });
})
;

