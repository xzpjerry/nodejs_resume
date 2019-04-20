const CAPTCHA_CFG = {
    // SECRETKEY: "6LcKPJ8UAAAAAJMqKJDnX9KtAGLwA_q8mjccY4f0",
    // SITEKEY: "6LcKPJ8UAAAAAIHf6q6qws9jCcpejwA-OJVo5G84",
    SECRETKEY: "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe",//debug key
    SITEKEY: "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",//debug key
    GOOGLE_CAPTCHA_API: 'https://www.google.com/recaptcha/api/siteverify?secret=',
}

// captcha request handling
const request = require('request')
const COMBO = CAPTCHA_CFG.GOOGLE_CAPTCHA_API + CAPTCHA_CFG.SECRETKEY

module.exports.CAPTCHA_CFG = CAPTCHA_CFG
module.exports.authetication = function(req, callback, debug=false) {
  if(!debug && (req.body['captcha'] === undefined || req.body['captcha'] === '' || req.body['captcha'] === null))
  {
      return callback(1)
  }

  const verificationURL = COMBO + "&response=" + req.body['captcha'] + "&remoteip=" + req.connection.remoteAddress;

  request(verificationURL,function(error,response,body) {
    if(error) {
        return callback(2)
    }
    body = JSON.parse(body);

    if((body.success == undefined || !body.success) && !debug) {
        return callback(1)
    }

    const db = req.db;
    const db_cfg = req.db_cfg;
    let name = req.body['name']
    let pwd = req.body['pwd']
    let collection = db.get(db_cfg.COLLECTION);
    collection.findOne({name: name}, {}, function(e, doc) {
        if(e) {
            return callback(2)
        }
        if(doc == undefined || doc == '' || doc == null) {
            return callback(3)
        }
        if(doc['pwd'] !== pwd) {
            return callback(3)
        }
        return callback(0)
    });
  });
}