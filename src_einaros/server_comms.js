
// var server_comms = function(given_received_json, given_received_data, given_curr_ws) {


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

// --------------------------------------------------------  //

// 2^9 512
// 2^10 1024
// 2^11 2048
// 2^12 4096
// 2^13 8192
// 2^14 16384
// 2^15 32768
// 2^16 65536
// 2^17 131072
// 2^18 262144
// 2^19 524288
// 2^20 1048576


// var BUFFER_SIZE_STREAMING = 512; // size of buffer sent from server to client per callback cycle
// var BUFFER_SIZE_STREAMING = 8192; // size of buffer sent from server to client per callback cycle
var BUFFER_SIZE_STREAMING = 16384; // size of buffer sent from server to client per callback cycle
// var BUFFER_SIZE_STREAMING = 32768; // size of buffer sent from server to client per callback cycle
// var BUFFER_SIZE_STREAMING = 65536; // size of buffer sent from server to client per callback cycle
// var BUFFER_SIZE_STREAMING = 131072; // size of buffer sent from server to client per callback cycle
// var BUFFER_SIZE_STREAMING = 262144; // size of buffer sent from server to client per callback cycle


var temp_stream_chunk_buffer = new Float32Array(BUFFER_SIZE_STREAMING);

var stream_status_prior = "prior";
var stream_status_populated = "populated";
var stream_status_complete = "complete";

var streaming_buffer_obj = {

    curr_state : stream_status_prior,
    index_stream : 0
};

// ---

var media_dir;
var set_media_dir = function(given_media_dir) {

    media_dir = given_media_dir;
};
exports.set_media_dir = set_media_dir;

var stream_another_chunk_to_client = function(received_json, given_request, curr_ws) {

    var curr_index = streaming_buffer_obj.index_stream;
    var max_index = streaming_buffer_obj.max_index;

    console.log(curr_index + " out of " + max_index);

    for (var local_index = 0; local_index < BUFFER_SIZE_STREAMING && curr_index < max_index;) {

        temp_stream_chunk_buffer[local_index] = streaming_buffer_obj.buffer[curr_index];
        local_index++;
        curr_index++;
    };

    console.log("about to send binary temp_stream_chunk_buffer to client");

    // curr_ws.send(temp_stream_chunk_buffer, {binary: true, mask: true}); // send binary buffer
    curr_ws.send(temp_stream_chunk_buffer, {binary: true, mask: false}); // send binary buffer

    streaming_buffer_obj.index_stream = curr_index;

    if (curr_index == max_index) {

        streaming_buffer_obj.curr_state = stream_status_complete;

        var streaming_is_done_msg = {

            streaming_is_done : "yes",
            max_index : max_index
        };

        // bbb

        console.log("streaming_is_done_msg ", streaming_is_done_msg);

        // curr_ws.send(JSON.stringify(streaming_is_done_msg), {binary: false, mask: true});
        curr_ws.send(JSON.stringify(streaming_is_done_msg), {binary: false, mask: false});
    }
}

// ---

var send_client_source_data_info = function(audio_obj, curr_websocket) {

    var all_property_tags = {};

    for (var curr_property in audio_obj) {

        if (curr_property === "buffer") {

            continue;
        }

        console.log("curr_property ", curr_property);

        all_property_tags[curr_property] = audio_obj[curr_property];
    }

    console.log("all_property_tags ", all_property_tags);

// bbb

    curr_websocket.send(JSON.stringify(all_property_tags), {binary: false, mask: false});
}

// ---

var read_file_pop_buffer = function(received_json, given_request, curr_ws) {

    console.log("about to parse wav file, pop buffer to send back to client browser");

    console.log("__dirname ", __dirname);

    var requested_input_filename = path.join(__dirname, media_dir, received_json.requested_source);

    console.log("requested_input_filename ", requested_input_filename);

    shared_utils.read_wav_file(requested_input_filename, (function(audio_obj) {

        console.log("cb_read_file_done ");

        console.log("received_json.cb_client_to_server_to_client ", received_json.cb_client_to_server_to_client);
        console.log("received_json.cb_client_to_server_to_client ", received_json.cb_client_to_server_to_client);
        console.log("received_json.cb_client_to_server_to_client ", received_json.cb_client_to_server_to_client);
        console.log("received_json.cb_client_to_server_to_client ", received_json.cb_client_to_server_to_client);
        console.log("received_json.cb_client_to_server_to_client ", received_json.cb_client_to_server_to_client);

        streaming_buffer_obj = audio_obj; // save pointer to stream

        streaming_buffer_obj.curr_state = stream_status_populated;
        streaming_buffer_obj.index_stream = 0;
        streaming_buffer_obj.max_index = audio_obj.buffer.length;

        console.log("populated buffer size ", audio_obj.buffer.length);

        shared_utils.show_object(audio_obj,
            "backHome audio_obj 32 bit signed float   read_file_done", "total", 10);

        // curr_ws.send("max_index=" + streaming_buffer_obj.max_index, {binary: false, mask: true}); // send text
        // curr_ws.send("max_index=" + streaming_buffer_obj.max_index, {binary: false, mask: false}); // send text

        send_client_source_data_info(audio_obj, curr_ws);

        // JSON.stringify

        stream_another_chunk_to_client(received_json, given_request, curr_ws);

    }));
};

// ---

var read_file_pop_buffer_stream_back_to_client = function(received_json, given_request, curr_ws) {

    console.log("INDEX ", streaming_buffer_obj.index_stream);

    if (0 == streaming_buffer_obj.index_stream) {

        read_file_pop_buffer(received_json, given_request, curr_ws);

    } else {

        stream_another_chunk_to_client(received_json, given_request, curr_ws);
    }
};      //      read_file_pop_buffer_stream_back_to_client

// ---

var route_msg = function(received_json, received_data, curr_ws) {
// (function route_msg(received_json, received_data, curr_ws) {

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

        case "stream_audio_to_client" : {

            console.log("stream_audio_to_client");
            read_file_pop_buffer_stream_back_to_client(received_json, received_data, curr_ws);
            break;
        }

        case "stream_audio_from_server_to_client" : {

            console.log("ooooooossseee seeing stream_audio_from_server_to_client");

            read_file_pop_buffer_stream_back_to_client(received_json, received_data, curr_ws);

            break;
        }

        case "get_audio_buffer_from_server" : {

            console.log("OOKKK seeing get_audio_buffer_from_server");

            read_file_pop_buffer_send_back_to_client(received_json, received_data, curr_ws);

            break;
        };

        case null : {

            console.log("OOKKK seeing null  requested_action");
            // send_binary_back_to_client(received_json, received_data, curr_ws);

            // curr_ws.send(received_data, {binary: false, mask: true}); // send text
            curr_ws.send(received_data, {binary: false, mask: false}); // send text

            break;
        };

        default : {

            console.log("ERROR - failed to recognize client requested_action : ",
                            requested_action);            
            process.exit(8);
        }
    }
// }(given_received_json, given_received_data, given_curr_ws));      //      route_msg

// exports.route_msg = route_msg;
// exports.server_comms.route_msg = route_msg;


};      //      route_msg
// };      //      server_comms


exports.route_msg = route_msg;
