var express = require('express');
var router = express.Router();
var captcha = require('../captcha');
var db_util = require('../db');


router.get('/', db_util.checkLogin, function(req, res) {
  db_util.get_users(req)
  .then(function(rslt) {
    res.render('userlist', {
      'userlist': rslt['users'],
      'name': req.cookies["nodejs_resume"].name,
    })
  })
  .catch(function(e){
    res.render('404')
  })
});

router.get('/logout', function(req, res, next){
  res.clearCookie("nodejs_resume");
  res.redirect(req.query.bounceback || '/users/login');
});

router.get('/login', function(req, res, next) {
  res.cookie(
    'nodejs_resume_bounceback', 
    {
      bounceback: req.query.bounceback || '/users', 
    }, {maxAge: 86400000})
  res.render('login', { siteKey: captcha.CAPTCHA_CFG["SITEKEY"] })
});

router.post('/login', function(req, res) {
  captcha.authetication(req)
  .then(function(captcha_passed) {
    db_util.pwd_verify(req)
    .then(function(pwd_passed){
      db_util.update_Last_LoginTime(req)
      .then(function(updated_result) {
        res.cookie(
          "nodejs_resume", {
          name: updated_result['username'], 
          hash: updated_result['t_hash'], 
          expire: updated_result['expire']
        }, {maxAge: 86400000})
        pwd_passed['bounceback'] = req.cookies['nodejs_resume_bounceback']['bounceback'] || '/users'
        res.clearCookie('nodejs_resume_bounceback')
        res.json(pwd_passed)
      })
      .catch(function(erro_msg) {
        res.json(erro_msg)
      })
    })
    .catch(function(erro_msg) {
      res.json(erro_msg)
    })
  })
  .catch(function(erro_msg) {
    res.json(erro_msg)
  })
  
});

router.get('/signup', function(req, res) {
    res.render('newuser', { siteKey: captcha.CAPTCHA_CFG["SITEKEY"] })
})


router.post('/signup', function(req, res) {
  captcha.authetication(req)
  .then(function(captcha_passed) {
    db_util.doesn_has_user_name(req)
    .then(function(istrue) {
      db_util.sign_up(req)
      .then(function(successfully) {
        db_util.update_Last_LoginTime(req)
        .then(function(updated_result) {
          res.cookie("nodejs_resume", {name: updated_result['username'], hash: updated_result['t_hash'], expire: updated_result['expire']}, {maxAge: 86400000})
          successfully['bounceback'] = req.cookies['nodejs_resume_bounceback'] || '/users'
          res.clearCookie('nodejs_resume_bounceback')
          res.json(successfully)
        })
        .catch(function(erro_msg) {
          res.json(erro_msg)
        })
      })
      .catch(function(erro_msg) {
        res.json(erro_msg)
      })
    })
    .catch(function(has_name_or_error) {
      res.json(has_name_or_error)
    })
  })
  .catch(function(captcha_not_passed) {
    res.json(captcha_not_passed)
  })
});

module.exports = router;
