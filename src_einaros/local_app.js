

var connect_to_server = function(working_dir) {


console.log(require('../package.json').name, require('../package.json').version);

// var handle_comm = require("./handle_communications.js").handle_comms();
var server_comms = require("./server_comms.js");


var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");
var app = express();
var port = process.env.PORT || 8888;

// ---

var audio_utils = require("audio-utils");

// ---

var cfg = require("../config");

// console.log("here is cfg ", cfg);

var media_dir = cfg.media_dir;

console.log("here is media_dir ", media_dir);

server_comms.set_media_dir(media_dir);

// ---

// app.use(express.static(__dirname + "/")); // stens TODO - need to handle 404 file NOT found esp wav file
app.use(express.static(working_dir)); // stens TODO - need to handle 404 file NOT found esp wav file

var server = http.createServer(app);

server.listen(port);

console.log("http server listening on %d", port)

var wss = new WebSocketServer({
    server: server
});

console.log("websocket server created");

wss.on("connection", function(ws) {

    var ID_timeout;
    (function run() {  //  run immediately ... then repeat after delay
        // code here

        ws.send(JSON.stringify(process.memoryUsage()), function() {});

        ID_timeout = setTimeout(run, 60000);
    }());

    console.log("websocket connection open");

    ws.on("message", function(received_data) {

        console.log("Received message : " + received_data);

        var received_json;

        // try {

            received_json = JSON.parse(received_data);

        // } catch (error) {

        //     // console.error("ERROR " + error);
        //     // process.exit(8);

        //     console.log("Received received_json NON JSON though : error -->", error, "<--");
        //     console.log("received_data : ", received_data);
        //     // process.exit(8);
        //     return;
        // };

        // server_comms.route_msg(received_json, received_data, ws);
        server_comms.route_msg(received_json, received_data, ws);
    });

    // ---

    ws.on("error", function(event) {

        console.log("ERROR on on on error : " + event);

    });

    // ---

    ws.on("close", function() {

        console.log("websocket connection close");
        clearTimeout(ID_timeout);
    });
});

};      //      connect_to_server

exports.connect_to_server = connect_to_server;


