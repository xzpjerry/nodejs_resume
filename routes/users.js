var express = require('express');
var router = express.Router();
var captcha = require('../captcha')

router.get('/', function(req, res) {
  const db = req.db;
  const db_cfg = req.db_cfg;
  var collection = db.get(db_cfg.COLLECTION);
  collection.find({}, {}, function(e, docs) {
    res.render('userlist', {
      'userlist': docs
    });
  });
});

router.get('/login', function(req, res, next) {
    res.render('login', { siteKey: captcha.CAPTCHA_CFG["SITEKEY"] });
});

router.post('/login', function(req, res) {
    captcha.authetication(req, function(code) {
        if(code == 0) {
            res.json({'success': true, 'msg': "Log-in successfully."})
        } else if(code == 1){
            res.json({'success': false, 'msg': "Are you bot?"})
        } else if(code == 2) {
            res.json({'success': false, 'msg': "Unable to connect to Google API."})
        } else if(code == 3) {
            res.json({'success': false, 'msg': "Wrong user name or password"})
        }
    })
});

router.get('/newuser', function(req, res) {
  res.render('newuser', { siteKey: captcha.CAPTCHA_CFG["SITEKEY"] })
})

router.post('/adduser', function(req, res) {
  captcha.authetication(req, function(code) {
    if(code == 3) {
      const db = req.db;
      const db_cfg = req.db_cfg;
      var collection = db.get(db_cfg.COLLECTION);
      collection.insert({
        'name' : req.body.name,
        'pwd': req.body.pwd
      }, function(err, doc) {
        if(err) {
          res.json({'success': false, 'msg': "There was a problem when adding your info."});
        } else {
          res.json({'success': true, 'msg': "Sign up successfully"})
        }
      });
    } else {
        res.json({'success': false, 'msg': "OOPS, account existed or encountered a connection problem"})
    }
  })
});

module.exports = router;
