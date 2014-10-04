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


// var temp_stream_chunk_obj = new Float32Array(BUFFER_SIZE_STREAMING);
var temp_stream_chunk_obj = {};
var limit_buffer_size;

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

var flag_active = true;

// ---

var media_dir;
var set_media_dir = function(given_media_dir) {

    media_dir = given_media_dir;
};
exports.set_media_dir = set_media_dir;

// ---

var init_fresh_request = function() {

    // streaming_buffer_obj.curr_state = stream_status_complete;
    streaming_buffer_obj.curr_state = stream_status_prior; // prepare for next request to stream

    // ---

    // temp_stream_chunk_obj = null;
    temp_stream_chunk_obj = null;
    temp_stream_chunk_obj = {};

    streaming_buffer_obj = null;

    streaming_buffer_obj = {

        curr_state : stream_status_prior,
        index_stream : 0
    };
};

var streaming_is_done = function(given_max_index, curr_ws) {

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

    stream_file_into_socket.tear_down();

    console.log("Utrecht ... setting flag_active to ", flag_active);
    console.log("Utrecht ... setting flag_active to ", flag_active);
    console.log("Utrecht ... setting flag_active to ", flag_active);

    flag_active = true;

    init_fresh_request();

    previous_request_number = request_number;
}

var stream_another_chunk_to_client = function(received_json, curr_ws) {

    console.log("TOP stream_another_chunk_to_client");
    console.log("TOP stream_another_chunk_to_client");
    console.log("TOP stream_another_chunk_to_client");

    var curr_index = streaming_buffer_obj.index_stream;
    var max_index  = streaming_buffer_obj.max_index;

    console.log("PREEEEE ", curr_index + " out of " + max_index);

    // ---

    // if (curr_index == max_index) {

    //     streaming_is_done(max_index, curr_ws);
    //     return;
    // };

    // ---

    for (var local_index = 0; local_index < BUFFER_SIZE_STREAMING && curr_index < max_index;) {

        temp_stream_chunk_obj.buffer[local_index] = streaming_buffer_obj.buffer[curr_index];
        local_index++;
        curr_index++;
    };

    console.log("POOOOOOST ", curr_index + " out of " + max_index);

    console.log("SEND -------- binary audio buffer --------");
    console.log("SEND ------------ binary temp_stream_chunk_obj to client    curr_index ", 
                curr_index);
    console.log("SEND -------- binary audio buffer --------");

    curr_ws.send(temp_stream_chunk_obj.buffer, {binary: true, mask: false}); // binary buffer

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

        // console.log("curr_property ", curr_property, audio_obj[curr_property]);

        all_property_tags[curr_property] = audio_obj[curr_property];
    }

    console.log("SEND -------- json all property tags --------");
    console.log("SEND -------- all_property_tags ", all_property_tags);
    console.log("SEND -------- json all property tags --------");

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

var read_file_pop_buffer_stream_back_to_client_synchronous = function(received_json, curr_ws) {

    // stens TODO put into a closure

    console.log("INDEX index_stream", streaming_buffer_obj.index_stream);

    if (0 == streaming_buffer_obj.index_stream) {

        if (typeof received_json.limit_buffer_size !== "undefined") {

            limit_buffer_size = received_json.limit_buffer_size;

        } else {

            limit_buffer_size = 0; // limited only by source media 
        }

        BUFFER_SIZE_STREAMING = received_json.transmit_chunksize;

        // temp_stream_chunk_obj = new Float32Array(BUFFER_SIZE_STREAMING);

        read_file_pop_buffer(received_json, curr_ws, limit_buffer_size);

    } else {

        stream_another_chunk_to_client(received_json, curr_ws);
    }
};      //      read_file_pop_buffer_stream_back_to_client_synchronous

// ---

