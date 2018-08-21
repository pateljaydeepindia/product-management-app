var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var passportJWT = require("passport-jwt");
var jwt = require('jsonwebtoken');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');

const multer = require('multer');

mongoose.connect('mongodb://localhost:27017/inventory');
var db = mongoose.connection;

var routes = require('./routes/index');
var users = require('./routes/users');

// Init App
var app = express();

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Connect Flash
app.use(flash());

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});



app.use('/', routes);
app.use('/users', users);


// Check File Type
function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif|JPEG|JPG|PNG|GIF/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}

app.post("/upload", function(req, res, fields) {

  const storage = multer.diskStorage({
    destination: './../frontend/client/app/assets/images/products/',
    filename: function(req, file, cb){

        if(file.fieldname=='img_url')
        cb(null,'default' + '-' + req.body.title.replace(/[^0-9A-Z]+/gi,"") + path.extname(file.originalname));

        if(file.fieldname=='otherimages')        
        cb(null,'otherimages' + '-' + req.body.title.replace(/[^0-9A-Z]+/gi,"") + '-' +  file.originalname);

    }
  });

  const upload = multer({
    storage: storage,
    limits:{fileSize: 1000000},
      fileFilter: function(req, file, cb){
        checkFileType(file, cb);
      }
  }).fields([
    { name: 'img_url', maxCount: 1 },
    { name: 'otherimages', maxCount: 9 }
   ]);

  upload(req, res, (err) => {
        if(err){
          res.render('error', {
            msg: err
          });
        } else {
          if(req.files == undefined){
            res.render('error', {
            });
          } else {
            var default_file_name="/app/assets/images/products/"+req.files.img_url[0].filename;
            var otherimages_file_names=[];
            if(req.files.otherimages !== undefined){
              for(var i=0;i<req.files.otherimages.length;i++){
                  otherimages_file_names.push("/app/assets/images/products/"+req.files.otherimages[i].filename);
              }
            }
            //console.log(default_file_name,otherimages_file_names);
            db.collection('item').find().count(function(error,count){
               db.collection('item').insert({ "_id" : count+1, "title" : req.body.title, "sku" : req.body.sku, "description" : req.body.description, "stars" : 0, "category" : req.body.category, "img_url" : default_file_name, "price" : req.body.price, "otherimages" : otherimages_file_names },function(error,count){
                  res.render('success', {
                  });
               });
            });

            
       
          }
        }
      });

});

// Set Port
app.set('port', (process.env.PORT || 8000));

app.listen(app.get('port'), function(){
  console.log('Server started on port '+app.get('port'));
});