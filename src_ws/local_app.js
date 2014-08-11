
console.log("TOP local_app");

var all_connections = {};   //  stens TODO - push into here each connection

// ---

var connect_to_server = function(working_dir) {


var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");
var app = express();
var port = process.env.PORT || 8888;

var audio_obj = require("audio-utils");
var audio_utils = audio_obj.audio_utils("dev");


console.log("TOP local_app working_dir ", working_dir);

// ---

var send_binary_back_to_client = function(received_json, given_request, curr_ws) {

    // var SIZE_BUFFER_SOURCE = 512;
    var SIZE_BUFFER_SOURCE = 1048576;
    var samples_per_cycle = 64;

        /*
    var array = new Float32Array(5);

    for (var i = 0; i < array.length; ++i) array[i] = i / 2;
        */

    console.log("cool about to send a binary Float32Array back to client browser");

    var source_obj = audio_utils.pop_audio_buffer(SIZE_BUFFER_SOURCE, samples_per_cycle);

    var max_index = 5;
    for (var index = 0; index < max_index; index++) {

        console.log(index, " pop_audio_buffer ", source_obj.buffer[index]);
    }

    console.log("....aaa bout to send given_request ", given_request);

    // curr_ws.send(given_request, {binary: false, mask: true});
    // curr_ws.send(given_request, {binary: false, mask: true});

    // curr_ws.send(array, {binary: true, mask: true});
    curr_ws.send(source_obj.buffer, {binary: true, mask: true}); // OK good one

};      //      send_binary_back_to_client


var route_msg = function(received_json, received_data, curr_ws) {

    console.log("received_json ", received_json);

    var requested_datetype = received_json.datatype;

    if (typeof requested_datetype == "undefined") {

        console.error("ERROR - failed to see property : datatype in client JSON msg");
        process.exit(8);
    };

    switch (requested_datetype) {

        case "float" : {

            console.log("OOKKK seeing datatype float");

            send_binary_back_to_client(received_json, received_data, curr_ws);

            break;
        };

        case "integer" : {

            console.log("OOKKK seeing datatype integer");
            break;
        };

        default : {

            console.log("ERROR - failed to recognize client requested datatype : ",
                            requested_datetype);            
            process.exit(8);
        }
    }
};      //      route_msg


// app.use(express.static(__dirname + "/"));
app.use(express.static(working_dir)); // stens TODO - need to handle 404 file NOT found esp wav file

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

/*
    app.on("text", function(received_data) { // stens TODO - does this app.on belong here ???

        console.log("Received text format : " + received_data);
    });
*/

    ws.on("message", function(received_data) {

        console.log("Received message : " + received_data);

        var received_json;

        try {

            received_json = JSON.parse(received_data);

            route_msg(received_json, received_data, ws);

        } catch (error) {

            // console.error("ERROR " + error);
            // process.exit(8);

            console.log("Received received_json NON JSON though : ", received_data);
        };
    });

    // ---


    ws.on("error", function(event) {

        console.log("ERROR on on on error : " + event);

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

/*
var inside_local_app = function() {

    console.log("TOP inside_local_app");
};
exports.inside_local_app = inside_local_app;
*/

// ---------------------------------------

