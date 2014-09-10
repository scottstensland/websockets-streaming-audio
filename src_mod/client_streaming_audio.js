

var client_streaming_audio = function() {

var audio_context;

var client_memory;

/*

2^2 4
2^3 8
2^4 16
2^5 32
2^6 64
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
2^25 33554432
2^26 67108864
2^27 134217728
2^28 268435456
2^29 536870912
2^30 1073741824
2^31 2147483648
2^32 4294967296

*/

// BUFF_SIZE_AUDIO_RENDERER must be in units of sample frames, i.e., one of:
// 256, 512, 1024, 2048, 4096, 8192, or 16384
// var BUFF_SIZE_AUDIO_RENDERER = 2048;
// var BUFF_SIZE_AUDIO_RENDERER = 4096;
// var BUFF_SIZE_AUDIO_RENDERER = 8192;
var BUFF_SIZE_AUDIO_RENDERER = 16384;

var count_num_buffers_received_from_server = 0;

var audio_obj_from_server = {};

var flag_audio_rendering = false;
var terminate_current_run = false;

var we_retrieved_last_chunk_from_server = false;

var msgs_to_server = {};

var timer_Id; // for setIterval clearing once complete

var BUFFER_SIZE_STREAM_QUEUE; // stens TODO - wrap into a circular queue
var curr_index_stream_buffer = 0;
var server_side_audio_obj;

var streaming_audio_obj = {

    index_stream : 0
};

var final_index;  // suppled by server side ... only populated when server senses source media has been exhausted

var streaming_status_ready      = "streaming_status_ready";
var streaming_status_preloading = "streaming_status_preloading";
var streaming_status_active     = "streaming_status_active";
var streaming_status_done       = "streaming_status_done";

var flag_streaming_status = streaming_status_ready; // when server side signals stream is done this becomes false

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
};

// ----------------- //

function cb_stream_is_complete(given_max_index) {

    final_index = given_max_index;

    flag_streaming_status = streaming_status_done;

    // we_retrieved_last_chunk_from_server = true;

    client_memory_mgr.set_terminal_index(final_index);

    console.log("cb_stream_is_complete final_index ", final_index, " flag_streaming_status ", flag_streaming_status);
};

// ---

var gain_node;
var streaming_node;

var allow_synth = false;

var in_middle_of_playback = false;

function set_false_in_middle_of_playback() {

    in_middle_of_playback = false;

    console.log('just set false to in_middle_of_playback');
}

function stop_audio(given_node) {

    given_node.disconnect(gain_node);

    given_node.onaudioprocess = null;

    given_node = null;

    console.log('stop_audio ... just called disconnect');
    console.log('stop_audio ... just called disconnect');
    console.log('stop_audio ... just called disconnect');

    flag_streaming_status = streaming_status_ready; // get ready for next time

    // flag_audio_rendering = false;

    terminate_current_run = true;

    set_false_in_middle_of_playback();

    client_socket_comms.socket_client(msgs_to_server.mode_stop_streaming);

    clearInterval(timer_Id);
};

// ------------------------

function setup_onaudioprocess_callback_stream(given_node, circular_queue_obj, cb_get_memory_chunk, done_callback) {

    // var curr_index_synth_buffer = 0; // keep playing until this reaches size of synth buffer

    var internal_audio_buffer_obj = {};

    given_node.onaudioprocess = (function() {

        return function(event) {

            // if (terminate_current_run) { return;};

            console.log("Middleburg  top of rendering callback ");

            internal_audio_buffer_obj.buffer = event.outputBuffer.getChannelData(0);// stens TODO - setup 2 channels

            console.log("SIZE internal_audio_buffer_obj.buffer ", internal_audio_buffer_obj.buffer.length);

            console.log("about to call is_consumption_possible");

            if ((! we_retrieved_last_chunk_from_server) && circular_queue_obj.is_consumption_possible()) {

                console.log("YES is_consumption_possible");

                cb_get_memory_chunk(internal_audio_buffer_obj); // retrieve buffer data from circular queue

                console.log("AAAAA size_available_to_consume ", internal_audio_buffer_obj.size_available_to_consume);
                console.log("AAAAA count_total_size_consumed ", internal_audio_buffer_obj.count_total_size_consumed);

            } else {

                console.log("playback is complete ... stopping now");

                stop_audio(given_node);
            };

            // ---

            if (flag_streaming_status === streaming_status_done) {

                we_retrieved_last_chunk_from_server = true; // stop when we reach above on next iteration of this cb

            } else if (client_memory_mgr.is_production_possible()) {

                // OK circular queue consumed all of previous dollup so go ahead and get another buffer chunk from server

                console.log("OK circular queue is NOT full so get another chunk");

                client_socket_comms.socket_client(msgs_to_server.mode_stream_audio_to_client);

            } else {

                console.log("... production is NOT possible so just go with the flow");
            };

            // shared_utils.show_object(internal_audio_buffer_obj,
            //     "internal_audio_buffer_obj", "total", 10);

        };
    }());
};           //      setup_onaudioprocess_callback_stream

