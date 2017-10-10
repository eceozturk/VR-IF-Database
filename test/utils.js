/**
 * Created by danielsilhavy on 17.06.16.
 */

process.env.NODE_ENV = 'test';

var bcrypt = require('bcryptjs');
var swaggerMongoose = require('swagger-mongoose');
var fs = require('fs');
var swagger = fs.readFileSync('swagger.json');
var config = require('config');
var mongoose = require('mongoose');
var models = swaggerMongoose.compile(swagger).models;
var Q = require('q');
var acl = require('acl');
var TestVector = models.Testvector;
var TestCase = models.Testcase;
var Feature = models.Feature;
var FeatureGroup = models.FeatureGroup;
var Attribute = models.Attribute;
var AttributeInstance = models.AttributeInstance;
var User = models.User;
var utils = {};
var ObjectID = mongoose.Types.ObjectId;

utils.models = models;
utils.acl = null;
utils.testUser = null; // this will be the sample user which we use for all the CRUD stuff
utils.sampleData = {}; // we store some sample data for our tests here

utils.conntectToDatabase = function () {
    var q = Q.defer();
    var mongooseUri = config.dbConfig.host + ':' + config.dbConfig.port + '/' + config.dbConfig.dbName;

    mongoose.set('debug', false);
    mongoose.connect(mongooseUri);
    mongoose.connection.on('error', function () {
        q.reject();
    });
    mongoose.connection.once('open', function callback() {
        utils.acl = new acl(new acl.mongodbBackend(mongoose.connection.db, config.dbConfig.aclPrefix));
        q.resolve();
    });
    return q.promise;
};

utils.closeDatabaseConnection = function () {

};

utils.clearDatabase = function () {
    var q = Q.defer();

    try {
        mongoose.connection.db.dropCollection('features', function () {
            mongoose.connection.db.dropCollection('testvectors', function () {
                mongoose.connection.db.dropCollection('testcases', function () {
                    mongoose.connection.db.dropCollection('featuregroups', function () {
                        mongoose.connection.db.dropCollection('attributes', function () {
                            mongoose.connection.db.dropCollection('attributeinstances', function () {
                                q.resolve();
                            })
                        })
                    })
                });
            });
        });
    }
    catch (e) {
        q.reject(e);
    }
    return q.promise;
};

utils.deleteDatabase = function () {
    var q = Q.defer();

    try {
        mongoose.connection.db.dropDatabase();
        q.resolve();
    }
    catch (e) {
        q.reject(e);
    }
    mongoose.connection.close();
    return q.promise;
};

utils.addUserRoles = function () {
    return utils.acl.allow([
        {
            roles: ['admin'],
            allows: [
                {
                    resources: ['featuregroups', 'testcases', 'testvectors', 'features', 'users', 'attributes'],
                    permissions: ['create', 'read', 'update', 'delete']
                }
            ]
        }
    ])
};

utils.createTestUser = function (name, password, role) {
    var q = Q.defer();
    var hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    var user = new User({
        username: name,
        password: hash
    });

    utils.acl.addUserRoles(name, role)
      .then(function () {
          user.save(function (err) {
              if (err) {
                  q.reject(err);
              } else {
                  utils.testUser = user;
                  utils.testUser.name = name;
                  utils.testUser.password = password;
                  utils.testUser.role = role;
                  q.resolve();
              }
          })
      });
    return q.promise;
};

