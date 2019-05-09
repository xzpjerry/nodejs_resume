// db.js
let createHash = require('crypto').createHash
function hashPW(userName, pwd){
  let hash = createHash('md5');
  hash.update(userName + pwd);
  return hash.digest('hex');
}
function isLogined(req) {
    return new Promise(function(resolve, reject) {
        if(req.cookies["nodejs_resume"] == null || req.cookies["nodejs_resume"].name == null || req.cookies["nodejs_resume"].hash == null || req.cookies["nodejs_resume"].expire == null){
            reject({'success': false, 'msg': "Unable to fetch user's cookie"})
        }
        get_Last_Valid_LoginTime(req)
        .then(function(rslt1) {
            let db = req.db;
            let db_cfg = req.db_cfg;
            let collection = db.get(db_cfg.COLLECTION);
            collection.findOne({name: req.cookies["nodejs_resume"].name}, {})
            .then(function(doc){
                if(doc == undefined || doc == '' || doc == null) {
                    reject({'success': false, 'msg': "Unable to fetch user data in the database"})
                }
                else if(doc['t_hash'] == undefined || doc['t_hash'] !== req.cookies["nodejs_resume"].hash) {
                    reject({'success': false, 'msg': "Illegal Cookie Credential"})
                } else {
                    resolve({'success': true, 'msg': "Using your cookie to log in successfully"})
                }
            })
            .catch(function(e) {
                reject({'success': false, 'msg': "Unable to connect to the database"})
            });
        })
        .catch(function(e){
            reject(e)
        })
    })
}
function get_Last_Valid_LoginTime(req) {
    return new Promise(function(resolve, reject){
        let db = req.db;
        let db_cfg = req.db_cfg;
        let collection = db.get(db_cfg.COLLECTION);
        let myquery = { name: req.cookies["nodejs_resume"].name }
        collection.findOne(myquery, {})
        .then(function(doc){
            if(doc == undefined || doc == '' || doc == null) {
                reject({'success': false, 'msg': "Unable to fetch user data or internal errors occurred"})
            }
            else if(doc['last'] == undefined || doc['last'] == null) {
                reject({'success': false, 'msg': "Unable to fetch user data or internal errors occurred"})
            }
            else if(doc['expire'] == undefined || doc['expire'] == null) {
                reject({'success': false, 'msg': "Unable to fetch user data or internal errors occurred"})
            }
            else if(doc['expire'] <= (new Date()).getTime() ) {
                reject({'success': false, 'msg': "Cookie Credential Expired"})
            } else {
                resolve({'success': true, 'msg': "Got your last log-in time", 'return': doc['last']})
            }
        })
        .catch(function(e) {
            reject({'success': false, 'msg': "Unable to fetch user data or internal errors occurred"})
        });
    })
}
function update_Last_LoginTime(req) {
    return new Promise(function(resolve, reject){
        let last = (new Date()).getTime()
        let name = req.body['name']
        let hash_name_pwd = hashPW(name, req.body['pwd'])
        let t_hash = hashPW(hash_name_pwd, last)
        let db = req.db;
        let db_cfg = req.db_cfg;
        let collection = db.get(db_cfg.COLLECTION);
        let myquery = { name: req.body['name'] }
        let newvalues = { $set: {last: last, expire: last + 86400000, t_hash: t_hash} }
        collection.findOneAndUpdate(myquery, newvalues)
        .then(function() {
            resolve({'success': true, 'msg': "Updated your last log-in time", 't_hash': t_hash, 'expire': last + 86400000, 'username': name})
        })
        .catch(function(e){
            reject({'success': false, 'msg': "You might be able to log in, but we are Unable to update your last log-in time." + e})
        })
    })
}
function get_users(req) {
    return new Promise(function(resolve, reject){
        let db = req.db;
        let db_cfg = req.db_cfg;
        let collection = db.get(db_cfg.COLLECTION);
        collection.find({}, { fields : { name : 1} })
        .then(function(docs){
            resolve({'success': true, 'msg': "Got users", 'users': docs})
        })
        .catch(function(e, docs) {
            reject({'success': false, 'msg': "Unable to fetch user data or internal errors occurred"})
        });
    })
}
function sign_up(req) {
    return new Promise(function(resolve, reject){
        pwd_verify(req)
        .then(function(e){
            reject({'success': false, 'msg': "User name existed"})
        })
        .catch(function(rslt){
            if(rslt['msg'] == "User information incorrect") {
                reject({'success': false, 'msg': "User name existed"})
            } else {
                let db = req.db;
                let db_cfg = req.db_cfg;
                let collection = db.get(db_cfg.COLLECTION);
                collection.insert({
                    'name' : req.body.name,
                    'pwd': hashPW(req.body.name, req.body.pwd)
                })
                .then(function(){
                    resolve({'success': true, 'msg': "Sign up successfully"})
                })
                .catch(function(err) {
                    reject({'success': false, 'msg': "Unable to fetch user data or internal errors occurred"})
                })
            }
            
        })
    })
}
function pwd_verify(req) {
    return new Promise(function(resolve, reject){
        let db = req.db;
        let db_cfg = req.db_cfg;
        let name = req.body['name']
        let pwd = hashPW(name, req.body['pwd'])
        let collection = db.get(db_cfg.COLLECTION);
        collection.findOne({name: name}, {})
        .then(function(doc) {
            if(doc == undefined || doc == '' || doc == null) {
            reject({'success': false, 'msg': "Unable to fetch user data or internal errors occurred"})
            }
            else if(doc['pwd'] == undefined || doc['pwd'] !== pwd) {
                reject({'success': false, 'msg': "User information incorrect"})
            } else {
                resolve({'success': true, 'msg': "Password verification passed"})
            }
        })
        .catch(function(e) {
            reject({'success': false, 'msg': "Unable to fetch user data or internal errors occurred"})
        });
      });
}
function doesn_has_user_name(req) {
    return new Promise(function(resolve, reject){
        let db = req.db;
        let db_cfg = req.db_cfg;
        let name = req.body['name']
        let pwd = hashPW(name, req.body['pwd'])
        let collection = db.get(db_cfg.COLLECTION);
        collection.findOne({name: name}, {})
        .then(function(doc) {
            if(doc == undefined || doc == '' || doc == null) {
                resolve({'success': true, 'msg': "Able to create name:" + name})
            }
            else {
                reject({'success': false, 'msg': "Name:" + name + " existed."})
            }
        })
        .catch(function(e) {
            reject({'success': false, 'msg': "Unable to fetch user data or internal errors occurred"})
        });
      });
}

module.exports = {
    config: {
        // DB: 'mongodb://mongo:27017/nodetest1'
        DB: 'worker:3789610C-005D-4676-8EAE-C52A73DBFF7B@ds213229.mlab.com:13229/xzpjerryblog',
        COLLECTION: 'blog_users'
    },
    doesn_has_user_name: doesn_has_user_name,
    pwd_verify: pwd_verify,
    sign_up: sign_up,
    get_users: get_users,
    update_Last_LoginTime: update_Last_LoginTime,
    get_Last_Valid_LoginTime: get_Last_Valid_LoginTime,
    isLogined: isLogined
}
