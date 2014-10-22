
var client_web_audio = function () {

"use strict";

var audio_context;
var circular_queue;

var gain_node;
var streaming_node;

var in_middle_of_playback = false;

// var client_memory;

/*

2^7 128
2^8 256
2^9 512
2^10 1024
2^11 2048
2^12 4096
2^13 8192
2^14 16384
2^15 32768
2^16 65536
2^17 131072
2^18 262144
2^19 524288
2^20 1048576
2^21 2097152
2^22 4194304
2^23 8388608
2^24 16777216

*/

// BUFF_SIZE_AUDIO_RENDERER must be in units of sample frames, i.e., one of:
// 256, 512, 1024, 2048, 4096, 8192, or 16384
// var BUFF_SIZE_AUDIO_RENDERER = 2048;
// var BUFF_SIZE_AUDIO_RENDERER = 4096;
// var BUFF_SIZE_AUDIO_RENDERER = 8192;
// var BUFF_SIZE_AUDIO_RENDERER = 16384;    
var BUFF_SIZE_AUDIO_RENDERER;

// var count_num_buffers_received_from_server = 0;

// var audio_obj_from_server = {};


var flag_audio_rendering = false;
// var terminate_current_run = false;

var we_retrieved_last_chunk_from_server = false;

var msgs_to_server = {};

// var timer_Id; // for setIterval clearing once complete

var BUFFER_SIZE_STREAM_QUEUE; // stens TODO - wrap into a circular queue
// var curr_index_stream_buffer = 0;
// var server_side_audio_obj;

// var streaming_audio_obj = {

//     index_stream : 0
// };

// var request_number = 0;

var final_index = 0;  // suppled by server side ... only populated when server senses source media has been exhausted

var streaming_status_ready      = "streaming_status_ready";
// var streaming_status_preloading = "streaming_status_preloading";
var streaming_status_active     = "streaming_status_active";
var streaming_status_done       = "streaming_status_done";


var flag_streaming_status = streaming_status_ready; // when server side signals stream is done this becomes false

var count_total_size_consumed = 0;

// ------------------------ //

function init_audio_context() {

    if (typeof audio_context !== "undefined") {

        // console.log("audio_context already defined");
        return;
    }

    try {

        window.AudioContext = window.AudioContext ||
            window.webkitAudioContext ||
            window.mozAudioContext ||
            window.oAudioContext ||
            window.msAudioContext;

        audio_context = new AudioContext();

        console.log("cool audio context established ... audio_context ");

    } catch (e) {

        alert("Web Audio API is not supported by this browser\n ... http://caniuse.com/#feat=audio-api");
    }

    // ---

    gain_node = audio_context.createGain(); // Declare gain node
    gain_node.connect(audio_context.destination); // Connect gain node to speakers

    count_total_size_consumed = 0;

    // manager_audio_from_server = audio_from_server();

    // console.log("manager_audio_from_server ", manager_audio_from_server);
};

// ----------------- //

function  allocate_streaming_buffer(given_cushion_factor, given_transmit_chunksize, given_render_chunksize) {

    BUFF_SIZE_AUDIO_RENDERER = given_render_chunksize;

    console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);

	circular_queue.allocate_streaming_buffer(given_cushion_factor, given_transmit_chunksize, given_render_chunksize);
};

function get_size_memory_buffer() {

	return circular_queue.get_size_memory_buffer();
};

function get_streaming_status() {

	return flag_streaming_status;
};

function is_streaming_status_ready() {

	return (flag_streaming_status === streaming_status_ready);
};

function set_msgs_to_server(given_msgs_to_server) {

	msgs_to_server = given_msgs_to_server;
};

function set_circular_queue(given_circular_queue) {

	circular_queue = given_circular_queue;
};

function cb_set_terminal_index (given_max_index)      {

    console.log("OK cb_set_terminal_index ", given_max_index);

    circular_queue.set_terminal_index(given_max_index);
}

function cb_stream_is_complete(given_max_index) {

    final_index = given_max_index;

    flag_streaming_status = streaming_status_done;

    console.log("OK just set flag_streaming_status = streaming_status_done");


    // we_retrieved_last_chunk_from_server = true;

    circular_queue.set_terminal_index(final_index);

    console.log("cb_stream_is_complete final_index ", final_index, 
                " flag_streaming_status ", flag_streaming_status);

    console.log("flag_audio_rendering ", flag_audio_rendering);

    if (! flag_audio_rendering) {

        console.log("better late than never");

    // flag_streaming_status = streaming_status_active;

    // console.log("OK just set flag_streaming_status = streaming_status_active");

        // ---

        flag_audio_rendering = true;

        console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);

        streaming_node = audio_context.createScriptProcessor(BUFF_SIZE_AUDIO_RENDERER, 1, 1);

        console.log("BBBBBBBBAAAAAAAAAAAAAAAAAAAACCCCCCCCCCCCCCCKKKKKKKKKKKK on on on gain_node");

        streaming_node.connect(gain_node);

        setup_onaudioprocess_callback_stream(streaming_node, circular_queue, 
                                             circular_queue.get_memory_chunk, 
                                             set_false_in_middle_of_playback);
    }
};

