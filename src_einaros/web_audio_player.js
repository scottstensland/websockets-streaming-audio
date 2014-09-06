
var web_audio_player = function() {

var audio_context;

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

var BUFF_SIZE_TIME_DOMAIN = BUFF_SIZE_AUDIO_RENDERER;

// var cushion_factor = 3; // delay start of audio rendering until we have buffered up a hefty cache of audio
// var cushion_factor = 10; // delay start of audio rendering until we have buffered up a hefty cache of audio
// var cushion_factor = 15; // delay start of audio rendering until we have buffered up a hefty cache of audio
// var cushion_factor = 20; // delay start of audio rendering until we have buffered up a hefty cache of audio
// var cushion_factor = 30; // delay start of audio rendering until we have buffered up a hefty cache of audio
var cushion_factor = 50; // delay start of audio rendering until we have buffered up a hefty cache of audio
// var cushion_factor = 100; // delay start of audio rendering until we have buffered up a hefty cache of audio
var count_num_buffers_received_from_server = 0;

var audio_obj_from_server = {};

var flag_audio_rendering = false;

var msgs_to_server = {};

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


function init_context_audio() {

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
        console.log(audio_context);

    } catch (e) {

        alert("Web Audio API is not supported by this browser\n ... http://caniuse.com/#feat=audio-api");
    }

    // ---

    gain_node = audio_context.createGain(); // Declare gain node
    gain_node.connect(audio_context.destination); // Connect gain node to speakers
};



function init_local_audio_obj(given_obj) {

    init_local_audio_obj["index_stream"] = 0;
}

function cb_stream_is_complete(given_max_index) {

    final_index = given_max_index;

    flag_streaming_status = streaming_status_done;

    console.log("cb_stream_is_complete final_index ", final_index, " flag_streaming_status ", flag_streaming_status);
};

    // ---

function allocate_streaming_buffer(audio_obj) {

    var server_supplied_media_obj = communication_sockets.socket_client({ mode : 7 });

    if (typeof server_supplied_media_obj["flag_max_media_size_retrieved"] !== "undefined" &&
        typeof server_supplied_media_obj["server_supplied_max_media_size"] !== "undefined" &&
        true === server_supplied_media_obj["flag_max_media_size_retrieved"]) {

        BUFFER_SIZE_STREAM_QUEUE = server_supplied_media_obj["server_supplied_max_media_size"];

        final_index = BUFFER_SIZE_STREAM_QUEUE;

        audio_obj.buffer = new Float32Array(BUFFER_SIZE_STREAM_QUEUE);
        audio_obj.max_index = BUFFER_SIZE_STREAM_QUEUE;

    } else {

        console.error("ERROR - failed to resolve server supplied media size");
    }
}

function cb_receive_buffer_from_server_to_web_audio_player(audio_obj_from_server) {

    if (typeof streaming_audio_obj.buffer === "undefined") {

        allocate_streaming_buffer(streaming_audio_obj);
    };

    if (flag_streaming_status === streaming_status_done) {

        console.log("Alexander DONE ... flag_streaming_status ", flag_streaming_status);

        // stens TODO - deallocate web audio player 

        flag_streaming_status = streaming_status_ready; // get ready for next time

        return;
    };

    // -----------------

    var curr_index = streaming_audio_obj.index_stream;
    var max_index = streaming_audio_obj.max_index;

    var local_index_max = audio_obj_from_server.buffer.length;

    console.log(curr_index + " out of " + max_index, " local_index_max " + local_index_max);

    for (var local_index = 0; local_index < local_index_max && curr_index < max_index;) {

        streaming_audio_obj.buffer[curr_index] = audio_obj_from_server.buffer[local_index];
        local_index++;
        curr_index++;
    };

    streaming_audio_obj.index_stream = curr_index;

    // -----------------

    console.log("|||||||||||||||||||||||||||||||||||||||||||||||||||||| ");
    console.log("flag_audio_rendering ", flag_audio_rendering);
    console.log("curr_index ", curr_index);
    console.log("final_index ", final_index);
    console.log("cushion_factor * BUFF_SIZE_AUDIO_RENDERER ", cushion_factor * BUFF_SIZE_AUDIO_RENDERER);
    console.log("flag_streaming_status ", flag_streaming_status);

    if ((! flag_audio_rendering) && 
        ((curr_index > cushion_factor * BUFF_SIZE_AUDIO_RENDERER) ||
         (flag_streaming_status === streaming_status_done) || 
         (curr_index >= final_index))) {

        // we have NOW accummulated sufficient safety buffer to launch audio rendering 

        console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);
        console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);
        console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);
        console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);
        console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);

        streaming_node = audio_context.createScriptProcessor(BUFF_SIZE_AUDIO_RENDERER, 1, 1);

        setup_onaudioprocess_callback_stream(streaming_node, streaming_audio_obj.buffer,
            streaming_audio_obj.buffer.length, set_false_in_middle_of_playback);

        streaming_node.connect(gain_node);

        flag_streaming_status = streaming_status_active;

        flag_audio_rendering = true;
    }

    // ---

    if (curr_index === max_index) {

        console.log("stop the madness - its DONE");

        return;
    }

    communication_sockets.socket_client(msgs_to_server.mode_stream_audio_to_client);

};      //      cb_receive_buffer_from_server_to_web_audio_player

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

    flag_streaming_status = streaming_status_ready; // get ready for next time

    flag_audio_rendering = false;

    set_false_in_middle_of_playback();
};
// exports.stop_audio = stop_audio;

