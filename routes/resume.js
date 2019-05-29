var express = require('express');
var router = express.Router();
var db_util = require('../db');
function allSkippingErrors(promises) {
  return Promise.all(
    promises.map(p => p.catch(error => null))
  )
}
/* GET resume page. */
router.get('/', function(req, res, next) {
  let avatar_promise = db_util.DBretrieveOne(req.db, db_util.config.RESUME_HOME_COLLECTION, "avatar")
  let about_me = db_util.DBretrieve(req.db, db_util.config.RESUME_HOME_COLLECTION, "about-me")
  allSkippingErrors([avatar_promise, about_me])
  .then(function(values) {
    db_util.isLogined(req)
    .then(function(is_logined) {
      let home_page_dict = {
        login: true,
        avatar: values[0],
        aboutme: values[1],
      }
      res.render('resume', home_page_dict)
    })
    .catch(function(isnot) {
      let home_page_dict = {
        login: false,
        avatar: values[0],
        aboutme: values[1],
      }
      res.render('resume', home_page_dict)
    })
  })
  .catch(function(err) {
    res.send(500)
  })
});

router.post('/delete', function(req, res) {
  db_util.isLogined(req)
  .then(function(is_logined) {
    db_util.DBdelete(req.db, req.body['collection'], req.body['oid'])
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
router.post('/upload/text', function(req, res) {
  db_util.isLogined(req)
  .then(function(is_logined) {
    db_util.DBsave(req.db, req.body['text'], req.body['collection'], req.body['id'])
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
router.post('/upload/image', function(req, res) {
  db_util.isLogined(req)
  .then(function(is_logined) {
    db_util.DBsaveOne(req.db, req.body['image'], req.body['collection'], req.body['id'])
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
