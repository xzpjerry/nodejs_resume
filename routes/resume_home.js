var express = require('express');
var router = express.Router();
var db_util = require('../db');
function allSkippingErrors(promises) {
  return Promise.all(
    promises.map(p => p.catch(error => null))
  )
}
/* GET resume page. */
router.get('/:username', function(req, res, next) {
  let username = req.params.username
  let avatar_promise = db_util.DBretrieveOne(req.db, username, "avatar", "home_page")
  let about_me_promise = db_util.DBretrieve(req.db, username, "about-me", "home_page")
  allSkippingErrors([avatar_promise, about_me_promise])
  .then(function(values) {
    if(!values[0] && !values[1]) {
      res.redirect('/resume/me')
      return
    }
    db_util.isLogined_as(req, username)
    .then(function(is_logined) {
      let home_page_dict = {
        login: true,
        name: username,
        avatar: values[0] || {return: "resume_assets/img/avatars/avatar.png"},
        aboutme: values[1],
      }
      let need_zh = req.acceptsLanguages(['zh'])
      if(need_zh) {
        res.render('resume_home_cn', home_page_dict)
      } else {
        res.render('resume_home', home_page_dict)
      }
    })
    .catch(function(isnot) {
      let home_page_dict = {
        login: false,
        name: username,
        avatar: values[0] || {return: "resume_assets/img/avatars/avatar.png"},
        aboutme: values[1],
      }
      let need_zh = req.acceptsLanguages(['zh'])
      if(need_zh) {
        res.render('resume_home_cn', home_page_dict)
      } else {
        res.render('resume_home', home_page_dict)
      }
    })
  })
  .catch(function(err) {
    res.send(500)
  })
});
router.get('/', function(req, res, next) {
  let cookie = req.cookies["nodejs_resume"]
  let username = 'me'
  if(cookie){
    username = cookie.name 
  }
  res.redirect('/resume/' + username)
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
router.post('/upload/text/:username', function(req, res) {
  let username = req.params.username
  db_util.isLogined_as(req, username)
  .then(function(is_logined) {
    let username = req.cookies["nodejs_resume"].name
    db_util.DBsave(req.db, req.body['text'], username, req.body['id'], req.body['kind'])
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