// function request_server_send_another_chunk() {

//     if (client_memory_mgr.is_production_possible()) {

//         // OK circular queue consumed all of previous dollup so go ahead and get another buffer chunk from server

//         console.log("OK circular queue is NOT full so get another chunk");
//         console.log("OK circular queue is NOT full so get another chunk");
//         console.log("OK circular queue is NOT full so get another chunk");

//         client_socket_comms.socket_client(msgs_to_server.mode_stream_audio_to_client);
//     };
// };

// function setup_setInterval() {

//     timer_Id = setInterval(request_server_send_another_chunk, 100);
// };

// ---------------------------------------------------------------------------  //

function cb_receive_buffer_from_server_to_web_audio_player(audio_obj_from_server) {

    if (terminate_current_run) { return;};

    client_memory_mgr.pop_stream_buffer(audio_obj_from_server); // save data from server into circular queue

    console.log("size_available_to_produce ", audio_obj_from_server.size_available_to_produce, " out of ", 
                audio_obj_from_server.buffer.length);

    console.log("AAAAAAA count_total_size_buffered ", audio_obj_from_server.count_total_size_buffered);

    console.log("audio_obj_from_server buffer size ", audio_obj_from_server.buffer.length, 
                " transaction_size ", audio_obj_from_server.transaction_size);

    if ((!flag_audio_rendering) && client_memory_mgr.did_buffer_get_filled()) {

        console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);
        console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);
        console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);
        console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);
        console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);

        streaming_node = audio_context.createScriptProcessor(BUFF_SIZE_AUDIO_RENDERER, 1, 1);

        // setup_onaudioprocess_callback_stream(streaming_node, streaming_audio_obj.buffer,
        //     streaming_audio_obj.buffer.length, set_false_in_middle_of_playback);

        setup_onaudioprocess_callback_stream(streaming_node, client_memory_mgr, client_memory_mgr.get_memory_chunk, set_false_in_middle_of_playback);

        streaming_node.connect(gain_node);

        flag_streaming_status = streaming_status_active;

        flag_audio_rendering = true;
    };

    if (audio_obj_from_server.transaction_size === audio_obj_from_server.buffer.length &&
        client_memory_mgr.is_production_possible()) {

        // OK circular queue consumed all of previous dollup so go ahead and get another buffer chunk from server

        console.log("OK circular queue is NOT full so get another chunk");
        console.log("OK circular queue is NOT full so get another chunk");
        console.log("OK circular queue is NOT full so get another chunk");

        client_socket_comms.socket_client(msgs_to_server.mode_stream_audio_to_client);

    } else {

        console.log("NOTICE - currently production is NOT possible");

    };        
};      //      cb_receive_buffer_from_server_to_web_audio_player

// ----------------------------------------  //

