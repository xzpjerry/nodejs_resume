// db.js
var monk_id = require('monk').id
let createHash = require('crypto').createHash
const credential = require("./credential.js")
const config = {
    DB: credential.DB,
    // DB: '<To be filled out>',
    COLLECTIONS: ['blog_users', 'home_page'],
    USER_COLLECTION: 'blog_users',
    DEFAULT_DOC_COLLECTION: 'me',
    HOME_PAGE_KIND: 'home_page'
}

function hashPW(userName, pwd){
  let hash = createHash('md5');
  hash.update(userName + pwd);
  return hash.digest('hex');
}
function checkLogin(req, res, next) {
    // Checks if the user is logged in
    isLogined_as(req, "me")
    .then(function(it_is){
      // If user is logged in
      // go on
      next();
    })
    .catch(function(it_is_not){
      // If user is not logged in
      // Get relative path of current url
      const url = req.originalUrl;
      // And redirect to login page, passing
      // the url as a query string that the client
      // would return to after successfully logined
      res.redirect('/users/login/?bounceback='+url);
    })
}
function isLogined_as(req, username) {
    return new Promise(function(resolve, reject) {
        if(req.cookies["nodejs_resume"] == null || req.cookies["nodejs_resume"].name == null || req.cookies["nodejs_resume"].name !== username || req.cookies["nodejs_resume"].hash == null || req.cookies["nodejs_resume"].expire == null){
            reject({'success': false, 'msg': "Unable to fetch user's cookie"})
        }
        get_Last_Valid_LoginTime(req)
        .then(function(rslt1) {
            let db = req.db;
            let collection = db.get(config.USER_COLLECTION);
            collection.findOne({name: username}, {})
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
function isLogined(req) {
    return new Promise(function(resolve, reject) {
        if(req.cookies["nodejs_resume"] == null || req.cookies["nodejs_resume"].name == null || req.cookies["nodejs_resume"].hash == null || req.cookies["nodejs_resume"].expire == null){
            reject({'success': false, 'msg': "Unable to fetch user's cookie"})
        }
        get_Last_Valid_LoginTime(req)
        .then(function(rslt1) {
            let db = req.db;
            let db_cfg = req.db_cfg;
            let collection = db.get(db_cfg.USER_COLLECTION);
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
        let collection = db.get(db_cfg.USER_COLLECTION);
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
            else if(doc['expire'] <= (new Date()).getTime()) {
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
        let collection = db.get(db_cfg.USER_COLLECTION);
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
        let collection = db.get(db_cfg.USER_COLLECTION);
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
        let db = req.db;
        let collection = db.get(config.USER_COLLECTION);
        let username = req.body.name
        collection.insert({
            'name' : username,
            'pwd': hashPW(username, req.body.pwd)
        })
        .then(function(docInserted){
            let user_doc_collection = db.get(username)
            if(!user_doc_collection) {
                user_doc_collection = db.create(username)
            }
            let creator_collection = db.get(config.DEFAULT_DOC_COLLECTION)
            creator_collection.aggregate([{$match:{}},{$out:username}])
            .then(function(inited_user_doc) {
                resolve({'success': true, 'msg': "Sign up successfully"})
            })
            .catch(function(failed) {
                user_doc_collection.drop()
                .then(function(undo_init) {
                    DBdelete(db, config.USER_COLLECTION, docInserted['_id'])
                    .then(function(undo_insertion) {
                        reject({'success': false, 'msg': "Unable to init user data." + undo_insertion['msg']})
                    })
                    .catch(function(this_should_not_happen){
                        reject({'success': false, 'msg': "Internal errors occurred"})
                    })
                })
                .catch(function(unable_to_undo_init) {
                    DBdelete(db, config.USER_COLLECTION, docInserted['_id'])
                    .then(function(undo_insertion) {
                        reject({'success': false, 'msg': "Unable to initilize your data and also cannot undo the pre-init." + undo_insertion['msg']})
                    })
                    .catch(function(this_should_not_happen){
                        reject({'success': false, 'msg': "Internal errors occurred"})
                    })
                })
                
            })
        })
        .catch(function(err) {
            reject({'success': false, 'msg': "Unable to fetch user data or internal errors occurred"})
        })
    })
}
function pwd_verify(req) {
    return new Promise(function(resolve, reject){
        let db = req.db;
        let db_cfg = req.db_cfg;
        let name = req.body['name']
        let pwd = hashPW(name, req.body['pwd'])
        let collection = db.get(db_cfg.USER_COLLECTION);
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
        let collection = db.get(db_cfg.USER_COLLECTION);
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

function DBdelete(db, from_collection, with_oid) {
    return new Promise(function(resolve, reject){
        let collection = db.get(from_collection);
        collection.findOneAndDelete({_id: monk_id(with_oid)})
        .then(function(){
            resolve({'success': true, 'msg': "Deleted successfully"})
        })
        .catch(function(err) {
            reject({'success': false, 'msg': "Unable to delete the data or internal errors occurred"})
        })
    })
}

function DBsave(db, the_data, to_collection, with_id, with_kind) {
    return new Promise(function(resolve, reject){
        let collection = db.get(to_collection);
        collection.insert({
            'id' : with_id,
            'data': the_data,
            'kind': with_kind,
        })
        .then(function(){
            resolve({'success': true, 'msg': "Inserted successfully"})
        })
        .catch(function(err) {
            reject({'success': false, 'msg': "Unable to insert the data or internal errors occurred"})
        })
    })
}
function DBretrieve(db, from_collection, with_id, with_kind) {
    return new Promise(function(resolve, reject){
        let collection = db.get(from_collection);
        collection.find({id: with_id, kind:with_kind}, {})
        .then(function(docs) {
            if(docs == undefined || docs == '' || docs == null || !docs.length) {
                reject({'success': false, 'msg': "Unable to fetch user data or internal errors occurred"})
            }
            else {
                resolve({'success': true, "return": docs})
            }
        })
        .catch(function(e) {
            reject({'success': false, 'msg': "Unable to fetch user data or internal errors occurred"})
        });
      });
}

function DBsaveOne(db, the_data, to_collection, with_id, with_kind) {
    return new Promise(function(resolve, reject){
        let collection = db.get(to_collection);
        collection.update(
            {id: with_id, kind: with_kind},
            {
                'data' : the_data,
                'id': with_id,
                'kind': with_kind,
            },
            { upsert: true }
        )
        .then(function(){
            resolve({'success': true, 'msg': "Created/updated the data entity in the DB successfully"})
        })
        .catch(function(err) {
            reject({'success': false, 'msg': "Unable to create/update the data entity in the DB or internal errors occurred"})
        })
    })      
}
function DBretrieveOne(db, from_collection, with_id, with_kind) {
    return new Promise(function(resolve, reject){
        let collection = db.get(from_collection);
        collection.findOne({id: with_id, kind: with_kind}, {})
        .then(function(doc) {
            if(doc == undefined || doc == '' || doc == null) {
                reject({'success': false, 'msg': "Unable to fetch user data or internal errors occurred"})
            }
            else {
                resolve({'success': true, "return": doc['data']})
            }
        })
        .catch(function(e) {
            reject({'success': false, 'msg': "Unable to fetch user data or internal errors occurred"})
        });
      });
}
function has_user(db, username) {
    return new Promise(function(resolve, reject){
        let collection = db.get(config.USER_COLLECTION);
        collection.findOne({name: username}, {})
        .then(function(doc) {
            if(doc == undefined || doc == '' || doc == null) {
                reject({'success': false, 'msg': "Unable to fetch user data or internal errors occurred"})
            }
            else {
                resolve({'success': true})
            }
        })
        .catch(function(e) {
            reject({'success': false, 'msg': "Unable to fetch user data or internal errors occurred"})
        });
      });
}

module.exports = {
    config: config,
    checkLogin: checkLogin,
    doesn_has_user_name: doesn_has_user_name,
    pwd_verify: pwd_verify,
    sign_up: sign_up,
    get_users: get_users,
    update_Last_LoginTime: update_Last_LoginTime,
    get_Last_Valid_LoginTime: get_Last_Valid_LoginTime,
    isLogined: isLogined,
    isLogined_as: isLogined_as,
    DBsaveOne: DBsaveOne,
    DBretrieveOne: DBretrieveOne,
    DBsave: DBsave,
    DBretrieve: DBretrieve,
    DBdelete: DBdelete,
    has_user: has_user,
}
