
// var local_app = function() {


console.log("TOP local_app");


var connect_to_server = function(working_dir) {

var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 8888;


console.log("TOP local_app working_dir ", working_dir);


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
    });

    ws.on("close", function() {
        console.log("websocket connection close")
        // clearInterval(id)
        clearInterval(wrap_stats.stats_id);
        // clearInterval(run.stats_id);
        // clearInterval(ID_write);
        // clearTimeout(ID_timeout);
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
/*
    return { // to make visible to calling reference frame list function here comma delimited,

        connect_to_server : connect_to_server,
        inside_local_app: inside_local_app
        // socket_server: socket_server

        // get_size_buffer: get_size_buffer,
        // get_sampled_buffer: get_sampled_buffer,
        // get_size_sampled_buffer: get_size_sampled_buffer
    };
    */

// }(); //  local_app = function()

