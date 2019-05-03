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
module.exports.authetication = function authetication(req, debug=false) {
    return new Promise(function(resolve, reject){
        if(!debug && (req.body['captcha'] === undefined || req.body['captcha'] === '' || req.body['captcha'] === null)){
            reject(1)
        }
        else {
            const verificationURL = COMBO + "&response=" + req.body['captcha'] + "&remoteip=" + req.connection.remoteAddress;
            request(verificationURL,function(error,response,body) {
                if(error) {
                    reject(2)
                } else {
                    body = JSON.parse(body);
                    if((body.success == undefined || !body.success) && !debug) {
                        reject(1)
                    }
                    resolve(0)
                }
            })
        }
    })
}