// ------------------------

function setup_onaudioprocess_callback_stream(given_node, render_this_buffer, render_size_buffer, done_callback) {

    var curr_index_synth_buffer = 0; // keep playing until this reaches size of synth buffer

    given_node.onaudioprocess = (function() {

        return function(event) {

            var render_input_buffer;

            console.log("Middleburg  curr_index_synth_buffer ", curr_index_synth_buffer, 
                        " out of render_size_buffer ", render_size_buffer);

            // stens TODO - how to pass in own buffer instead of being given object: out so I can do a circular ring of such buffers

            render_input_buffer = event.outputBuffer.getChannelData(0); // stens TODO - do both channels not just left

            for (var curr_sample = 0; curr_sample < BUFF_SIZE_AUDIO_RENDERER; curr_sample++) {

                render_input_buffer[curr_sample] = render_this_buffer[curr_index_synth_buffer];

                curr_index_synth_buffer++;

                if (curr_index_synth_buffer >= render_size_buffer ||
                    curr_index_synth_buffer >= final_index) {

                    if (given_node) {

                        given_node.disconnect(gain_node);

                        given_node.onaudioprocess = null;

                        // given_node.stop();

                        given_node = null;

                        // audio_context = null;

                        console.log("Supermassive Blackhole curr_index_synth_buffer ", curr_index_synth_buffer);

                        console.log('just called disconnect on node attached to this callback ');

                        flag_streaming_status = streaming_status_ready; // get ready for next time

                        flag_audio_rendering = false;

                        done_callback();

                        return;
                    }
                }
            }
        };
    }());
}           //      setup_onaudioprocess_callback_stream

// ---------------------------------------------------------------------------  //

