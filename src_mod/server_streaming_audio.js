var server_streaming_audio = function() {

var fs   = require('fs');
var path = require('path');

// function resolvePath(str) {
//   if (str.substr(0, 2) === '~/') {
//     str = (process.env.HOME || process.env.HOMEPATH || process.env.HOMEDIR || process.cwd()) + str.substr(1);
//   }
//   return path.resolve(str);
// }

// ---

var shared_utils = require("shared-utils");
// console.log("shared_utils ", shared_utils);

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
// var BUFFER_SIZE_STREAMING = 16384; // size of buffer sent from server to client per callback cycle
// var BUFFER_SIZE_STREAMING = 32768; // size of buffer sent from server to client per callback cycle
// var BUFFER_SIZE_STREAMING = 65536; // size of buffer sent from server to client per callback cycle
// var BUFFER_SIZE_STREAMING = 131072; // size of buffer sent from server to client per callback cycle
// var BUFFER_SIZE_STREAMING = 262144; // size of buffer sent from server to client per callback cycle
var BUFFER_SIZE_STREAMING; // size of buffer sent from server to client per callback cycle


// var temp_stream_chunk_buffer = new Float32Array(BUFFER_SIZE_STREAMING);
var temp_stream_chunk_buffer;
var limit_buffer_size;

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

// ---

var streaming_is_done = function(given_max_index, curr_ws) {

    console.log("TOOOP streaming_is_done");
    console.log("TOOOP streaming_is_done");
    console.log("TOOOP streaming_is_done");

    streaming_buffer_obj.curr_state = stream_status_complete;

    var streaming_is_done_msg = {

        streaming_is_done : "yes",
        max_index : given_max_index
    };

    // bbb
    console.log("SEND -------- json DONE --------");
    console.log("SEND ---------- streaming_is_done_msg ", streaming_is_done_msg);
    console.log("SEND -------- json DONE --------");

    curr_ws.send(JSON.stringify(streaming_is_done_msg), {binary: false, mask: false});  //  json message

    // --- reset state in prep for followon request

    // streaming_buffer_obj = null;

    // streaming_buffer_obj = {

    //     curr_state : stream_status_prior,
    //     index_stream : 0
    // };
}

// var stream_another_chunk_to_client = function(received_json, given_request, curr_ws) {
var stream_another_chunk_to_client = function(received_json, curr_ws) {

    var curr_index = streaming_buffer_obj.index_stream;
    var max_index = streaming_buffer_obj.max_index;

    console.log("PREEEEE ", curr_index + " out of " + max_index);

    // ---

    // if (curr_index == max_index) {

    //     streaming_is_done(max_index, curr_ws);
    //     return;
    // };

    // ---

    for (var local_index = 0; local_index < BUFFER_SIZE_STREAMING && curr_index < max_index;) {

        temp_stream_chunk_buffer[local_index] = streaming_buffer_obj.buffer[curr_index];
        local_index++;
        curr_index++;
    };

    console.log("POOOOOOST ", curr_index + " out of " + max_index);

    console.log("SEND -------- binary audio buffer --------");
    console.log("SEND ------------ binary temp_stream_chunk_buffer to client    curr_index ", 
                curr_index);
    console.log("SEND -------- binary audio buffer --------");

    curr_ws.send(temp_stream_chunk_buffer, {binary: true, mask: false}); // binary buffer

    streaming_buffer_obj.index_stream = curr_index;

    if (curr_index == max_index) {

        streaming_is_done(max_index, curr_ws);
    };
};

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

    console.log("SEND -------- json all property tags --------");
    console.log("SEND -------- all_property_tags ", all_property_tags);
    console.log("SEND -------- json all property tags --------");


// bbb

    curr_websocket.send(JSON.stringify(all_property_tags), {binary: false, mask: false});
}

// ---

