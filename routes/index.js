var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/userlist', function(req, res) {
  const db = req.db;
  const db_cfg = req.db_cfg;
  var collection = db.get(db_cfg.COLLECTION);
  collection.find({}, {}, function(e, docs) {
    res.render('userlist', {
      'userlist': docs
    });
  });
});

router.get('/newuser', function(req, res) {
  res.render('newuser', { title: 'Add New User'})
})

router.post('/adduser', function(req, res) {
  const db = req.db;
  const db_cfg = req.db_cfg;
  var collection = db.get(db_cfg.COLLECTION);

  const new_name = req.body.inputName;
  const new_email = req.body.inputEmail;
  collection.insert({
    'username' : new_name,
    'email': new_email
  }, function(err, doc) {
    if(err) {
      res.send("There was a problem when adding your info.");
    } else {
      res.redirect('userlist');
    }
  });
});

/* GET /helloWorld page. */
router.get('/helloWorld', function(req, res, next) {
  res.render('helloWorld', { title: 'helloWorld' });
});

module.exports = router;
