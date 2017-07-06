var express = require('express');
var bodyParser = require("body-parser");
//load bodyParser module to parse incoming request bodies, under req.body

var app = express();
//create an instance of Express app

//setup mongoose/mongodb
var mongoose = require('mongoose');
var db = require('./config/db');
mongoose.connect(db.url);


var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function (socket) {
  console.log("a user connected");
  socket.on('chat message', function (msg) {
    io.emit('chat message', msg);
  });
  socket.on('disconnect', function () {
    console.log("someone disconnected!");
  });
});

/*Express Middleware*/

app.use(express.static(__dirname + "/public"));
//use express middleware for serving static files from public folder (relative to public folder)
app.use(bodyParser.json());
//parse all requests as JSON in the app instance

//server "homepage" index.html when app loads
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});


//app routes


var request = require('request');
var stock = require('./models/stockmodel.js');
var Stock = mongoose.model('Stock');


// get all stocks from database
app.get('/getstocks', function (req, res) {
  Stock.find({}, function (err, stocks) {
    res.send(stocks);
  });
});


// used for the Quandl API to make date last year as of today
let getDateParam = function (year) {  
  let today = new Date();

  let yyyy = today.getFullYear() - 1;

  if (year === "begin") {
    return yyyy + '-01-01';
  }
  if (year === "end") {
    return yyyy + '-12-31';
  }
}


app.post('/addstock', function (req, res) {
  let stock_symbol = req.body.stock;
  let getBegin = getDateParam("begin");
  let getEnd = getDateParam("end");
  let url = 'https://www.quandl.com/api/v3/datasets/WIKI/' + stock_symbol + '.json?&api_key=' + process.env.QUANDLKEY + '&collapse=monthly&trim_start=' + getBegin + '&trim_end=' + getEnd;

  request(url, function (error, response, body) {
    console.log('error:', error); // Print the error if one occurred 
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
    //console.log('body:', body); // Print the HTML for the Google homepage. 
    var results = JSON.parse(body);
    
    //if no stock symbol found (error handling)
    if(results.hasOwnProperty("quandl_error")){
      console.log(results);
      res.send("bad request");
    }

    //if no error from quandl request proceed
    if(!results.hasOwnProperty("quandl_error")){
     
      Stock.findOne({ 'dataset_code': stock_symbol }, function (err, stock) {
      if (stock) {
        console.log("stock exists");
        res.send("stock exists");
      } else {
        var stock = new Stock();
        stock.dataset_code = results.dataset.dataset_code;
        stock.name = results.dataset.name;
        stock.save();
        res.send(results);

        io.emit('add', results);  //socket.io emit "add" and send results
      }
    });
      
    }

    

  });
});


//use to build charts on app load
app.post('/chartstock', function (req, res) {
  let stock_symbol = req.body.stock;
  let getBegin = getDateParam("begin");
  let getEnd = getDateParam("end");

  //quandl api free version will only display result for one full year -- cannot cross fiscal years
  //api call gets stock results from "last year"
  let url = 'https://www.quandl.com/api/v3/datasets/WIKI/' + stock_symbol + '.json?&api_key=' + process.env.QUANDLKEY + '&collapse=monthly&trim_start=' + getBegin + '&trim_end=' + getEnd;

  request(url, function (error, response, body) {
    console.log('error:', error); // Print the error if one occurred 
    //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
    res.send(body);
  });

});


app.post('/deletestock', function(req, res, next) {
   let stock_symbol = req.body.stock;

  Stock.findOneAndRemove({"dataset_code": stock_symbol}, function(err, stock){
    if(err){
      res.send(err);
    }
    res.send(stock_symbol + " removed!")

    io.emit('delete', stock_symbol);  //socket.io emit "remove" and send stock symbol of removed stock
  });


});




var port = process.env.PORT || 3000;
http.listen(port, function () {
  console.log('listening on *:' + port);
});