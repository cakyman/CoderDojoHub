function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

const winston = require("winston");
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log` 
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const fs = require('fs');
const path = require('path');
const mkpath = require('mkpath');
const moment = require('moment');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  logger.info("Connected to MongoDB server.")
});

var userSchema = mongoose.Schema({
  name: String,
  signIns: {
    type: Map,
    of: String
  }
});
//signins ->
// key -> calendar date (e.g "15/06/2018")
// value -> full moment object (e.g "2018-06-15T17:23:15.079")

// NOTE: methods must be added to the schema before compiling it with mongoose.model()
userSchema.methods.listSignIns = function () {
  logger.info(`=== All Sign-ins for ${this.name} ===`)
  this.signIns.forEach(function(v, k, m) {
    logger.info(`${k} -> ${v}`);
  }, this)
  logger.info("=====================================")

}

var Kitten = mongoose.model('Kitten', userSchema);

var silence = new Kitten({ name: 'Silence' });
logger.info(silence.name); // 'Silence'

var fluffy = new Kitten({ name: 'fluffy', signIns: {}});
var mom = moment();
fluffy.signIns.set(mom.format('L'), mom);
fluffy.listSignIns(); // "Meow name is fluffy"

fluffy.save(function (err, fluffy) {
  if (err) return logger.error(err);
  // fluffy.speak();
});

Kitten.find(function (err, kittens) {
  if (err) return console.error(err);
  logger.warn(kittens.join(",\n"));
})

var express = require('express')
var app = express()

var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.set('view engine', 'pug')
app.use(express.static('public'))

app.get('/', function (req, res) {
  res.render('signin', {table: today, moment:moment})
})

var today = [];

app.post('/', function(req, res) {
  if(req.body.name.trim() == "") return res.redirect("/");
  var now = moment();
  var date = now.format("L").split("/").reverse().join("/");
  if(today[req.body.name.trim()] == undefined) {
    today[req.body.name.trim()] = {};
  }
  if(req.body.type == "signin") {
    var object = {name: req.body.name.trim()}
    object[req.body.type] = now.format("x");
    today.push(object); //signin or signout
  } else {
    for(var i = 0; i < today.length; i++) {
      if(today[i].name.trim() == req.body.name.trim()) {
        today[i][req.body.type] = now.format("x");
      }
    }
  }

  mkpath(path.join(__dirname, "json", date), function(err) {
    if (err) logger.error("mkpath: " + err);
    fs.writeFile(path.join(__dirname, "json", date + ".json"), JSON.stringify(today), function(error){
      if(error) logger.error(error);
      logger.info(today);
      logger.info("Saved today's table to " + `/json/${date}`);
    });
  });
  
  res.redirect("/");
})

app.get('/list', function (req, res) {
  res.render('list', {})
})

app.get('/day/:year/:month/:day', function(req, res) {
  var fin = JSON.parse(fs.readFileSync(__dirname + `/json/${req.params.year}/${req.params.month}/${req.params.day}.json`));
  for(var i = 0; i < fin.length; i++) {
    fin[i].signin = moment(fin[i].signin, "x").calendar();
    fin[i].signout = moment(fin[i].signout, "x").calendar();
  }
  logger.info(fin);
  res.render('day', {day: `${req.params.day}/${req.params.month}/${req.params.year}`, table: fin});
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => logger.info('HTTP Server listening on port ' + PORT + '.'))