// ---

function set_false_in_middle_of_playback() {

    in_middle_of_playback = false;

    // console.log('just set false to in_middle_of_playback');
};

function stop_audio() {

    circular_queue.set_stop_now();

    streaming_node.disconnect(gain_node);

    streaming_node.onaudioprocess = null;

    streaming_node = null;

    console.log('stop_audio ... just called disconnect');
    console.log('stop_audio ... just called disconnect');
    console.log('stop_audio ... just called disconnect');

    flag_streaming_status = streaming_status_ready; // get ready for next time

    console.log("OK just set flag_streaming_status = streaming_status_ready");

    // request_number = 0;

    // flag_audio_rendering = false;

    // terminate_current_run = true;

    we_retrieved_last_chunk_from_server = false;

    set_false_in_middle_of_playback();

    client_socket_comms.socket_client(msgs_to_server.mode_stop_streaming);

    count_total_size_consumed = 0;

    // clearInterval(timer_Id);
};

// ------------------------

function setup_onaudioprocess_callback_stream(given_node, circular_queue_obj, cb_get_memory_chunk, done_callback) {

    // var curr_index_synth_buffer = 0; // keep playing until this reaches size of synth buffer

    console.log("TOP setup_onaudioprocess_callback_stream");

    var count_num_called = 0;

    var internal_audio_buffer_obj = {};

    given_node.onaudioprocess = (function() {

        return function(event) {

            // if (terminate_current_run) { return;};

            // console.log("Middleburg  top of rendering callback ----------------------------------");

            internal_audio_buffer_obj.buffer = event.outputBuffer.getChannelData(0);// stens TODO - setup 2 channels

            // console.log("SIZE internal_audio_buffer_obj.buffer ", internal_audio_buffer_obj.buffer.length);

            // console.log("to call is_consumption_possible with  count_total_size_consumed ", 
            //     count_total_size_consumed, " final_index ", final_index);

            // if ((! we_retrieved_last_chunk_from_server) && circular_queue_obj.is_consumption_possible()) {
            // if (circular_queue_obj.is_consumption_possible()) {

            if ((flag_streaming_status === streaming_status_done && 
                 final_index !== 0 &&
                 count_total_size_consumed <= final_index) || circular_queue_obj.is_consumption_possible()) {

                // console.log("YES is_consumption_possible");

                cb_get_memory_chunk(internal_audio_buffer_obj); // retrieve buffer data from circular queue

                count_total_size_consumed += internal_audio_buffer_obj.buffer.length;

                // console.log("AAAAA size_available_to_consume ", internal_audio_buffer_obj.size_available_to_consume);
                // console.log("AAAAA count_total_size_consumed ", internal_audio_buffer_obj.count_total_size_consumed);

            } else {

                // console.log("NO NO NO is_consumption_possible NO NO NO");

                if (flag_streaming_status === streaming_status_done) {

                	console.log("flag_streaming_status === streaming_status_done SO call stop_audio");

                	// stop_audio(given_node);
                	stop_audio();

                } else {

                    console.log("NOTICE - consumption NOT possible yet stream NOT done");
                    console.log("NOTICE ... did server go offline ?  stopping audio streaming");

                    stop_audio();
                }
            };

            // ---

            if (count_num_called > 0) {

                // process_audio_buffer_from_server();
                setTimeout(process_audio_buffer_from_server, 0)

            } else {

                // console.log("OK count_num_called ", count_num_called, " is first run so skip over");
            }

            // ---

            setTimeout(function() {

                // console.log("AAAAA flag_streaming_status ", flag_streaming_status);

                if ((! we_retrieved_last_chunk_from_server) && flag_streaming_status === streaming_status_done) {

                    console.log("setting to true we_retrieved_last_chunk_from_server");

                    we_retrieved_last_chunk_from_server = true; // stop when we reach above on next iteration of this cb

                } else if (circular_queue.is_production_possible()) {

                    // OK circular queue consumed all of previous dollup so go ahead and get another buffer chunk from server

                    // console.log("OK circular queue is NOT full so get another chunk");

                    client_socket_comms.socket_client(msgs_to_server.mode_stream_audio_to_client);

                } else {

                    // console.log("... production is NOT possible so just go with the flow");
                };
            }, 0);

            count_num_called++;
        };
    }());
};           //      setup_onaudioprocess_callback_stream

