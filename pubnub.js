var Writable = require('stream').Writable;
var Readable = require('stream').Readable;
var util = require('util');
var fs = require ('fs');
var Twitter = require ('twitter');
var pubnub = require("pubnub");

// // Add express support for port management
// var express = require('express');
// var app     = express();

// app.set('port', (process.env.PORT || 5000));

// //For avoidong Heroku $PORT error
// app.get('/', function(request, response) {
//     var result = 'App is running'
//     response.send(result);
// }).listen(app.get('port'), function() {
//     console.log('App is running, server is listening on port ', app.get('port'));
// });

http.createServer(onRequest).listen(process.env.PORT || 6000)

var pncfg = {
   ssl           : true,  //  enable TLS Tunneling over TCP
   publish_key   : "pub-c-016fe0b0-df2e-42f3-8b02-aa96f37fd24a",
   subscribe_key : "sub-c-8f1f79c2-6363-11e8-a470-425dbd502137"
};

var twcfg = {
consumer_key:"CPKz5lp8bWjf6qWZPpAfgASKO",
   consumer_secret:"Yc3qdVcHa7a7RTbSgIkMaAi9KFhahwvpTul5jB0g0i6DjqTcWP",
   access_token_key:"961613493207293952-d0fx7eGPRqqRjaclHG6nENIfru8EVmd",
   access_token_secret:"j6dpgMjni2iBocMbbaGAGvAekG6Un9LjQ5HijPMhIML6A"
}

function LogStream() {
    Writable.call(this, {objectMode: true});
    this._write = function(obj, encoding, callback) {
        console.log('LOG', util.inspect(obj, {depth: 0}));
        callback();
    };
}

util.inherits(LogStream, Writable);

// var client = new Twitter(cfg);
// client.stream('statuses/filter', {track: query}, function(stream) {
//     stream.on('data', function(tweet) {
//         console.log("got a tweet", tweet);
//     });
//     stream.on('error', function(error) {
//         console.log("got an error", error);
//     });
// });



function TwitterStream(cfg, query) {
    Readable.call(this, {objectMode: true});

    var client = new Twitter(cfg);

    this._read = function() { /* do nothing */};
    var self = this;
    function connect() {
        client.stream('statuses/filter', {track: query}, function(stream) {
            stream.on('data', (tweet) => self.push(tweet));
            stream.on('error', (error) => connect());
        });
    }
    connect();
}

util.inherits(TwitterStream, Readable);

function PubNubStream(cfg, channel) {
    Writable.call(this, {objectMode: true});
    var pn = new pubnub(cfg);

    this._write = function(obj, encoding, callback) {
        pn.publish({
            channel: channel,
            message: obj,
            callback: callback()
        });
    };

}

util.inherits(PubNubStream, Writable);

new TwitterStream(twcfg, "pascolead").pipe(new PubNubStream(pncfg, "pasco-tweets"));