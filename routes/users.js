var express = require('express');
var router = express.Router();
var captcha = require('../captcha');
var pwd_ver = require('../db').pwd_verify;
var sign_up = require('../db').sign_up;
var get_user = require('../db').get_users;
var updateLastLoginTime = require('../db').update_Last_LoginTime;

router.get('/', function(req, res) {
  get_user(req).then(function(docs) {
    res.render('userlist', {
      'userlist': docs
    }); 
  }).catch(function(e){
    res.render('404')
  })
});

router.get('/login', function(req, res, next) {
    res.render('login', { siteKey: captcha.CAPTCHA_CFG["SITEKEY"] });
});

router.post('/login', function(req, res) {
  captcha.authetication(req).then(function(val){
    pwd_ver(req).then(function(val){
        req.last = (new Date()).getTime()
        updateLastLoginTime(req).then(function(val){
          // res.cookie("nodejsResume", {account: userName, hash: hash}, {maxAge: 60000})
          res.json({'success': true, 'msg': "Log-in successfully."})
        }).catch(function(e){
          res.json({'success': true, 'msg': "Log-in successfully, but unable to Update Your Last Log in Time" + e})
        })
      }).catch(function(code) {
        if(code == 2) {
          res.json({'success': false, 'msg': "Unable to connect to the Database."})
        } else if(code == 3) {
          res.json({'success': false, 'msg': "Wrong user name or password"})
        }
      })
  }).catch(function(code){
      res.json({'success': false, 'msg': "Unable to pass the Recaptcha"});
    })
});

router.get('/newuser', function(req, res) {
    res.render('newuser', { siteKey: captcha.CAPTCHA_CFG["SITEKEY"] })
})


router.post('/adduser', function(req, res) {
  captcha.authetication(req).then(function(val){
    sign_up(req).then(function(val) {
      req.last = (new Date()).getTime()
      updateLastLoginTime(req).then(function(val){
        res.json({'success': true, 'msg': "Sign up successfully"})
      }).catch(function(e){
        res.json({'success': true, 'msg': "Log-in successfully, but unable to Update Your Last Log in Time"})
      })
    }).catch(function(val){
      res.json({'success': false, 'msg': "There was a problem when adding your info."});
    })
  }).catch(function(code){
    res.json({'success': false, 'msg': "Unable to pass the Recaptcha"});
  })
});

module.exports = router;