function render_buffer(given_flavor) {

    console.log('\n\ncw + ss    thursday          310   \n\n');

    if (true == in_middle_of_playback) {

        console.log('currently in MIDDLE of a playback try later ...');
        return;
    }

    var desired_buffer_obj = {};

    if (desired_buffer_obj) {

        switch (given_flavor) {
/*
            case 5 : {

                console.log("get audio buffer from server using Web Sockets in one big wallup ... alas not streaming");

                // communication_sockets.socket_client(4, null, forward_audio_buffer_to_player);

                // communication_sockets.socket_client({

                //     given_mode : 4, 
                //     desired_buffer_obj : desired_buffer_obj,
                //     given_callback : forward_audio_buffer_to_player
                // });

                    // Justice_Genesis_first_30_seconds_tight.wav

                break;
            }

            case 6 : {

                console.log("show audio data pulled from server");

                shared_utils.show_object(server_side_audio_obj,
                    "server_side_audio_obj 32 bit signed float render_buffer", "total", 100);

                break;
            }


            case 7 : {

                console.log("render audio previously retrieved from server");

                // BUFF_SIZE = server_side_audio_obj.buffer.length;
                // BUFF_SIZE = 16384;
                // BUFF_SIZE = 1024;

                console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);


                // var server_side_node = audio_context.createScriptProcessor(BUFF_SIZE, 1, 1);
                var server_side_node = audio_context.createScriptProcessor(BUFF_SIZE_AUDIO_RENDERER, 1, 1);

                setup_onaudioprocess_callback_render(server_side_node, server_side_audio_obj.buffer,
                    server_side_audio_obj.buffer.length, set_false_in_middle_of_playback);

                // followup_fft(server_side_node);
                server_side_node.connect(gain_node);


                break;
            }

            case 8 : {

                console.log("stream audio from server to client browser");

                if (flag_streaming_status !== streaming_status_ready) {

                    console.error("NOTICE - currently is middle of previous streaming request ... try later");
                    return;
                }

                // ---

                streaming_audio_obj.buffer = new Float32Array(BUFFER_SIZE_STREAM_QUEUE);
                streaming_audio_obj.max_index = BUFFER_SIZE_STREAM_QUEUE;



                console.log("early days about to stow cb_stream_is_complete as : ",
                                cb_stream_is_complete.name);

                // communication_sockets.set_stream_is_complete_cb(cb_stream_is_complete);

                // communication_sockets.socket_client(5, null, cb_stream_audio_buffer_to_player);

                break;
            }
*/
/*
            case 9 : {

                console.log("stream audio from server to client browser the right way");

                if (flag_streaming_status !== streaming_status_ready) {

                    console.error("NOTICE - currently is middle of previous streaming request ... try later");
                    return;
                }

                // ---

                streaming_audio_obj.buffer = new Float32Array(BUFFER_SIZE_STREAM_QUEUE);
                streaming_audio_obj.max_index = BUFFER_SIZE_STREAM_QUEUE;


                // communication_sockets.set_stream_is_complete_cb(cb_stream_is_complete);

                // communication_sockets.socket_client(5, null, cb_stream_audio_buffer_to_web_audio_player);

                break;
            }
*/

            case 10 : {

                console.log("stream audio from server to client browser");

                if (flag_streaming_status !== streaming_status_ready) {

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



                // streaming_audio_obj = null;
                // streaming_audio_obj = {};

                // init_local_audio_obj(streaming_audio_obj);

                streaming_audio_obj = {

                    index_stream : 0
                };

                curr_index_synth_buffer = 0;

                // flag_was_rendering_buffer_allocated = false;

                // var comm_msg = {

                //     mode : 6,
                //     callback : cb_receive_buffer_from_server_to_web_audio_player,
                //     limit_buffer_size : 100000,
                //     media_file : "Scriabin_Etude_No_3_in_G_Major_Op_65_Sviatoslav_Richter_mono_AAnImXHJHaM.wav"
                // };

                var media_file;

                var requested_action = "stream_audio_to_client";
                media_file = "Justice_Genesis_mono_trim_16bit_y6iHYTjEyKU.wav";
                var callback = cb_receive_buffer_from_server_to_web_audio_player;

                // ---

                var comm_msg = {};

                comm_msg.mode = 6;
                comm_msg.requested_action = requested_action
                comm_msg.requested_source = media_file;
                comm_msg.cb_client_to_server_to_client = callback;

                
                comm_msg.transmit_chunksize = 65536;
                // comm_msg.transmit_chunksize = 131072;
                // comm_msg.transmit_chunksize = 262144;
                // comm_msg.transmit_chunksize = 524288; // too big

                comm_msg.limit_buffer_size = 0;
                // comm_msg.limit_buffer_size = 5000;
                // comm_msg.limit_buffer_size = 10000;
                // comm_msg.limit_buffer_size = 100000;
                // comm_msg.limit_buffer_size = 200000;

                msgs_to_server.mode_stream_audio_to_client = comm_msg;

                // ---

                communication_sockets.set_stream_is_complete_cb(cb_stream_is_complete);

                console.log("comm_msg ", msgs_to_server.mode_stream_audio_to_client);

                communication_sockets.socket_client(msgs_to_server.mode_stream_audio_to_client);

                break;
            }


            case 11 : {

                console.log("stop audio");

                stop_audio(streaming_node);

                break;
            }

            default : {

                console.error("ERROR - failed to match given_flavor ", given_flavor);

                break;
            }
        }

        // ---

    } else {

        console.log('no playback buffer available');
    }
} //      render_buffer

// -----------------------------------------------------------------------  //

return { // to make visible to calling reference frame list function here

    // load the sound

    init_context_audio: init_context_audio,
    stop_audio : stop_audio,
    // play_tune_jam: play_tune_jam,
    // run_synth: run_synth,
    // pause_tune: pause_tune,
    // do_another_sampling: do_another_sampling,
    // stop_microphone: stop_microphone,
    // stop_synth: stop_synth,
    // stop_jam_sound: stop_jam_sound,
    render_buffer: render_buffer,
    // get_was_anything_stopped: get_was_anything_stopped,
    // pause_jam_sound: pause_jam_sound,
    // resume_jam_sound: resume_jam_sound,
    // play_jam_N_do_sample: play_jam_N_do_sample,
    // do_mute: do_mute,
    // un_mute: un_mute,
    cb_stream_is_complete : cb_stream_is_complete
};

}(); //  web_audio_player = function()

