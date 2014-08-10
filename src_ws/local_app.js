
// var local_app = function() {


console.log("TOP local_app");

var all_connections = {};   //  stens TODO - push into here each connection

// ---

var connect_to_server = function(working_dir) {


var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 8888;


console.log("TOP local_app working_dir ", working_dir);

// ---

var send_binary_back_to_client = function(given_request, curr_ws) {

    var array = new Float32Array(5);

    for (var i = 0; i < array.length; ++i) array[i] = i / 2;

    console.log("cool about to send a binary Float32Array back to client browser");

    curr_ws.send(array, {binary: true, mask: true});
};

// ---


// app.use(express.static(__dirname + "/"));
app.use(express.static(working_dir));

var server = http.createServer(app);

server.listen(port);

console.log("http server listening on %d", port)

var wss = new WebSocketServer({
    server: server
});

console.log("websocket server created");

wss.on("connection", function(ws) {

    var wrap_stats = function() {

        console.log("NOW calling wrap_stats");

        var stats_id = setInterval(function() {

            ws.send(JSON.stringify(process.memoryUsage()), function() {});

        }, 100);
    };

    var ID_timeout = setTimeout(wrap_stats, 20);


    console.log("websocket connection open");


    app.on("text", function(received_data) {

        console.log("Received text format : " + received_data);
    });


    ws.on("message", function(received_data) {

        console.log("Received message : " + received_data);

        var received_json;

        try {

            received_json = JSON.parse(received_data);

            send_binary_back_to_client(received_json, ws);

        } catch (error) {

            // console.error("ERROR " + error);
            // process.exit(8);

            console.log("Received received_json NON JSON though : ", received_json);
        }
    });

    // ---


    // ---

    ws.on("close", function() {
        console.log("websocket connection close")
        // clearInterval(id)
        clearInterval(wrap_stats.stats_id);
        // clearInterval(run.stats_id);
        // clearInterval(ID_write);
        clearTimeout(ID_timeout);
    });
});

};      //      connect_to_server

exports.connect_to_server = connect_to_server;

// ---

var inside_local_app = function() {

    console.log("TOP inside_local_app");
};
exports.inside_local_app = inside_local_app;

// ---------------------------------------