utils.defineSampleData = function () {
    utils.sampleData.users = [
        {
            username: 'User 1',
            firstname: 'User 1 Firstname',
            lastname: 'User 1 Lastname',
            companyname: 'User 1 Companyname',
            email: 'User 1 Email',
            password: 'User 1 Password',
            role: 'admin'
        },
        {
            username: 'User 2',
            firstname: 'User 2 Firstname',
            lastname: 'User 2 Lastname',
            companyname: 'User 2 Companyname',
            email: 'User 2 Email',
            password: 'User 2 Password',
            role: 'admin'
        }
    ];
    utils.sampleData.featureGroups = [
        {
            createdby: utils.testUser._id,
            name: 'Feature Group 1',
            active: true
        },
        {
            createdby: utils.testUser._id,
            name: 'Feature Group 2',
            active: true
        }
    ];
    utils.sampleData.testCases = [
        {
            feature: null,
            name: 'Testcase 1',
            active: true,
            createdby: utils.testUser._id
        },
        {
            feature: null,
            name: 'Testcase  2',
            active: true,
            createdby: utils.testUser._id
        }
    ];
    utils.sampleData.features = [
        {
            featureGroup: null,
            name: 'Feature  1',
            active: true,
            createdby: utils.testUser._id
        },
        {
            featureGroup: null,
            name: 'Feature  2',
            active: true,
            createdby: utils.testUser._id
        }
    ];
    utils.sampleData.testVectors = [
        {
            testcases: [],
            name: 'Testvector  1',
            active: true,
            createdby: utils.testUser._id
        },
        {
            testcases: [],
            name: 'Testvector  2',
            active: true,
            createdby: utils.testUser._id
        }
    ];
    utils.sampleData.featureGroupAttributes = [
        {
            description: 'Attribute 1',
            uiName: 'Attribute 1',
            active: true,
            type: 'Feature Group',
            defaultValue: '',
            deletable: '1',
            createdby: utils.testUser._id
        },
        {
            description: 'Attribute 2',
            uiName: 'Attribute 2',
            active: true,
            type: 'Feature Group',
            defaultValue: '',
            deletable: '1',
            createdby: utils.testUser._id
        }
    ];
    utils.sampleData.featureAttributes = [
        {
            description: 'Attribute 1',
            uiName: 'Attribute 2',
            active: true,
            type: 'Feature',
            defaultValue: '',
            deletable: '1',
            createdby: utils.testUser._id
        },
        {
            description: 'Attribute 2',
            uiName: 'Attribute 2',
            active: true,
            type: 'Feature',
            defaultValue: '',
            deletable: '1',
            createdby: utils.testUser._id
        }
    ];
    utils.sampleData.testcaseAttributes = [
        {
            description: 'Attribute 1',
            uiName: 'Attribute 2',
            active: true,
            type: 'Testcase',
            defaultValue: '',
            deletable: '1',
            createdby: utils.testUser._id
        },
        {
            description: 'Attribute 2',
            uiName: 'Attribute 2',
            active: true,
            type: 'Testcase',
            defaultValue: '',
            deletable: '1',
            createdby: utils.testUser._id
        }
    ];
    utils.sampleData.testvectorAttributes = [
        {
            description: 'Attribute 1',
            uiName: 'Attribute 2',
            active: true,
            type: 'Testvector',
            defaultValue: '',
            deletable: '1',
            createdby: utils.testUser._id
        },
        {
            description: 'Attribute 2',
            uiName: 'Attribute 2',
            active: true,
            type: 'Testvector',
            defaultValue: '',
            deletable: '1',
            createdby: utils.testUser._id
        }
    ];

    return Q.when();
};

utils.createUserEntries = function (users) {
    var q = Q.defer();

    if (!utils.testUser || !utils.testUser._id) {
        q.reject(new Error('Can not create new testvector entries, no user data is available'));
    }
    User.collection.insert(users, {}, function (err, docs) {
        err ? q.reject(err) : q.resolve(docs.ops);
    });
    return q.promise;
};

utils.createTestCaseEntries = function (testcases) {
    var q = Q.defer();

    if (!utils.testUser || !utils.testUser._id) {
        q.reject(new Error('Can not create new testvector entries, no user data is available'));
    }
    TestCase.collection.insert(testcases, {}, function (err, docs) {
        err ? q.reject(err) : q.resolve(docs.ops);
    });
    return q.promise;
};

utils.createTestVectorEntries = function (testvectors) {
    var q = Q.defer();

    if (!utils.testUser || !utils.testUser._id) {
        q.reject(new Error('Can not create new testvector entries, no user data is available'));
    }
    TestVector.collection.insert(testvectors, {}, function (err, docs) {
        err ? q.reject(err) : q.resolve(docs.ops);
    });
    return q.promise;
};

utils.createFeatureEntries = function (features) {
    var q = Q.defer();

    if (!utils.testUser || !utils.testUser._id) {
        q.reject(new Error('Can not create new feature entries, no user data is available'));
    }
    Feature.collection.insert(features, {}, function (err, docs) {
        err ? q.reject(err) : q.resolve(docs.ops);
    });
    return q.promise;
};