var stream_file_into_socket = (function () {

    // Instance stores a reference to the Singleton
    var instance;
    // var flag_now_reading_headers = true;
    var read_stream;

    var curr_index = 0;


    console.log("stream_file_into_socket ");
    console.log("stream_file_into_socket ");
    console.log("stream_file_into_socket ");

    flag_active = true;

    var do_stream = function(header_obj, requested_input_filename, received_json, curr_ws) {

        console.log("about to stream ... requested_input_filename ", requested_input_filename);

        var total_media_size;
        var num_read_send_gulps = 0;
        var num_bytes_sent = 0;

        // ---

        fs.stat(requested_input_filename, function(error, stat) {

            if (error) { throw error; }

            // curr_ws.send('something');

            // curr_ws.send(JSON.stringify({
            //     'Content-Type' : 'image/gif',
            //     'Content-Length' : stat.size
            // }));

            console.log("stat.size ", stat.size);
            console.log("stat.size minus header ", (stat.size - header_chunk_size));

            total_media_size = (stat.size - header_chunk_size) / 2;
            console.log("total_media_size ", total_media_size);


            var media_info = {
                // 'media_filename' : requested_input_filename,
                max_index : total_media_size
            };

            console.log("media_info ", media_info);

            // total_media_size = media_info.max_index;

            console.log("SEND -------- json max_index --------");
            console.log("SEND -------- json max_index -------- ", media_info);
            console.log("SEND -------- json max_index --------");

            curr_ws.send(JSON.stringify(media_info));

            // var rs = fs.createReadStream(requested_input_filename);

            // ---

            if (typeof received_json.limit_buffer_size !== "undefined") {

                limit_buffer_size = received_json.limit_buffer_size;

            } else {

                limit_buffer_size = 0; // limited only by source media 
            }

            BUFFER_SIZE_STREAMING = received_json.transmit_chunksize;

            // temp_stream_chunk_obj = new Float32Array(BUFFER_SIZE_STREAMING);
            temp_stream_chunk_obj.buffer = new Float32Array(BUFFER_SIZE_STREAMING);

            // ---

            read_stream = fs.createReadStream(requested_input_filename, {'flags': 'r',
                                          'mode': 0666, 
                                          // 'bufferSize': chunk_size});
                                          'bufferSize': BUFFER_SIZE_STREAMING, // bufferSize is a hint, not an imperative
                                                                               // It's up to the operating 
                                                                               // system to honor it. 
                                          start : header_chunk_size
                                      });
            // ---

            var read_from_stream = function(socket_conn) {

                console.log("\n         ***************** TOP read_from_stream flag_active ", flag_active);
                console.log("         ***************** TOP read_from_stream flag_active ", flag_active);
                console.log("         ***************** TOP read_from_stream flag_active ", flag_active);

                var curr_buffer = new Buffer(BUFFER_SIZE_STREAMING);

                console.log("received_json.transmit_chunksize ", received_json.transmit_chunksize);
                console.log("BUFFER_SIZE_STREAMING ", BUFFER_SIZE_STREAMING);
                console.log("curr_buffer.length ", curr_buffer.length);

                // while (temp_stream_chunk_obj = read_stream.read()) {

                //     console.log('Read from the filesize :', temp_stream_chunk_obj.length);
                //     console.log('Read from the file:', temp_stream_chunk_obj);

                //     curr_index += temp_stream_chunk_obj.length;
                // }

                // var index = 0;

                while (curr_buffer = read_stream.read()) {

                    console.log('Read from the filesize :', curr_buffer.length);
                    console.log('Read from the file:', curr_buffer);

                    // temp_stream_chunk_obj = new Float32Array(curr_buffer);
                    // temp_stream_chunk_obj = new Buffer(curr_buffer);

                    // audio_obj.buffer = shared_utils.convert_16_bit_signed_int_to_32_bit_float(audio_obj[property_buffer_input_file]);


                    // var fresh_data_buffer = shared_utils.convert_16_bit_signed_int_to_32_bit_float(curr_buffer);
                    // temp_stream_chunk_obj.buffer = fresh_data_buffer;

                    var fresh_data_buffer = shared_utils.convert_16_bit_signed_int_to_32_bit_float(curr_buffer);

                    console.log("fresh_data_buffer length ", fresh_data_buffer.length);

                    // temp_stream_chunk_obj.buffer = fresh_data_buffer;
                    temp_stream_chunk_obj.buffer.set(fresh_data_buffer);

                    // bbb

                    // shared_utils.show_object(temp_stream_chunk_obj, "temp_stream_chunk_obj convert_16_bit_signed", "total", 10);


                    // for (; index < 5; index++) {

                    //     console.log(index, ' SSSSSSSSS temp_stream_chunk_obj ', temp_stream_chunk_obj[index]);
                    // };


                    curr_index += curr_buffer.length;
                }

                console.log("temp_stream_chunk_obj length ", temp_stream_chunk_obj.buffer.length);

                console.log("pause  ");
                console.log("pause  ");
                console.log("pause  ");

                num_read_send_gulps += 1;
                num_bytes_sent += temp_stream_chunk_obj.buffer.length;

                console.log("        flag_active ", flag_active);
                console.log("num_read_send_gulps ", num_read_send_gulps);

                console.log("     num_bytes_sent ", num_bytes_sent, 
                            " out of ", total_media_size, 
                            "   ", (100 * num_bytes_sent / total_media_size).toFixed(2), 
                            " % sent ------------------------------------------------------");

                console.log("SEND -------- bin read_from_stream -------- length ", temp_stream_chunk_obj.buffer.length);
                shared_utils.show_object(temp_stream_chunk_obj, "temp_stream_chunk_obj", "total", 10);
                console.log("SEND -------- bin read_from_stream --------");

                socket_conn.send(temp_stream_chunk_obj.buffer, {binary: true, mask: false}); // binary buffer

                flag_active = false;

                console.log("Corinde ... setting flag_active to ", flag_active);
                console.log("Corinde ... setting flag_active to ", flag_active);
                console.log("Corinde ... setting flag_active to ", flag_active);

                read_stream.pause();

            }; // read_from_stream

            // ---

            read_stream.on('readable', function() {

                console.log("flag_active  ", flag_active);

                if (flag_active) {

                    console.log("LLLLLLLLLLLLL seeing readable");
                    console.log("LLLLLLLLLLLLL seeing readable");
                    console.log("LLLLLLLLLLLLL seeing readable");

                    read_from_stream(curr_ws);
                }
            });

            // read_stream.once('end', function() {
            read_stream.on('end', function() {

                console.log('stream ended');
                console.log('stream ended');
                console.log('stream ended');
                console.log('stream ended');
                console.log('stream ended');
                console.log('stream ended');
                console.log('stream ended');
                console.log('stream ended');
                console.log('stream ended');
                console.log('stream ended');
                console.log('stream ended');

                // streaming_is_done(curr_index, curr_ws);
                streaming_is_done(total_media_size, curr_ws);

              // return;
            });
        }); 
    };      //      do_stream

    function init_stream(media_dir, received_json, curr_ws) {

        console.log("TOP init_stream __dirname ", __dirname);
        console.log("TOP init_stream media_dir ", media_dir);
        console.log("TOP init_stream received_json.requested_source ", received_json.requested_source);


        // Singleton

        // Private methods and variables
        function privateMethod(){
            console.log( "I am private" );
        }

        var privateVariable = "Im also private";

        // ---


        // var chunk_size = 64 * 1024;
        // var header_chunk_size = 44;

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

        // ------------- now parse headers ------------- //

        var wav_input_file_obj = {};

        shared_utils.parse_wav_header(wav_input_file_obj, requested_input_filename, function(error, header_obj) {

            // console.log("TOOOOOOOOOOOP  show_headers");

            if (error) {
                console.error(error);
                return;

            } else {

                // console.log("aaaaaaaaaaabout to call show_object");

                shared_utils.show_object(header_obj, "file headers", "total", 3);


                send_client_source_data_info(header_obj, curr_ws);

                do_stream(header_obj, requested_input_filename, received_json, curr_ws);
            }
        });

        // ---

        return {

          // Public methods and variables
          publicMethod: function () {
            console.log( "The public can see me!" );
          },

          publicProperty: "I am also public"
        };
    };        //      init_stream

    return {

        // assure ONLY one instance exists and is returned on all calls

        roll_it: function(media_dir, received_json, curr_ws) {

            if ( !instance ) {

                // instance = init();

                instance = {};
                // instance.setup_roll = init(media_dir, received_json, curr_ws);
                init_stream(media_dir, received_json, curr_ws);

            } else {

                console.log("request_ongoing ... about to transition from possible pause to resume")
                console.log("request_ongoing ... about to transition from possible pause to resume")
                console.log("request_ongoing ... about to transition from possible pause to resume")

                // 

                flag_active = true;

                console.log("Weirs ... setting flag_active to ", flag_active);
                console.log("Weirs ... setting flag_active to ", flag_active);
                console.log("Weirs ... setting flag_active to ", flag_active);


                read_stream.resume();
            }

            // return instance;
        },

        // ---

        tear_down : function() {

            console.log("tear_down ");
            console.log("tear_down ");
            console.log("tear_down ");

            instance = null;
        }
    };

})();       //      stream_file_into_socket

