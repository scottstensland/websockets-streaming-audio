var server_streaming_audio = function () {

    "use strict";

    var fs   = require('fs');
    var path = require('path');

    // ---

    var shared_utils = require("shared-utils");

    // --------------------------------------------------------  //

    var curr_stream_session;    //  each streaming file process gets a fresh such closure

    var request_status;

    // -------------------------------------------------------- //

    var BUFFER_SIZE_STREAMING; // size of buffer sent from server to client per callback cycle

    // var temp_stream_chunk_obj = {};
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

    // var flag_active = true;

    // ---

    var media_dir;
    var set_media_dir = function(given_media_dir) {

        media_dir = given_media_dir;
    };
    exports.set_media_dir = set_media_dir;

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

        // curr_stream_session.tear_down_stream();
        curr_stream_session = null;

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

            // console.log("curr_property ", curr_property, audio_obj[curr_property]);

            all_property_tags[curr_property] = audio_obj[curr_property];
        }

        // console.log("SEND -------- json all property tags --------");
        // console.log("SEND -------- all_property_tags ", all_property_tags);
        // console.log("SEND -------- json all property tags --------");

        curr_websocket.send(JSON.stringify(all_property_tags), {binary: false, mask: false});
    }

    // ---

    // ---

    var stop_streaming = function(received_json, curr_ws) {

        streaming_is_done(0, curr_ws);
    }

    // ---

    function stream_file_into_socket (received_json, curr_ws) {

        // var instance;
        // var flag_now_reading_headers = true;
        var read_stream;

        var curr_index = 0;

        var temp_stream_chunk_obj = {};

        console.log("stream_file_into_socket ");
        console.log("stream_file_into_socket ");
        console.log("stream_file_into_socket ");

        var flag_active = true;

        var do_stream = function(header_obj, requested_input_filename, received_json, curr_ws) {

            console.log("about to stream ... requested_input_filename ", requested_input_filename);

            var total_media_size;
            var num_read_send_gulps = 0;
            var num_bytes_sent = 0;

            // ---

            fs.stat(requested_input_filename, function(error, stat) {

                if (error) { throw error; }

                // console.log("stat.size ", stat.size);
                // console.log("stat.size minus header ", (stat.size - header_chunk_size));

                total_media_size = (stat.size - header_chunk_size) / 2;
                // console.log("total_media_size ", total_media_size);

                var media_info = {
                    max_index : total_media_size
                };

                // console.log("media_info ", media_info);

                // console.log("SEND -------- json max_index --------");
                // console.log("SEND -------- json max_index -------- ", media_info);
                // console.log("SEND -------- json max_index --------");

                curr_ws.send(JSON.stringify(media_info));

                // ---

                if (typeof received_json.limit_buffer_size !== "undefined") {

                    limit_buffer_size = received_json.limit_buffer_size;

                } else {

                    limit_buffer_size = 0; // limited only by source media 
                }

                BUFFER_SIZE_STREAMING = received_json.transmit_chunksize;

                temp_stream_chunk_obj.buffer = new Float32Array(BUFFER_SIZE_STREAMING);

                // ---

                read_stream = fs.createReadStream(requested_input_filename, {'flags': 'r',
                                              'mode': '0666', 
                                              'bufferSize': BUFFER_SIZE_STREAMING, // bufferSize is a hint, not an imperative
                                                                                   // It's up to the operating 
                                                                                   // system to honor it. 
                                              start : header_chunk_size
                                          });
                // ---

                var read_from_stream = function(socket_conn) {

                    // console.log("\n         ***************** TOP read_from_stream flag_active ", flag_active);
                    // console.log("         ***************** TOP read_from_stream flag_active ", flag_active);
                    // console.log("         ***************** TOP read_from_stream flag_active ", flag_active);

                    var curr_buffer = new Buffer(BUFFER_SIZE_STREAMING);

                    // console.log("received_json.transmit_chunksize ", received_json.transmit_chunksize);
                    // console.log("BUFFER_SIZE_STREAMING ", BUFFER_SIZE_STREAMING);
                    // console.log("curr_buffer.length ", curr_buffer.length);

                    while (curr_buffer = read_stream.read()) {

                        // console.log('Read from the filesize :', curr_buffer.length);
                        // console.log('Read from the file:', curr_buffer);

                        var fresh_data_buffer = shared_utils.convert_16_bit_signed_int_to_32_bit_float(curr_buffer);

                        // console.log("fresh_data_buffer length ", fresh_data_buffer.length);

                        temp_stream_chunk_obj.buffer.set(fresh_data_buffer);

                        if (fresh_data_buffer.length < temp_stream_chunk_obj.buffer.length) {

                            // console.log("about to zero pad buffer since source only partially fills");

                            var pad_index = fresh_data_buffer.length;
                            var pad_max = temp_stream_chunk_obj.buffer.length;
                            for (; pad_index < pad_max; pad_index += 1) {

                                temp_stream_chunk_obj.buffer[pad_index];
                            }
                        }

                        // shared_utils.show_object(temp_stream_chunk_obj, "temp_stream_chunk_obj convert_16_bit_signed", "total", 10);


                        // for (; index < 5; index++) {

                        //     console.log(index, ' SSSSSSSSS temp_stream_chunk_obj ', temp_stream_chunk_obj[index]);
                        // };


                        curr_index += curr_buffer.length;
                    }

                    // console.log("temp_stream_chunk_obj length ", temp_stream_chunk_obj.buffer.length);

                    // console.log("pause  ");
                    // console.log("pause  ");
                    // console.log("pause  ");

                    num_read_send_gulps += 1;
                    num_bytes_sent += temp_stream_chunk_obj.buffer.length;

                    // console.log("        flag_active ", flag_active);
                    // console.log("num_read_send_gulps ", num_read_send_gulps);

                    console.log("     num_bytes_sent ", num_bytes_sent, 
                                " out of ", total_media_size, 
                                "   ", (100 * num_bytes_sent / total_media_size).toFixed(2), 
                                " % sent ----------");

                    // console.log("SEND -------- bin read_from_stream -------- length ", temp_stream_chunk_obj.buffer.length);
                    // shared_utils.show_object(temp_stream_chunk_obj, "temp_stream_chunk_obj", "total", 10);
                    // console.log("SEND -------- bin read_from_stream --------");

                    socket_conn.send(temp_stream_chunk_obj.buffer, {binary: true, mask: false}); // binary buffer

                    flag_active = false;

                    // console.log("Corinde ... setting flag_active to ", flag_active);
                    // console.log("Corinde ... setting flag_active to ", flag_active);
                    // console.log("Corinde ... setting flag_active to ", flag_active);

                    read_stream.pause();

                }; // read_from_stream

                // ---

                read_stream.on('readable', function() {

                    // console.log("flag_active  ", flag_active);

                    if (flag_active) {

                        // console.log("LLLLLLLLLLLLL seeing readable");
                        // console.log("LLLLLLLLLLLLL seeing readable");
                        // console.log("LLLLLLLLLLLLL seeing readable");

                        read_from_stream(curr_ws);
                    }
                });

                // read_stream.once('end', function() {
                read_stream.on('end', function() {

                    // console.log('stream ended');
                    // console.log('stream ended');
                    // console.log('stream ended');

                    streaming_is_done(total_media_size, curr_ws);

                  // return;
                });
            }); 
        };      //      do_stream

        var init_stream = function(media_dir, received_json, curr_ws) {

            streaming_buffer_obj = {

                curr_state : stream_status_prior,
                index_stream : 0
            };

            // ---

            // console.log("TOP init_stream __dirname ", __dirname);
            // console.log("TOP init_stream media_dir ", media_dir);
            // console.log("TOP init_stream received_json.requested_source ", received_json.requested_source);

            var requested_input_filename = path.join(__dirname, media_dir, received_json.requested_source);

            // console.log("requested_input_filename ", requested_input_filename);

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

        // console.log("request_status === request_new ... so call init_fresh_request");
        // console.log("request_status === request_new ... so call init_fresh_request");
        // console.log("request_status === request_new ... so call init_fresh_request");

        init_stream(media_dir, received_json, curr_ws);

        // ---

        var roll_it = function(received_json, curr_ws) {

            // console.log("request_ongoing ... about to transition from possible pause to resume");
            // console.log("request_ongoing ... about to transition from possible pause to resume");
            // console.log("request_ongoing ... about to transition from possible pause to resume");

            // 

            flag_active = true;

            // console.log("Weirs ... setting flag_active to ", flag_active);
            // console.log("Weirs ... setting flag_active to ", flag_active);
            // console.log("Weirs ... setting flag_active to ", flag_active);

            read_stream.resume();
        };

        return {

            // assure ONLY one instance exists and is returned on all calls

            roll_it: roll_it

            // ---

        };
    };       //      stream_file_into_socket

    // }());       //      stream_file_into_socket


    // ---

    var read_file_pop_buffer_stream_back_to_client_async = function(received_json, curr_ws, request_status) {

        // console.log("received_json ", received_json);

        if (request_status === request_new) {

            // console.log("read_file_pop_buffer_stream_back_to_client_async NEW");
            // console.log("read_file_pop_buffer_stream_back_to_client_async NEW");
            // console.log("read_file_pop_buffer_stream_back_to_client_async NEW");

            curr_stream_session = null;

            curr_stream_session = stream_file_into_socket(received_json, curr_ws);

            // console.log("curr_stream_session ", curr_stream_session);

        } else {

            curr_stream_session.roll_it(received_json, curr_ws);
        }
    };      //      read_file_pop_buffer_stream_back_to_client_async

    // ---

    var route_msg = function(received_json, curr_ws) {

        // console.log("AAAAAAAAAAAAAAAAAAAAA  route_msg  received_json ", received_json);

        var requested_action = received_json.requested_action;

        if (typeof requested_action == "undefined") {

            console.error("ERROR - failed to see property : requested_action in client JSON msg");
            process.exit(8);
        };

        // ---

        var putative_request_number = received_json.request_number; // request_number

        // console.log("               request_number    ", request_number);
        // console.log(" received_json.request_number    ", received_json.request_number);

        if (received_json.request_number === request_number) {

            // console.log("OK seeing same request_number    ", request_number);

            request_status = request_ongoing;

        } else {

            // console.log("OK seeing new request_number ", putative_request_number);

            request_number = putative_request_number;
            request_status = request_new;

            // console.log("new          request_number  ", request_number);
        }

        // ---

        console.log("requested_action ", requested_action);

        switch (requested_action) {

            case "stream_audio_to_client" : {

                // console.log("RECEIVED ---------- stream_audio_to_client request_status ", request_status);
                // console.log("RECEIVED ---------- stream_audio_to_client request_status ", request_status);
                // console.log("RECEIVED ---------- stream_audio_to_client request_status ", request_status);

                if (request_status === request_ongoing) {

                    if (request_number === previous_request_number) {

                        // console.log("cool we have already stopped this stream request so ignoring stream request");

                        break;   
                    }
                }

                read_file_pop_buffer_stream_back_to_client_async(received_json, curr_ws, request_status);

                break;
            }

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
            }

            default : {

                console.log("ERROR - failed to recognize client requested_action : ",
                                requested_action);            
                process.exit(8);
            }
        }
    };      //      route_msg
    exports.route_msg = route_msg;

}(); //  server_streaming_audio = function()


