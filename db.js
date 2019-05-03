// db.js
var createHash = require('crypto').createHash
function hashPW(userName, pwd){
  var hash = createHash('md5');
  hash.update(userName + pwd);
  return hash.digest('hex');
}
module.exports.config = {
    // DB: 'mongodb://mongo:27017/nodetest1'
    DB: 'worker:3789610C-005D-4676-8EAE-C52A73DBFF7B@ds213229.mlab.com:13229/xzpjerryblog',
    COLLECTION: 'blog_users'
}

module.exports.get_Last_LoginTime = function(req) {

}
module.exports.update_Last_LoginTime = function(req) {
    return new Promise(function(resolve, reject){
        const db = req.db;
        const db_cfg = req.db_cfg;
        var collection = db.get(db_cfg.COLLECTION);
        const myquery = { name: req.body.name }
        const newvalues = { $set: {last: req.last, expire: req.last + 604800000} }
        collection.findOneAndUpdate(myquery, newvalues, function(e) {
            if(e) {
                reject(e)
            } else {
                resolve("OK")
            }
        });
    })
}

module.exports.get_users = function(req) {
    return new Promise(function(resolve, reject){
        const db = req.db;
        const db_cfg = req.db_cfg;
        var collection = db.get(db_cfg.COLLECTION);
        collection.find({}, { fields : { name : 1} }, function(e, docs) {
            if(e) {
                reject(e)
            } else {
                resolve(docs)
            }
        });
    })
}

module.exports.sign_up = function(req) {
    return new Promise(function(resolve, reject){
        const db = req.db;
        const db_cfg = req.db_cfg;
        var collection = db.get(db_cfg.COLLECTION);
        collection.insert({
            'name' : req.body.name,
            'pwd': hashPW(req.body.name, req.body.pwd)
        }, function(err, doc) {
            if(err) {
                reject(1)
            } else {
                resolve(0)
            }
        });
    })
}

module.exports.pwd_verify = function(req) {
    return new Promise(function(resolve, reject){
        const db = req.db;
        const db_cfg = req.db_cfg;
        let name = req.body['name']
        let pwd = hashPW(name, req.body['pwd'])
        let collection = db.get(db_cfg.COLLECTION);
        collection.findOne({name: name}, {}, function(e, doc) {
            if(e) {
                reject(2)
            }
            else if(doc == undefined || doc == '' || doc == null) {
                reject(3)
            }
            else if(doc['pwd'] == undefined || doc['pwd'] !== pwd) {
                reject(3)
            }
            resolve(0)
        });
      });
}
