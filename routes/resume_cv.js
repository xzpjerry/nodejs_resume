var express = require('express');
var router = express.Router();
var db_util = require('../db');
function allSkippingErrors(promises) {
  return Promise.all(
    promises.map(p => p.catch(error => null))
  )
}
router.get('/:username', function(req, res, next) {
    let username = req.params.username
    db_util.has_user(req.db, username)
    .then(function(good) {
        let need_zh = req.acceptsLanguages(['zh'])
        let edu_promise = db_util.DBretrieve(req.db, username, "edu", "cv")
        let work_promise = db_util.DBretrieve(req.db, username, "work", "cv")
        allSkippingErrors([edu_promise, work_promise])
        .then(function(values) {
        db_util.isLogined_as(req, username)
        .then(function(is_logined) {
            let cv_page_dict = {
                login: true,
                name: username,
                edu: values[0],
                work: values[1],
            }
            if(need_zh) {
                res.render('cv_cn', cv_page_dict)
            } else {
                res.render('cv', cv_page_dict)
            }
        })
        .catch(function(isnot) {
            let cv_page_dict = {
                login: false,
                name: username,
                edu: values[0],
                work: values[1],
            }
            if(need_zh) {
                res.render('cv_cn', cv_page_dict)
            } else {
                res.render('cv', cv_page_dict)
            }
        })
        })
    })
    .catch(function(err) {
        res.redirect('/resume_cv/me')
    })
})
router.get('/', function(req, res, next) {
    let cookie = req.cookies["nodejs_resume"]
    let username = 'me'
    if(cookie){
      username = cookie.name 
    }
    res.redirect('/resume_cv/' + username)
});

router.post('/delete/:username', function(req, res) {
    let username = req.params.username
    db_util.isLogined_as(req, username)
    .then(function(is_logined) {
      let username = req.cookies["nodejs_resume"].name
      db_util.DBdelete(req.db, username, req.body['oid'])
      .then(function(rslt) {
        res.json(rslt)
      })
      .catch(function(rslt) {
        res.json(rslt)
      })
    })
    .catch(function(err) {
      res.send(500)
    })
});
router.post('/upload/item/:username', function(req, res) {
    let username = req.params.username
    db_util.isLogined_as(req, username)
    .then(function(is_logined) {
        let item = {
            title: req.body['title'],
            org: req.body['org'],
            period: req.body['period'],
            text: req.body['text[]'],
        }
        db_util.DBsave(req.db, item, username, req.body['id'], req.body['kind'])
        .then(function(rslt) {
            res.redirect('back');
        })
        .catch(function(rslt) {
            res.json(rslt)
        })
    })
    .catch(function(err) {
      res.send(500)
    })
});
router.post('/upload/image/:username', function(req, res) {
    let username = req.params.username
    db_util.isLogined_as(req, username)
    .then(function(is_logined) {
      let username = req.cookies["nodejs_resume"].name
      db_util.DBsaveOne(req.db, req.body['image'], username, req.body['id'], req.body['kind'])
      .then(function(rslt) {
        res.json(rslt)
      })
      .catch(function(rslt) {
        res.json(rslt)
      })
    })
    .catch(function(err) {
      res.send(500)
    })
});

module.exports = router;