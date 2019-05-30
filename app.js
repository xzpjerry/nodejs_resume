var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var resumeHomeRouter = require('./routes/resume_home');
var resumeProjectRouter = require('./routes/resume_project');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// make db accessible to our router
const config = require('./db').config;
var monk = require('monk')
var db = monk(config.DB)
app.use(function(req, res, next) {
  var ua = req.get('User-Agent').toLowerCase();
  if (ua.match(/MicroMessenger/i) == 'micromessenger') {
    res.send("<img src='https://i.imgur.com/FQVugpL.png'>")
    return
  }
  req.db = db;
  req.db_cfg = config;
  next();
})

app.use('/', indexRouter);
app.use('/resume', resumeHomeRouter);
app.use('/resume_projects', resumeProjectRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
