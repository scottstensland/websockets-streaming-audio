

var server_streaming_audio = (function () {

"use strict";

var fs   = require('fs');
var path = require('path');

// ---

var shared_utils = require("shared-utils");

// --------------------------------------------------------  //

var request_status;

// -------------------------------------------------------- //

// var BUFFER_SIZE_STREAMING; // size of buffer sent from server to client per callback cycle

// var temp_stream_chunk_obj = {};
// var limit_buffer_size;

var stream_status_prior = "prior";
var stream_status_populated = "populated";
var stream_status_complete = "complete";

var streaming_buffer_obj = {

    curr_state : stream_status_prior,
    index_stream : 0
};

var request_number = 0;
var previous_request_number = 0;

var request_new = "request_new";
var request_ongoing = "request_ongoing";
var header_chunk_size = 44;

// var flag_active = true;

// ---

var media_dir = null;
var set_media_dir = function(given_media_dir) {

    media_dir = given_media_dir;
};
exports.set_media_dir = set_media_dir;

// ---

var media_path = null;
var set_media_path = function(given_media_path) {

    media_path = given_media_path;
};
exports.set_media_path = set_media_path;


// ---

var streaming_is_done = function (given_max_index, curr_ws) {

    console.log("TOOOP streaming_is_done  ... given_max_index ", given_max_index);
    console.log("TOOOP streaming_is_done  ... given_max_index ", given_max_index);
    console.log("TOOOP streaming_is_done  ... given_max_index ", given_max_index);

    var streaming_is_done_msg = {

        streaming_is_done : "yes",
        max_index : given_max_index
    };

    console.log("SEND -------- json DONE --------");
    console.log("SEND ---------- streaming_is_done_msg ", streaming_is_done_msg);
    console.log("SEND -------- json DONE --------");

    curr_ws.send(JSON.stringify(streaming_is_done_msg), {binary: false, mask: false});  //  json message

    // --- reset state in prep for followon request

    // curr_stream_session = null;

    file_manager.close();

    // bbbbbbbbbbbbbbb

    previous_request_number = request_number;
};

// ---

var send_client_source_data_info = function (audio_obj, curr_websocket) {

    var curr_property;
    var all_property_tags = {};

    for (curr_property in audio_obj) {

        if (curr_property === "buffer") {

            continue;
        }

        all_property_tags[curr_property] = audio_obj[curr_property];
    }

    // console.log("SEND -------- json all property tags --------");
    // console.log("SEND -------- all_property_tags ", all_property_tags);
    // console.log("SEND -------- json all property tags --------");

    curr_websocket.send(JSON.stringify(all_property_tags), {binary: false, mask: false});
};

// ---

var stop_streaming = function(received_json, curr_ws) {

    streaming_is_done(0, curr_ws);
};

// ---

function stream_file_into_socket (received_json, curr_ws) {

    var read_stream;

    var curr_index = 0;

    var temp_stream_chunk_obj = {};

    // console.log("stream_file_into_socket ");

    var flag_active = true;

    var do_stream = function(header_obj, requested_input_filename, received_json, curr_ws) {

        console.log("about to stream ... requested_input_filename ", requested_input_filename);

        var total_media_size;
        var num_read_send_gulps = 0;
        var num_bytes_sent = 0;

        // ---

        fs.stat(requested_input_filename, function(error, stat) {

            if (error) { throw error; }

            total_media_size = (stat.size - header_chunk_size) / 2;

            var media_info = {
                max_index : total_media_size
            };

            // console.log("media_info ", media_info);

            // console.log("SEND -------- json max_index --------");
            // console.log("SEND -------- json max_index -------- ", media_info);
            // console.log("SEND -------- json max_index --------");

            curr_ws.send(JSON.stringify(media_info));

            // ---

            var BUFFER_SIZE_STREAMING = received_json.transmit_chunksize;

            temp_stream_chunk_obj.buffer = new Float32Array(BUFFER_SIZE_STREAMING);

            // ---

            read_stream = fs.createReadStream(requested_input_filename, 
                                {'flags': 'r',
                                 'mode': '0666', 
                                 'bufferSize': BUFFER_SIZE_STREAMING, // bufferSize is a hint
                                                                      // not an imperative
                                                                      // It's up to the operating 
                                                                      // system to honor it
                                  start : header_chunk_size });
            // ---

            var read_from_stream = function(socket_conn) {

                var curr_buffer = new Buffer(BUFFER_SIZE_STREAMING);

                while ((curr_buffer = read_stream.read())) {

                    var fresh_data_buffer = shared_utils.convert_16_bit_signed_int_to_32_bit_float(curr_buffer);

                    temp_stream_chunk_obj.buffer.set(fresh_data_buffer);

                    if (fresh_data_buffer.length < temp_stream_chunk_obj.buffer.length) {

                        // console.log("about to zero pad buffer since source only partially fills");

                        var pad_index = fresh_data_buffer.length;
                        var pad_max = temp_stream_chunk_obj.buffer.length;
                        for (; pad_index < pad_max; pad_index += 1) {

                            temp_stream_chunk_obj.buffer[pad_index] = 0;
                        }
                    }

                    curr_index += curr_buffer.length;
                }

                // ---

                // for (var index = 0; index < 4; index += 1) {

                //     console.log(temp_stream_chunk_obj.buffer[index]);
                // }

                // ---

                num_read_send_gulps += 1;
                num_bytes_sent += temp_stream_chunk_obj.buffer.length;

                console.log("", (100 * num_bytes_sent / total_media_size).toFixed(2), 
                            " % sent      num_bytes_sent ", num_bytes_sent, 
                            " out of ", total_media_size, " ----------" );

                // console.log("SEND -------- bin read_from_stream -------- length ", temp_stream_chunk_obj.buffer.length);
                // shared_utils.show_object(temp_stream_chunk_obj, "temp_stream_chunk_obj", "total", 10);
                // console.log("SEND -------- bin read_from_stream --------");

                // stens TODO 20150115
                socket_conn.send(temp_stream_chunk_obj.buffer, {binary: true, mask: false}); // binary buffer

                // below error happens if we use below parms to send
                // WebSocket connection to 'ws://localhost:8888/' failed: A server must not mask any frames that it sends to the client
                // socket_conn.send(temp_stream_chunk_obj.buffer, {binary: true, mask: true}); // binary buffer

                flag_active = false;

                read_stream.pause();

            }; // read_from_stream

            // ---

            read_stream.on('readable', function() {

                if (flag_active) {

                    read_from_stream(curr_ws);
                }
            });

            read_stream.on('end', function() {

                streaming_is_done(total_media_size, curr_ws);

              // return;
            });
        }); 
    };      //      do_stream

    // var init_stream = function(media_dir, received_json, curr_ws, media_filename) {

    var init_stream = function(media_dir, media_path, received_json, curr_ws, media_filename) {

        // stens TODO - search for given media filename across both media_dir as well as
        //              media_path  ... look at ../config/config.global.js
        //              in particular both 
        //     config.media_path_relative = "../media";
        //     config.media_path_absolute = "/home/stens/Dropbox/Documents/data/audio";

        streaming_buffer_obj = {

            curr_state : stream_status_prior,
            index_stream : 0
        };

        // ---

        var requested_input_filename = path.join(__dirname, media_dir, media_filename);

        // console.log("requested_input_filename " + requested_input_filename);

        if (! fs.existsSync(requested_input_filename)) {

            var error_msg = {

                error_msg : "ERROR - requested file does not exist",
                media_filename : media_filename

            };

            console.log("SEND -------- json ERROR --------");
            console.log(error_msg);
            curr_ws.send(JSON.stringify(error_msg), {binary: false, mask: false});
            console.log("SEND -------- json ERROR --------");

            return;
        }

        // ------------- now parse headers ------------- //

        var wav_input_file_obj = {};

        shared_utils.parse_wav_header(wav_input_file_obj, requested_input_filename, function(error, header_obj) {

            if (error) {

                console.error(error);
                return;

            } else {

                shared_utils.show_object(header_obj, "file headers", "total", 3);

                send_client_source_data_info(header_obj, curr_ws);

                do_stream(header_obj, requested_input_filename, received_json, curr_ws);
            }
        });
    };        //      init_stream

    // ---

    var roll_it = function(received_json, curr_ws) {

        flag_active = true;

        read_stream.resume();
    };

    return {

        // assure ONLY one instance exists and is returned on all calls

        roll_it: roll_it,
        init_stream : init_stream
    };
}       //      stream_file_into_socket

// ---

var file_manager = (function() {

    var curr_stream_session = null;    //  each streaming file process gets a fresh such closure
    var media_filename = null;

    return {

        read_file_pop_buffer_stream_back_to_client_async : function(received_json, curr_ws, request_status) {

            if (request_status === request_new) {

                curr_stream_session = null;

                curr_stream_session = stream_file_into_socket(received_json, curr_ws);

                // curr_stream_session.init_stream(media_dir, received_json, curr_ws, media_filename);

                curr_stream_session.init_stream(media_dir, media_path, received_json, curr_ws, media_filename);

            } else {

                if (curr_stream_session) {

                    curr_stream_session.roll_it(received_json, curr_ws);
                }
            }
        },
        set_media_filename : function(given_media_filename) {

            media_filename = given_media_filename;
        },
        get_media_filename : function() {

            return media_filename;
        },
        close : function() {

            curr_stream_session = null; // stens TODO do proper fs close or such
        }
    };
}());

// ---

var route_msg = function(received_json, curr_ws) {

    // shared_utils.show_object(received_json, "SSSSSSS received_json  ", "total", 3);


    // console.log("received_json");
    // console.log(received_json);



    var requested_action = received_json.requested_action;

    if (typeof requested_action == "undefined") {

        console.error("ERROR - failed to see property : requested_action in client JSON msg");
        // process.exit(8);
    }

    // ---

    // var putative_request_number = received_json.request_number; // request_number

    if (received_json.request_number === request_number) {

        request_status = request_ongoing;

    } else {

        request_number = received_json.request_number;
        request_status = request_new;

        var media_filename = received_json.requested_source;

        if (typeof media_filename !== "undefined") {

            file_manager.set_media_filename(media_filename);

        } else {

            throw new Error("ERROR - failed to supply requested_source");
        }
    }

    // ---

    // bbbbbbbbbbbbb

    switch (requested_action) {

        case "stream_audio_to_client" : {

            // console.log("RECEIVED ---------- stream_audio_to_client request_status ", request_status);
            // console.log("RECEIVED ---------- stream_audio_to_client request_status ", request_status);
            // console.log("RECEIVED ---------- stream_audio_to_client request_status ", request_status);

            if (request_status === request_ongoing) {

                if (request_number === previous_request_number) {


                    // console.log("request_status  " + request_status);
                    // console.log("request_ongoing " + request_ongoing);
                    // console.log("request_number             " + request_number);
                    // console.log("previous_request_number    " + previous_request_number);


                    console.log("cool we have already stopped this stream request so ignoring stream request");

                    break;   
                }
            }

            // random_delay simulates a poor internet connection between server side and browser
            // TROUBLESHOOTING ONLY make 0 otherwise
            // TROUBLESHOOTING ONLY make 0 otherwise
            // TROUBLESHOOTING ONLY make 0 otherwise
            // var random_delay = ~~(1200 * Math.random()); // TROUBLESHOOTING ONLY make 0 otherwise
            // var random_delay = ~~(800 * Math.random()); // TROUBLESHOOTING ONLY make 0 otherwise
            var random_delay = 0; // use this in prod
            // TROUBLESHOOTING ONLY make 0 otherwise
            // TROUBLESHOOTING ONLY make 0 otherwise
            // TROUBLESHOOTING ONLY make 0 otherwise

            // console.log("random_delay " + random_delay);

            setTimeout(function() {

                file_manager.read_file_pop_buffer_stream_back_to_client_async(
                                                        received_json, curr_ws, request_status);

            }, random_delay);

            break;
        }

        case "stop_streaming" : {

            // if (request_status === request_ongoing &&
            //     streaming_buffer_obj.curr_state === stream_status_prior) {

            //     console.log("request_status  " + request_status);
            //     console.log("request_ongoing " + request_ongoing);
            //     console.log("streaming_buffer_obj.curr_state " + streaming_buffer_obj.curr_state);
            //     console.log("stream_status_prior             " + stream_status_prior);

            //     console.log("cool we have already stopped this stream request so ignoring stop request");

            // } else {

                console.log("RECEIVED ---------- stop_streaming");
                console.log("RECEIVED ---------- stop_streaming");
                console.log("RECEIVED ---------- stop_streaming");

                stop_streaming(received_json, curr_ws);
            // }

            break;
        }

        default : {

            console.error("ERROR - failed to recognize client requested_action : ",
                            requested_action);            
            // process.exit(8);

            break;
        }
    }
};      //      route_msg
exports.route_msg = route_msg;

}()); //  server_streaming_audio = function()