// ---------------------------------------------------------------------------  //

var audio_from_server = (function() { // first in first out queue

    var audio_from_server_obj = {};
    var push_index = 0;
    var pop_index = 0;

    return {

        push : function(given_audio_obj_from_server) {

            // console.log("OK push onto audio_from_server_obj ... push_index ", push_index);
            
            audio_from_server_obj[push_index] = given_audio_obj_from_server;
            push_index += 1;

        },
        pop : function() {

            if (pop_index > 0) {

                // console.log("about to delete audio_from_server_obj ... pop_index ", pop_index - 1);

                delete audio_from_server_obj[pop_index - 1]; // destroy previously consumed entry
            }

            if (pop_index < push_index) {

                // console.log("OK pop onto audio_from_server_obj ... pop_index ", pop_index);

                return audio_from_server_obj[pop_index++];
            }
        }
    };
})();

function cb_receive_buffer_from_server_to_web_audio_player(given_audio_obj_from_server) {

    // audio_obj_from_server = given_audio_obj_from_server;

    audio_from_server.push(given_audio_obj_from_server);

    // console.log("audio_from_server ", audio_from_server);

    if (! flag_audio_rendering) {

        process_audio_buffer_from_server(); // safe to do this since not competing with rendering processing
    }
}

function process_audio_buffer_from_server() {

    // if (terminate_current_run) { return;};

    var audio_obj_from_server = audio_from_server.pop();

    if (typeof audio_obj_from_server === "undefined") {

        // console.error("ERROR - seeing undefined audio_obj_from_server ... from pop ");
        return;
    }

    circular_queue.pop_stream_buffer(audio_obj_from_server); // save data from server into circular queue


    // console.log("size_available_to_produce ", audio_obj_from_server.size_available_to_produce, " out of ", 
    //             audio_obj_from_server.buffer.length);

    // console.log("AAAAAAA count_total_size_buffered ", audio_obj_from_server.count_total_size_buffered);

    // console.log("audio_obj_from_server buffer size ", audio_obj_from_server.buffer.length, 
    //             " transaction_size ", audio_obj_from_server.transaction_size);

    if ((!flag_audio_rendering) && circular_queue.did_buffer_get_filled()) {
    // if (circular_queue.did_buffer_get_filled()) {

    	flag_audio_rendering = true;

        // console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);

        streaming_node = audio_context.createScriptProcessor(BUFF_SIZE_AUDIO_RENDERER, 1, 1);

        // ---

        console.log("OOOOOOOOOOOOOOOONNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN activating gain_node");

        streaming_node.connect(gain_node);

        flag_streaming_status = streaming_status_active;

        // console.log("OK just set flag_streaming_status = streaming_status_active");

        // ---

        setup_onaudioprocess_callback_stream(streaming_node, circular_queue, 
        									 circular_queue.get_memory_chunk, 
        									 set_false_in_middle_of_playback);
    };

    if (audio_obj_from_server.transaction_size === audio_obj_from_server.buffer.length &&
        circular_queue.is_production_possible()) {

        // OK circular queue consumed all of previous dollup so go ahead and get another buffer chunk from server

        // console.log("OK circular queue is NOT full so get another chunk");

        client_socket_comms.socket_client(msgs_to_server.mode_stream_audio_to_client);

    } else {

        // console.log("NOTICE - currently production is NOT possible"); // put into setTimeout

    };        
};      //      process_audio_buffer_from_server

// -----------------------------------------------------------------------  //

return { // to make visible to calling reference frame list function here

    init_audio_context : init_audio_context,
    allocate_streaming_buffer : allocate_streaming_buffer,
    get_size_memory_buffer : get_size_memory_buffer,
    is_streaming_status_ready : is_streaming_status_ready,
    get_streaming_status : get_streaming_status,
    set_msgs_to_server : set_msgs_to_server,
    set_circular_queue : set_circular_queue,
    stop_audio : stop_audio,
    cb_receive_buffer_from_server_to_web_audio_player : cb_receive_buffer_from_server_to_web_audio_player,
    // render_buffer: render_buffer,
    cb_set_terminal_index : cb_set_terminal_index,
    cb_stream_is_complete : cb_stream_is_complete
};

}; //  client_web_audio = function()



