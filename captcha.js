const CAPTCHA_CFG = {
    SECRETKEY: "<To be filled out>",
    SITEKEY: "<To be filled out>",
    // SECRETKEY: "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe",//debug key
    // SITEKEY: "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",//debug key
    GOOGLE_CAPTCHA_API: 'https://www.google.com/recaptcha/api/siteverify?secret=',
}

// captcha request handling
const request = require('request')
const COMBO = CAPTCHA_CFG.GOOGLE_CAPTCHA_API + CAPTCHA_CFG.SECRETKEY

module.exports.CAPTCHA_CFG = CAPTCHA_CFG
module.exports.authetication = function authetication(req, debug=false) {
    return new Promise(function(resolve, reject){
        if(!debug && (req.body['captcha'] === undefined || req.body['captcha'] === '' || req.body['captcha'] === null)){
            reject({'success': false, 'msg': "Haven't done the captcha."})
        }
        else {
            const verificationURL = COMBO + "&response=" + req.body['captcha'] + "&remoteip=" + req.connection.remoteAddress;
            request(verificationURL,function(error,response,body) {
                if(error) {
                    reject({'success': false, 'msg': "The server is unable to connect to Google's captcha."})
                } else {
                    body = JSON.parse(body);
                    if((body.success == undefined || !body.success) && !debug) {
                        reject({'success': false, 'msg': "Verfication of captcha failed."})
                    }
                    resolve({'success': true, 'msg': "Captcha test is passed"})
                }
            })
        }
    })
}