var read_file_pop_buffer = function(received_json, curr_ws, limit_buffer_size) {

    console.log("about to parse wav file, pop buffer to send back to client browser");

    console.log("__dirname ", __dirname);
    console.log("media_dir ", media_dir);
    console.log("received_json.requested_source ", received_json.requested_source);

    var requested_input_filename = path.join(__dirname, media_dir, received_json.requested_source);

    console.log("requested_input_filename ", requested_input_filename);

    if (! fs.existsSync(requested_input_filename)) {

        var error_msg = {

            error_msg : "ERROR - requested file does not exist",
            requested_source : received_json.requested_source

        };

        console.log("SEND -------- json ERROR --------");
        console.log(error_msg);
        curr_ws.send(JSON.stringify(error_msg), {binary: false, mask: false});
        console.log("SEND -------- json ERROR --------");

        return;
    };

    shared_utils.read_wav_file(requested_input_filename, (function(audio_obj) {

        console.log("read_wav_file is DONE now do something with this WAV data");
        console.log("read_wav_file is DONE now do something with this WAV data");
        console.log("read_wav_file is DONE now do something with this WAV data");

        streaming_buffer_obj = audio_obj; // save pointer to stream

        streaming_buffer_obj.curr_state = stream_status_populated;
        streaming_buffer_obj.index_stream = 0;
        streaming_buffer_obj.max_index = audio_obj.buffer.length;

        if (limit_buffer_size > 0 && audio_obj.buffer.length > limit_buffer_size) {

            streaming_buffer_obj.max_index = limit_buffer_size;
        }

        // console.log("populated buffer size ", audio_obj.buffer.length);

        // shared_utils.show_object(audio_obj,
        //     "backHome audio_obj 32 bit signed float   read_file_done", "total", 10);

        send_client_source_data_info(audio_obj, curr_ws);

        // JSON.stringify

        stream_another_chunk_to_client(received_json, curr_ws);

    }));
};

// ---

var stop_streaming = function(received_json, curr_ws) {

    streaming_is_done(0, curr_ws);
}

// ---

var read_file_pop_buffer_stream_back_to_client = function(received_json, curr_ws) {

    // stens TODO put into a closure

    console.log("INDEX ", streaming_buffer_obj.index_stream);

    if (0 == streaming_buffer_obj.index_stream) {

        if (typeof received_json.limit_buffer_size !== "undefined") {

            limit_buffer_size = received_json.limit_buffer_size;

        } else {

            limit_buffer_size = 0; // limited only by source media 
        }

        BUFFER_SIZE_STREAMING = received_json.transmit_chunksize;

        temp_stream_chunk_buffer = new Float32Array(BUFFER_SIZE_STREAMING);

        read_file_pop_buffer(received_json, curr_ws, limit_buffer_size);

    } else {

        stream_another_chunk_to_client(received_json, curr_ws);
    }
};      //      read_file_pop_buffer_stream_back_to_client

// ---

var route_msg = function(received_json, curr_ws) {

    console.log("AAAAAAAAAAAAAAAAAAAAA  route_msg  received_json ", received_json);

    // shared_utils.show_object(streaming_buffer_obj, "streaming_buffer_obj", "total", 10);

    var requested_action = received_json.requested_action;

    if (typeof requested_action == "undefined") {

        console.error("ERROR - failed to see property : requested_action in client JSON msg");
        process.exit(8);
    };

    console.log("requested_action ", requested_action);

    switch (requested_action) {

        case "stream_audio_to_client" : {

            console.log("RECEIVED ---------- stream_audio_to_client");
            console.log("RECEIVED ---------- stream_audio_to_client");
            console.log("RECEIVED ---------- stream_audio_to_client");

            read_file_pop_buffer_stream_back_to_client(received_json, curr_ws);
            break;
        };

        case "stop_streaming" : {

            console.log("RECEIVED ---------- stop_streaming");
            console.log("RECEIVED ---------- stop_streaming");
            console.log("RECEIVED ---------- stop_streaming");

            stop_streaming(received_json, curr_ws);
            break;
        };

        default : {

            console.log("ERROR - failed to recognize client requested_action : ",
                            requested_action);            
            process.exit(8);
        }
    }
};      //      route_msg
exports.route_msg = route_msg;

}(); //  server_streaming_audio = function()