utils.createFeatureGroupEntries = function (featureGroups) {
    var q = Q.defer();

    if (!utils.testUser || !utils.testUser._id) {
        q.reject(new Error('Can not create new feature group entries, no user data is available'));
    }
    FeatureGroup.collection.insert(featureGroups, {}, function (err, docs) {
        err ? q.reject(err) : q.resolve(docs.ops);
    });
    return q.promise;
};

utils.createAttributeEntries = function (attributes) {
    var q = Q.defer();

    Attribute.collection.insert(attributes, {}, function (err, docs) {
        err ? q.reject(err) : q.resolve(docs.ops);
    });
    return q.promise;
};

utils.createAttributeInstanceEntries = function (attributeInstances) {
    var q = Q.defer();

    AttributeInstance.collection.insert(attributeInstances, {}, function (err, docs) {
        err ? q.reject(err) : q.resolve(docs.ops);
    });
    return q.promise;
};

utils.createAttributeInstancesWithAttributes = function (attributes) {
    var q = Q.defer();
    var value = 'default';
    var current;
    var attributeInstances = [];

    attributes.forEach(function (item) {
        current = {};
        current.value = value;
        current.attribute = new ObjectID(item._id);
        attributeInstances.push(current);
    });
    utils.createAttributeInstanceEntries(attributeInstances)
      .then(function (docs) {
          q.resolve(docs);
      })
      .catch(function (err) {
          q.reject(err);
      });

    return q.promise;
}

utils.addAttributeInstancesToElement = function (element, attributes) {
    var q = Q.defer();

    utils.createAttributeInstancesWithAttributes(attributes)
      .then(function (docs) {
          element.attributeInstances = [];
          docs.forEach(function (item) {
              element.attributeInstances.push(new ObjectID(item._id));
          })
          q.resolve(element);
      })
      .catch(function (err) {
          q.reject(err);
      });

    return q.promise;
};
utils.createElementsWithAttributes = function (elements, attributes, type) {
    var q = Q.defer();
    var promises = [];

    if (!utils.testUser || !utils.testUser._id) {
        q.reject(new Error('Can not create new attribute entries, no user data is available'));
    }
    // Insert all the attributes
    utils.createAttributeEntries(attributes)
      .then(function (docs) {
          attributes = docs;
          // Create AttributeInstances for each attribute and each element
          elements.forEach(function (item) {
              promises.push(utils.addAttributeInstancesToElement(item, attributes));
          });
          return Q.all(promises)
      })
      .then(function (elements) {
          switch (type) {
              case 'featureGroup':
                  utils.createFeatureGroupEntries(elements)
                    .then(function (docs) {
                        q.resolve(docs);
                    });
                  break;
              case 'feature':
                  utils.createFeatureEntries(elements)
                    .then(function (docs) {
                        q.resolve(docs);
                    });
                  break;
              case 'testvector':
                  utils.createTestVectorEntries(elements)
                    .then(function (docs) {
                        q.resolve(docs);
                    });
                  break;
              case 'testcase':
                  utils.createTestCaseEntries(elements)
                    .then(function (docs) {
                        q.resolve(docs);
                    });
                  break;
              default:
                  q.reject(new Error('Invalid type'))
          }
      })
      .catch(function (e) {
          q.reject(e)
      });

    return q.promise;
}
;

utils.createFeaturesWithFeatureGroups = function (featureGroups, features, featureGroupAttributes, featureAttributes) {
    var q = Q.defer();
    // First create a featureGroup
    utils.createElementsWithAttributes(featureGroups, featureGroupAttributes, 'featureGroup')
      .then(function (docs) {
          featureGroups = docs;
          // Now create the features. Simply use the first feature group and assign it to each feature
          features.forEach(function (item) {
              item.featureGroup = new ObjectID(docs[0]._id);
          })
          return utils.createElementsWithAttributes(features, featureAttributes, 'feature')
      })
      .then(function (docs) {
          features = docs;
          q.resolve({
              featureGroups: featureGroups,
              features: features
          });
      })
      .catch(function (err) {
          q.reject(err);
      });

    return q.promise;
};