function entry_point(given_request) {

    switch (given_request) {

        case "init_audio_context" : {

            init_audio_context();

            break;
        }

        case "stream_audio" : {

            console.log("stream audio from server to client browser");

            if (flag_streaming_status !== streaming_status_ready) {

                console.log("flag_streaming_status ", flag_streaming_status);

                console.error("NOTICE - currently is middle of previous streaming request ... try later");
                return;
            }

            // ---

            console.log("Start your Engines .............");

            // init_context_audio();

            // var total_heap = window.performance.memory.totalJSHeapSize;  // total heap memory
            // var curr_used_heap = window.performance.memory.usedJSHeapSize; // currently used heap memory
            // console.log("total_heap ", total_heap, " curr_used_heap ", curr_used_heap);

            // ---

            // streaming_audio_obj.buffer = new Float32Array(BUFFER_SIZE_STREAM_QUEUE);
            // streaming_audio_obj.max_index = BUFFER_SIZE_STREAM_QUEUE;

            // media_file = "2500_hz_sine_2_seconds.wav";
                // media_file : "Ida_Corr_Fedde_Le_Grand_Let_Me_Think_About_It-19WUwZYM7bM.wav"
                // media_file : "Justice_Genesis_first_third_sec_tight.wav"
            // media_file = "sine_wave_32768_64.wav";
            // media_file = "sine_wave_32768_128.wav"
                // media_file : "J_S_Bach_Violin_Concerto_d-minor_after_BWV_1052_Mov_1_3-_mono_4jGRhbXS4E.wav"
            // media_file = "Justice_Genesis_mono-y6iHYTjEyKU.wav";
                // media_file : "Scriabin_Etude_No_3_in_G_Major_Op_65_Sviatoslav_Richter_mono_AAnImXHJHaM.wav"
            // media_file = "sine_wave_262144_64.wav";
            // media_file = "sine_wave_8388608_64.wav";
            // media_file = "Justice_Genesis_first_30_seconds_tight.wav";
            // media_file = "Justice_Genesis_mono_trim_16bit_y6iHYTjEyKU.wav";


            streaming_audio_obj = {

                index_stream : 0
            };

            curr_index_synth_buffer = 0;

            flag_audio_rendering = false;

            var media_file;

            var requested_action = "stream_audio_to_client";
            // media_file = "Justice_Genesis_first_30_seconds_tight.wav";
            // media_file = "sine_wave_32768_64.wav";
            // media_file = "sine_wave_262144_64.wav";
            // media_file = "sine_wave_8388608_64.wav";
            // media_file = "Justice_Genesis_first_third_sec_tight.wav";
            media_file = "Justice_Genesis_mono_trim_16bit_y6iHYTjEyKU.wav";
            var callback = cb_receive_buffer_from_server_to_web_audio_player;

            // ---

            var stop_streaming_msg = {};

            stop_streaming_msg.mode = "mode_stop_streaming";
            stop_streaming_msg.requested_action = "stop_streaming";

            msgs_to_server.mode_stop_streaming = stop_streaming_msg;

            // ---

            var stream_audio_msg = {};

            // stream_audio_msg.mode = 6;
            stream_audio_msg.mode = "mode_stream_audio";
            stream_audio_msg.requested_action = requested_action
            stream_audio_msg.requested_source = media_file;
            stream_audio_msg.cb_client_to_server_to_client = callback;

            stream_audio_msg.transmit_chunksize = 16384;
            // stream_audio_msg.transmit_chunksize = 65536;
            // stream_audio_msg.transmit_chunksize = 131072;
            // stream_audio_msg.transmit_chunksize = 262144;
            // stream_audio_msg.transmit_chunksize = 524288; // too big

            stream_audio_msg.limit_buffer_size = 0;
            // comm_msg.limit_buffer_size = 5000;
            // comm_msg.limit_buffer_size = 10000;
            // comm_msg.limit_buffer_size = 100000;
            // comm_msg.limit_buffer_size = 200000;

            // ---

            // delay start of audio rendering until we have buffered up a hefty cache of audio
            var cushion_factor = 2;
            // var cushion_factor = 10;
            // var cushion_factor = 15; 
            // var cushion_factor = 20;
            // var cushion_factor = 30;
            // var cushion_factor = 50;
            // var cushion_factor = 100;

            // ---

            var size_memory_buffer = cushion_factor * stream_audio_msg.transmit_chunksize;

            console.log("size_memory_buffer ", size_memory_buffer);
            // console.log("client_memory_mgr ", client_memory_mgr);

            client_memory_mgr.allocate_streaming_buffer(size_memory_buffer);

            console.log("get_size_memory_buffer ", client_memory_mgr.get_size_memory_buffer());


            msgs_to_server.mode_stream_audio_to_client = stream_audio_msg;

            // --- 

            client_socket_comms.set_stream_is_complete_cb(cb_stream_is_complete);

            console.log("stream_audio_msg ", msgs_to_server.mode_stream_audio_to_client);

            client_socket_comms.socket_client(msgs_to_server.mode_stream_audio_to_client);

            break;
        }

        case "stop_audio" : {

            console.log("stop audio");

            stop_audio(streaming_node);

            break;
        }

        default : {

            console.error("ERROR - failed to match given_flavor ", given_flavor);

            break;
        }
    }

};


// -----------------------------------------------------------------------  //

return { // to make visible to calling reference frame list function here

    entry_point : entry_point
    // stop_audio : stop_audio,
    // render_buffer: render_buffer,
    // cb_stream_is_complete : cb_stream_is_complete
};

}(); //  client_streaming_audio = function()

