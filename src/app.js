var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 8888;

app.use(express.static(__dirname + "/"));

var server = http.createServer(app);

server.listen(port);

console.log("http server listening on %d", port)

var wss = new WebSocketServer({
    server: server
});

console.log("websocket server created");

wss.on("connection", function(ws) {

    // var id = setInterval(function() {
    //     ws.send(JSON.stringify(new Date()), function() {});
    // }, 1000);



    // var stats_id = setInterval(function() {

    //     ws.send(JSON.stringify(process.memoryUsage()), function() { /* ignore errors */ });

    // }, 100);

    // var just_sayit = function() {

    //     console.log("...");
    // }

    // var ID_write = setInterval(just_sayit, 50);

    var wrap_stats = function() {

        console.log("NOW calling wrap_stats");

        var stats_id = setInterval(function() {

            ws.send(JSON.stringify(process.memoryUsage()), function() { /* ignore errors */ });

        }, 100);
    };

    var ID_timeout = setTimeout(wrap_stats, 2000);

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
        // clearInterval(ID_write);
        clearTimeout(ID_timeout);
    });
});