utils.createFeaturesWithFeatureGroupsAndTestcases = function (featureGroups, features, testcases, featureGroupAttributes, featureAttributes, testcaseAttributes) {
    var q = Q.defer();

    utils.createFeaturesWithFeatureGroups(featureGroups, features, featureGroupAttributes, featureAttributes)
      .then(function (docs) {
          // Assign a feature to each testcase. Just use the first feature for every testcase
          featureGroups = docs.featureGroups;
          features = docs.features;
          testcases.map(function (item) {
              item.feature = new ObjectID(features[0]._id);
          });
          return utils.createElementsWithAttributes(testcases,testcaseAttributes,'testcase')
      })
      .then(function (docs) {
          testcases = docs;
          q.resolve({
              featureGroups: featureGroups,
              features: features,
              testcases: testcases
          });
      })
      .catch(function (err) {
          q.reject(err);
      });

    return q.promise;
};

utils.createTestVectorsWithTestcasesAndFeaturesAndFeatureGroups = function (featureGroups, features, testcases, testvectors,featureGroupAttributes,featureAttributes,testcaseAttributes,testvectorAttributes) {
    var q = Q.defer();

    utils.createFeaturesWithFeatureGroupsAndTestcases(featureGroups, features, testcases,featureGroupAttributes,featureAttributes,testcaseAttributes)
      .then(function (docs) {
          featureGroups = docs.featureGroups;
          features = docs.features;
          testcases = docs.testcases;
          // Assign each testcase to each testvector
          testvectors.map(function (item) {
              item.testcases = [];
              testcases.forEach(function (tc) {
                  item.testcases.push(new ObjectID(tc._id));
              });
          });
          return utils.createElementsWithAttributes(testvectors,testvectorAttributes,'testvector')
      })
      .then(function (docs) {
          testvectors = docs;
          q.resolve({
              featureGroups: featureGroups,
              features: features,
              testcases: testcases,
              testvectors: testvectors
          });

      })
      .catch(function (err) {
          q.reject(err);
      });

    return q.promise;
};

utils.getUserById = function (id) {
    var q = Q.defer();

    User.findById(id, function (err, user) {
        err ? q.reject(err) : q.resolve(user);
    });
    return q.promise;
};

utils.getFeatureGroupById = function (id) {
    var q = Q.defer();

    FeatureGroup
      .findOne({_id: id})
      .populate({
          path: 'attributeInstances',
          populate: {
              path: 'attribute'
          }
      })
      .exec(function (err, result) {
          if (err) {
              q.reject();
          }
          q.resolve(result);
      });
    return q.promise;
};

utils.getFeatureById = function (id) {
    var q = Q.defer();

    Feature.findById(id, function (err, feature) {
        err ? q.reject(err) : q.resolve(feature);
    });
    return q.promise;
};

utils.getTestcaseById = function (id) {
    var q = Q.defer();

    TestCase.findById(id, function (err, testcase) {
        err ? q.reject(err) : q.resolve(testcase);
    });
    return q.promise;
};

utils.getAttributeById = function (id) {
    var q = Q.defer();

    Attribute.findById(id, function (err, attribute) {
        err ? q.reject(err) : q.resolve(attribute);
    });
    return q.promise;
};

utils.getTestvectorById = function (id) {
    var q = Q.defer();

    TestVector.findById(id, function (err, testvector) {
        err ? q.reject(err) : q.resolve(testvector);
    });
    return q.promise;
};

utils.getFeatureGroups = function () {
    var q = Q.defer();

    FeatureGroup.find({}, function (err, featureGroups) {
        err ? q.reject(err) : q.resolve(featureGroups);
    });
    return q.promise;
};

utils.getFeatures = function () {
    var q = Q.defer();

    Feature.find({}, function (err, features) {
        err ? q.reject(err) : q.resolve(features);
    });
    return q.promise;
};

utils.getTestcases = function () {
    var q = Q.defer();

    TestCase.find({}, function (err, testcases) {
        err ? q.reject(err) : q.resolve(testcases);
    });
    return q.promise;
};

utils.getTestvectors = function () {
    var q = Q.defer();

    TestVector.find({}, function (err, testvector) {
        err ? q.reject(err) : q.resolve(testvector);
    });
    return q.promise;
};

utils.getUsers = function () {
    var q = Q.defer();

    User.find({}, function (err, users) {
        err ? q.reject(err) : q.resolve(users);
    });
    return q.promise;
};

utils.getAttributes = function () {
    var q = Q.defer();

    Attribute.find({}, function (err, attributes) {
        err ? q.reject(err) : q.resolve(attributes);
    });
    return q.promise;
};


module.exports = utils;
