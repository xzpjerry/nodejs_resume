var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    let need_zh = req.acceptsLanguages(['zh'])
    if(need_zh) {
        res.render("cv_cn")
    } else {
        res.render("cv")
    }
})

module.exports = router;