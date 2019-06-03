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
        allSkippingErrors([])
        .then(function(values) {
        db_util.isLogined_as(req, username)
        .then(function(is_logined) {
            let page_dict = {
                login: true,
                name: username,
            }
            if(need_zh) {
                res.render('resume_project_cn', page_dict)
            } else {
                res.render('resume_project', page_dict)
            }
        })
        .catch(function(isnot) {
            let page_dict = {
                login: false,
                name: username,
            }
            if(need_zh) {
                res.render('resume_project_cn', page_dict)
            } else {
                res.render('resume_project', page_dict)
            }
        })
        })
    })
    .catch(function(err) {
        res.redirect('/resume_projects/me')
    })
})
router.get('/', function(req, res, next) {
    let cookie = req.cookies["nodejs_resume"]
    let username = 'me'
    if(cookie){
      username = cookie.name 
    }
    res.redirect('/resume_projects/' + username)
});


module.exports = router;