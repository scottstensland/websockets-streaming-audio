
console.log("TOP local_app");

var all_connections = {};   //  stens TODO - push into here each connection

// ---

var connect_to_server = function(working_dir) {


var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");
var app = express();
var port = process.env.PORT || 8888;

// var audio_obj = require("audio-utils");
// var audio_utils = audio_obj.audio_utils("dev");


// var audio_utils = require("audio-utils").audio_utils("dev");
var audio_utils = require("audio-utils").audio_utils();

// ---

var cfg = require("../config");

// console.log("here is cfg ", cfg);

var media_dir = cfg.media_dir;

console.log("here is media_dir ", media_dir);

// ---

var path = require('path');

function resolvePath(str) {
  if (str.substr(0, 2) === '~/') {
    str = (process.env.HOME || process.env.HOMEPATH || process.env.HOMEDIR || process.cwd()) + str.substr(1);
  }
  return path.resolve(str);
}

// ---

var shared_utils;

if (process.env.GITHUB_REPO_PARENT) {

    shared_utils = require(resolvePath(process.env.GITHUB_REPO_PARENT + "shared-utils/src/node_utils.js"));

    console.log("OK so env var GITHUB_REPO_PARENT is defined so shared_utils");

} else {

    shared_utils = require("shared-utils");
}

console.log("shared_utils ", shared_utils);

// ---

console.log("TOP local_app working_dir ", working_dir);

var send_object_properties_to_client = function(given_obj, curr_socket) {

    // iterate across object sending each property back to client (browser)

    for (var curr_property in given_obj) {

        var curr_value = given_obj.curr_property;

        switch (curr_property) {

            case "buffer" : {


            }
        }
    }
}

// ---

var send_binary_back_to_client = function(received_json, given_request, curr_ws) {

    var SIZE_BUFFER_SOURCE = 512;
    // var SIZE_BUFFER_SOURCE = 1048576;
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

// ---

var read_file_pop_buffer_send_back_to_client = function(received_json, given_request, curr_ws) {

    console.log("about to parse wav file, pop buffer to send back to client browser");

    console.log("__dirname ", __dirname);

    var requested_input_filename = path.join(__dirname, media_dir, received_json.requested_source);

    console.log("requested_input_filename ", requested_input_filename);

    // bbb

    // var source_obj = {};

    // try {

        shared_utils.read_wav_file(requested_input_filename, (function(audio_obj) {

            console.log("cb_read_file_done ");

            console.log("received_json.cb_client_to_server_to_client ", received_json.cb_client_to_server_to_client);
            console.log("received_json.cb_client_to_server_to_client ", received_json.cb_client_to_server_to_client);
            console.log("received_json.cb_client_to_server_to_client ", received_json.cb_client_to_server_to_client);
            console.log("received_json.cb_client_to_server_to_client ", received_json.cb_client_to_server_to_client);
            console.log("received_json.cb_client_to_server_to_client ", received_json.cb_client_to_server_to_client);



            console.log("populated buffer size ", audio_obj.buffer.length);

            shared_utils.show_object(audio_obj,
                "backHome audio_obj 32 bit signed float   read_file_done", "total", 10);

            // curr_ws.send(received_json, {binary: false, mask: true}); // send text
            curr_ws.send(given_request, {binary: false, mask: true}); // send text

            // JSON.stringify


            curr_ws.send(audio_obj.buffer, {binary: true, mask: true}); // OK good one
        }));

    // } catch (ex) {

    //     console.error("ERROR - failed to read input WAV file : ", requested_input_filename, " : ", ex);
    //     process.exit(8);
    // }
/*
    return; // stub to avoid going into below 

    var max_index = 5;
    for (var index = 0; index < max_index; index++) {

        console.log(index, " requested_input WAV buffer ", source_obj.buffer[index]);
    }

    // curr_ws.send(given_request, {binary: false, mask: true});
    // curr_ws.send(given_request, {binary: false, mask: true});

    // curr_ws.send(array, {binary: true, mask: true});
    curr_ws.send(source_obj.buffer, {binary: true, mask: true}); // OK good one
    */

};      //      send_binary_back_to_client


var route_msg = function(received_json, received_data, curr_ws) {

    console.log("received_json ", received_json);

    var requested_action = received_json.requested_action;

    if (typeof requested_action == "undefined") {

        console.error("ERROR - failed to see property : requested_action in client JSON msg");
        process.exit(8);
    };

    // callback
    // requested_source

    console.log("requested_action ", requested_action);

    switch (requested_action) {

        case "get_audio_buffer_from_server" : {

            console.log("OOKKK seeing get_audio_buffer_from_server");

            read_file_pop_buffer_send_back_to_client(received_json, received_data, curr_ws);

            break;
        };

        case null : {

            console.log("OOKKK seeing null  requested_action");
            send_binary_back_to_client(received_json, received_data, curr_ws);
            break;
        };

        default : {

            console.log("ERROR - failed to recognize client requested_action : ",
                            requested_action);            
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

    var ID_timeout;
    (function run() {  //  run immediately ... then repeat after delay
        // code here

        ws.send(JSON.stringify(process.memoryUsage()), function() {});

        ID_timeout = setTimeout(run, 2500);
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

        route_msg(received_json, received_data, ws);
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

// ---

