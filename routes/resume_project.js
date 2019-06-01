var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    let need_zh = req.acceptsLanguages(['zh'])
    if(need_zh) {
        res.render('resume_project_cn')
    } else {
        res.render('resume_project')
    }
})

module.exports = router;