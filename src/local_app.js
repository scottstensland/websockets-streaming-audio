

var launch_server = function(working_dir) {

console.log(require('../package.json').name, require('../package.json').version);

var server_streaming_audio = require("./server_streaming_audio.js");

console.log("server_streaming_audio ", server_streaming_audio);


var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");
var app = express();
var port = process.env.PORT || 8888;

// ---

var cfg = require("../config");

var media_dir = cfg.media_dir;

console.log("here is media_dir ", media_dir);

server_streaming_audio.set_media_dir(media_dir);

// ---

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

        console.log(process.memoryUsage());

        ws.send(JSON.stringify(process.memoryUsage()), function() {});

        // ID_timeout = setTimeout(run, 60000);
        ID_timeout = setTimeout(run, 360000);
    }());

    console.log("websocket connection open");

    ws.on("message", function(received_data) {

        // console.log("\n\nReceived message --------------------" + received_data);

        var received_json;

        try {

            received_json = JSON.parse(received_data);

        } catch (error) {

            console.log("ERROR - received NON JSON message -->", error, "<--");
            console.log("received_data : ", received_data);
            // process.exit(8);
            return;
        };

        server_streaming_audio.route_msg(received_json, ws);
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

};      //      launch_server

exports.launch_server = launch_server;


