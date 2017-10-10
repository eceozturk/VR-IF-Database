/**
 * Created by danielsilhavy on 26.07.16.
 */
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


describe('Attributes - no login : ', function () {


    it('Should list all attributes, should be greater than zero', function (done) {
        var input = utils.sampleData.featureAttributes;

        utils.createAttributeEntries(input)
          .then(function () {
              chai.request(requestURL)
                .get('/attributes')
                .then(function (res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('array');
                    res.body.length.should.be.equal(input.length);
                    input.forEach(function (item,i) {
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


    it('Should return all attributes of type feature', function (done) {
        done(new Error('Not yet implemented'));
    });

});


describe('Attributes - with login :', function () {

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

    it('Should create a new attribute', function (done) {
        var payload = {
            "description": 'Name property of a feature',
            "uiName": 'Name',
            "active": true,
            "type": 'Feature',
            "defaultValue": 'dd',
            "createdby": utils.testUser._id
        };
        chai.request(requestURL)
          .post('/myattributes')
          .set('Authorization', 'Bearer ' + token)
          .send(payload)
          .then(function (res) {
              res.should.have.status(200);
              res.should.be.json;
              utils.getAttributes()
                .then(function (attributes) {
                    attributes.length.should.be.equal(1);
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

    it('Should return an attribute by id', function (done) {
        var input = [utils.sampleData.featureGroupAttributes[0]];

        utils.createAttributeEntries(input)
          .then(function (docs) {
              var id = docs[0]._id.toString();
              chai.request(requestURL)
                .get('/attributes/' + id)
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

    it('Should update an attribute', function (done) {
        var input = [utils.sampleData.featureAttributes[0]];
        var payload = {
            description: 'Updated attribute'
        };

        utils.createAttributeEntries(input)
          .then(function (attributes) {
              chai.request(requestURL)
                .put('/attributes/' + attributes[0]._id.toString())
                .set('Authorization', 'Bearer ' + token)
                .send(payload)
                .then(function (res) {
                    res.should.have.status(200);
                    res.body.description.should.be.equal(payload.description);
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

    it('Should delete an attribute', function (done) {
        var input = [utils.sampleData.featureAttributes[0]];

        utils.createAttributeEntries(input)
          .then(function (input) {
              chai.request(requestURL)
                .delete('/attributes/' + input[0]._id.toString())
                .set('Authorization', 'Bearer ' + token)
                .then(function (res) {
                    utils.getAttributeById(input[0]._id.toString())
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

    it('Should return elements in my attribute list', function (done) {
        var input = [utils.sampleData.featureAttributes[0]];

        utils.createAttributeEntries(input)
          .then(function () {
              chai.request(requestURL)
                .get('/myattributes')
                .set('Authorization', 'Bearer ' + token)
                .then(function (res) {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.equal(input.length);
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
});
