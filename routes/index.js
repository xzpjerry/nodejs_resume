var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('helloWorld', { title: 'Express' });
});

/* GET /helloWorld page. */
router.get('/helloWorld', function(req, res, next) {
  res.render('helloWorld', { title: 'helloWorld' });
});

module.exports = router;