// ---

var read_file_pop_buffer_stream_back_to_client_async = function(received_json, curr_ws) {

    console.log("received_json ", received_json);

    stream_file_into_socket.roll_it(media_dir, received_json, curr_ws);

};      //      read_file_pop_buffer_stream_back_to_client_async

// ---

var route_msg = function(received_json, curr_ws) {

    console.log("AAAAAAAAAAAAAAAAAAAAA  route_msg  received_json ", received_json);

    var requested_action = received_json.requested_action;

    if (typeof requested_action == "undefined") {

        console.error("ERROR - failed to see property : requested_action in client JSON msg");
        process.exit(8);
    };

    // ---

    var putative_request_number = received_json.request_number; // request_number

    console.log("               request_number    ", request_number);
    console.log(" received_json.request_number    ", received_json.request_number);

    if (received_json.request_number === request_number) {

        console.log("OK seeing same request_number    ", request_number);

        request_status = request_ongoing;

    } else {

        console.log("OK seeing new request_number ", putative_request_number);

        request_number = putative_request_number;
        request_status = request_new;

        console.log("new          request_number  ", request_number);
    }

    // ---

    console.log("requested_action ", requested_action);

    switch (requested_action) {

        case "stream_audio_to_client" : {

            console.log("RECEIVED ---------- stream_audio_to_client request_status ", request_status);
            console.log("RECEIVED ---------- stream_audio_to_client request_status ", request_status);
            console.log("RECEIVED ---------- stream_audio_to_client request_status ", request_status);

            if (request_status === request_ongoing) {

                if (request_number === previous_request_number) {

                    console.log("cool we have already stopped this stream request so ignoring stream request");

                    break;   
                };

            } else {

                console.log("request_status === request_new ... so call init_fresh_request");
                console.log("request_status === request_new ... so call init_fresh_request");
                console.log("request_status === request_new ... so call init_fresh_request");

                init_fresh_request();
            };

            // read_file_pop_buffer_stream_back_to_client_synchronous(received_json, curr_ws);
            read_file_pop_buffer_stream_back_to_client_async(received_json, curr_ws);


            break;
        };

        case "stop_streaming" : {

            if (request_status === request_ongoing &&
                streaming_buffer_obj.curr_state === stream_status_prior) {

                console.log("cool we have already stopped this stream request so ignoring stop request");

            } else {

                console.log("RECEIVED ---------- stop_streaming");
                console.log("RECEIVED ---------- stop_streaming");
                console.log("RECEIVED ---------- stop_streaming");

                stop_streaming(received_json, curr_ws);
            }

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


