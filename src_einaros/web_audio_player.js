
var web_audio_player = function() {

var audio_context;

// BUFF_SIZE_AUDIO_RENDERER must be in units of sample frames, i.e., one of:
// 256, 512, 1024, 2048, 4096, 8192, or 16384
var BUFF_SIZE_AUDIO_RENDERER = 16384;

var BUFF_SIZE_TIME_DOMAIN = BUFF_SIZE_AUDIO_RENDERER;

var cushion_factor = 3; // delay start of audio rendering until we have buffered up a hefty cache of audio
// var cushion_factor = 10; // delay start of audio rendering until we have buffered up a hefty cache of audio
var count_num_buffers_received_from_server = 0;

var audio_obj_from_server = {};

var flag_audio_rendering = false;

var flag_was_rendering_buffer_allocated = false;

var did_one_draw = false;

var was_anything_stopped = false;

var microphone_data = {};

// var BUFFER_SIZE_STREAM_QUEUE = 2097152; // stens TODO - wrap into a circular queue
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


    // var streaming_node;

  // console.log("TOP web_audio_player ... here is shared_utils ", shared_utils);

// function init_context_audio(given_buffer_size, given_buffer_size_time_domain) {
function init_context_audio() {

    // BUFF_SIZE = given_buffer_size;

    // BUFF_SIZE_TIME_DOMAIN = given_buffer_size_time_domain;

    try {

        // window.AudioContext = window.AudioContext || window.webkitAudioContext;

        window.AudioContext = window.AudioContext ||
            window.webkitAudioContext ||
            window.mozAudioContext ||
            window.oAudioContext ||
            window.msAudioContext;

        audio_context = new AudioContext();
        console.log("cool audio context established");

    } catch (e) {

        alert('Web Audio API is not supported by this browser\n ... get with wit yo');
    }

    // ---

    gain_node = audio_context.createGain(); // Declare gain node
    gain_node.connect(audio_context.destination); // Connect gain node to speakers
};

    // ---

function top_up_buffer(audio_obj_from_server) {

    // bbb

    console.log("top_up_buffer");
    /*
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

    communication_sockets.socket_client(5, null, top_up_buffer);
    */
};


/*
    function forward_audio_buffer_to_player(audio_obj_from_server) {

        server_side_audio_obj = audio_obj_from_server;

        console.log("Corinde where U at ... here I am ... forward_audio_buffer_to_player");
        console.log("Corinde where U at ... here I am ... forward_audio_buffer_to_player");
        console.log("Corinde where U at ... here I am ... forward_audio_buffer_to_player");
        console.log("Corinde where U at ... here I am ... forward_audio_buffer_to_player");
        console.log("Corinde where U at ... here I am ... forward_audio_buffer_to_player");

        if (typeof audio_obj_from_server !== "undefined") {

            console.log("server_side_audio_obj ", server_side_audio_obj);
            console.log("shared_utils.show_object ", shared_utils.show_object);

            // 

            shared_utils.show_object(server_side_audio_obj,
                "backHome server_side_audio_obj 32 bit signed float   forward_audio_buffer_to_player", "total", 10);


            // shared_utils.show_object();

        }
    };
*/

    // ---

    // bbb

function cb_stream_is_complete(given_max_index) {

    final_index = given_max_index;

    console.log("SETTING streaming_status_done ... SINCE TOP of cb_stream_is_complete");
    console.log("SETTING streaming_status_done ... SINCE TOP of cb_stream_is_complete");
    console.log("SETTING streaming_status_done ... SINCE TOP of cb_stream_is_complete");

    flag_streaming_status = streaming_status_done;


    console.log("SETTING flag_streaming_status ", flag_streaming_status, 
                " final_index ", final_index);
};

/*
    function cb_stream_audio_buffer_to_player(audio_obj_from_server) {

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

        console.log("Corinde where U at ... here I am ... cb_stream_audio_buffer_to_player");

        if (typeof audio_obj_from_server !== "undefined") {

            console.log("streaming_audio_obj ", streaming_audio_obj);
            console.log("shared_utils.show_object ", shared_utils.show_object);

            shared_utils.show_object(streaming_audio_obj,
                "... streaming_audio_obj 32 bit signed float   forward_audio_buffer_to_player", "total", 3);
        }

        // ---

        switch (flag_streaming_status) {

            case streaming_status_ready : {

                console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);

                // var streaming_node = audio_context.createScriptProcessor(BUFF_SIZE, 1, 1);
                var streaming_node = audio_context.createScriptProcessor(BUFF_SIZE_AUDIO_RENDERER, 1, 1);

                setup_onaudioprocess_callback_stream(streaming_node, streaming_audio_obj.buffer,
                    streaming_audio_obj.buffer.length, set_false_in_middle_of_playback);

                // followup_fft(streaming_node);
                streaming_node.connect(gain_node);



                flag_streaming_status = streaming_status_active;

                // communication_sockets.socket_client(5, null, cb_stream_audio_buffer_to_player);

                break;
            }

            case streaming_status_active : {

                // communication_sockets.socket_client(5, null, cb_stream_audio_buffer_to_player);

                break;
            };

            case streaming_status_done : {

                console.log("OK ... this current streaming is done ... ready for next time");

                flag_streaming_status = streaming_status_ready;

                break;
            };

            default : {

                console.error("ERROR - invalid value of flag_streaming_status : ", flag_streaming_status);
            }
        };
    };      //      cb_stream_audio_buffer_to_player
*/
    // ---
/*
    function cb_stream_audio_buffer_to_web_audio_player(audio_obj_from_server) { // stream the right way

        console.log("cb_stream_audio_buffer_to_web_audio_player ... flag_streaming_status ", flag_streaming_status);

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

        console.log("Corinde where U at ... here I am ... cb_stream_audio_buffer_to_web_audio_player");

        if (typeof audio_obj_from_server !== "undefined") {

            console.log("streaming_audio_obj ", streaming_audio_obj);
            console.log("shared_utils.show_object ", shared_utils.show_object);

            shared_utils.show_object(streaming_audio_obj,
                "... streaming_audio_obj 32 bit signed float   forward_audio_buffer_to_player", "total", 3);
        }

        // ---

        switch (flag_streaming_status) {

            case streaming_status_ready : {

                console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);

                // var streaming_node = audio_context.createScriptProcessor(BUFF_SIZE, 1, 1);
                var streaming_node = audio_context.createScriptProcessor(BUFF_SIZE_AUDIO_RENDERER, 1, 1);

                setup_onaudioprocess_callback_stream(streaming_node, streaming_audio_obj.buffer,
                    streaming_audio_obj.buffer.length, set_false_in_middle_of_playback);

                // followup_fft(streaming_node);
                streaming_node.connect(gain_node);



                flag_streaming_status = streaming_status_active;

                // communication_sockets.socket_client(5, null, cb_stream_audio_buffer_to_player);

                break;
            }

            case streaming_status_active : {

                // communication_sockets.socket_client(5, null, cb_stream_audio_buffer_to_player);

                break;
            };

            case streaming_status_done : {

                console.log("OK ... this current streaming is done ... ready for next time");

                flag_streaming_status = streaming_status_ready;

                break;
            };

            default : {

                console.error("ERROR - invalid value of flag_streaming_status : ", flag_streaming_status);
            }
        };
    };      //      cb_stream_audio_buffer_to_web_audio_player
*/
    // ---

function allocate_streaming_buffer(audio_obj) {

    if (flag_was_rendering_buffer_allocated) {

        return;
    }

    console.log("... about to call  allocate_streaming_buffer  ");

    console.log("Corinde Stensland allocate_streaming_buffer  ");

    // bbbbbbbb

    var server_supplied_media_obj = communication_sockets.socket_client({ mode : 7 });

    if (typeof server_supplied_media_obj["flag_max_media_size_retrieved"] !== "undefined" &&
        typeof server_supplied_media_obj["server_supplied_max_media_size"] !== "undefined" &&
        true === server_supplied_media_obj["flag_max_media_size_retrieved"]) {

        BUFFER_SIZE_STREAM_QUEUE = server_supplied_media_obj["server_supplied_max_media_size"];

        audio_obj.buffer = new Float32Array(BUFFER_SIZE_STREAM_QUEUE);
        audio_obj.max_index = BUFFER_SIZE_STREAM_QUEUE;

        flag_was_rendering_buffer_allocated = true;

        console.log("Corinde Stensland BUFFER_SIZE_STREAM_QUEUE  ", BUFFER_SIZE_STREAM_QUEUE);

    } else {

        console.error("ERROR - failed to resolve server supplied media size");
    }
}

function cb_receive_buffer_from_server_to_web_audio_player(audio_obj_from_server) {

    console.log("Cairo ... flag_streaming_status ", flag_streaming_status);

    allocate_streaming_buffer(streaming_audio_obj);

    if (flag_streaming_status === streaming_status_done) {

        console.log("Alexander DONE ... flag_streaming_status ", flag_streaming_status);

        // stens TODO - deallocate web audio player 

        return;
    };

    var curr_index = streaming_audio_obj.index_stream;
    var max_index = streaming_audio_obj.max_index;

// bbb

    if ((! flag_audio_rendering) && curr_index > cushion_factor * BUFF_SIZE_AUDIO_RENDERER) {

        // have we accummulated sufficient safety buffer to launch audio rendering ?

        // allocate_streaming_buffer(streaming_audio_obj);


        console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);

        // var streaming_node = audio_context.createScriptProcessor(BUFF_SIZE_AUDIO_RENDERER, 1, 1);
        this.streaming_node = audio_context.createScriptProcessor(BUFF_SIZE_AUDIO_RENDERER, 1, 1);

        setup_onaudioprocess_callback_stream(streaming_node, streaming_audio_obj.buffer,
            streaming_audio_obj.buffer.length, set_false_in_middle_of_playback);

        // followup_fft(streaming_node);
        streaming_node.connect(gain_node);

        flag_streaming_status = streaming_status_active;

        flag_audio_rendering = true;

        streaming_node.top_up_buffer = top_up_buffer;

        // return;
    }



    var local_index_max = audio_obj_from_server.buffer.length;

    console.log(curr_index + " out of " + max_index, " local_index_max " + local_index_max);

    for (var local_index = 0; local_index < local_index_max && curr_index < max_index;) {

        streaming_audio_obj.buffer[curr_index] = audio_obj_from_server.buffer[local_index];
        local_index++;
        curr_index++;
    };

    streaming_audio_obj.index_stream = curr_index;

    console.log("Corinde where U at ... here I am ... cb_stream_audio_buffer_to_web_audio_player");

    // ---

                // var comm_msg = {

                //     mode : 6,
                //     callback : cb_receive_buffer_from_server_to_web_audio_player,
                //     media_file : "2500_hz_sine_2_seconds.wav"
                // };

    // communication_sockets.socket_client(5, null, cb_receive_buffer_from_server_to_web_audio_player);
    communication_sockets.socket_client({

        mode : 6, 
        callback : cb_receive_buffer_from_server_to_web_audio_player
    });


};      //      cb_receive_buffer_from_server_to_web_audio_player

// ---

var gain_node;

var source_node;
var fft_analyzer;
var script_processor_audio_file_node;
var script_processor_fft_node;
var script_processor_synth_node;
var script_processor_time_domain_node;

var allow_synth = false;

function setup_time_domain(given_script_processor) {

    given_script_processor.onaudioprocess = (function() {

        return function(event) {

            var input_buffer;

            // stens TODO - how to pass in own buffer instead of being given object: out so I can do a circular ring of such buffers

            input_buffer = event.inputBuffer.getChannelData(0); // stens TODO - do both channels not just left

            // stens TODO - commented out below 20140811

            // audio_display_obj.pipeline_buffer_for_time_domain_cylinder(input_buffer,
            //     BUFF_SIZE_TIME_DOMAIN, "providence_4");
        };
    }());
} //      setup_time_domain

function setup_audio_nodes(flag_loop) {

    script_processor_time_domain_node = audio_context.createScriptProcessor(BUFF_SIZE_TIME_DOMAIN, 1, 1);
    script_processor_time_domain_node.connect(gain_node);

    // setup a javascript node
    script_processor_audio_file_node = audio_context.createScriptProcessor(2048, 1, 1);
    script_processor_audio_file_node.connect(gain_node);
    // script_processor_audio_file_node.connect(script_processor_time_domain_node);

    // setup a analyzer
    fft_analyzer = audio_context.createAnalyser();
    fft_analyzer.smoothingTimeConstant = 0;
    fft_analyzer.fftSize = 1024;

    // create a buffer source node
    source_node = audio_context.createBufferSource();

    source_node.loop = flag_loop;

    source_node.connect(fft_analyzer);
    fft_analyzer.connect(script_processor_audio_file_node);

    source_node.connect(gain_node);
    source_node.connect(script_processor_time_domain_node);

    // ---

    document.addEventListener('visibilityChange', on_visibility_change);

    setup_time_domain(script_processor_time_domain_node); // stens TODO performance - is repeats forever

} //      setup_audio_nodes

// load the specified sound
function load_sound(url, once_playback_starts_callback, given_mode, stop_callback) {

    console.log('here is url ', url);

    var MAXIMUM_WAITING_TIME = 200000;

    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // --- below added as error checking --- //

    /*
    var requestTimer = setTimeout(function() {
        request.abort();
        // Handle timeout situation, e.g. Retry or inform user

        console.log("ERROR - requestTimer timed out ");

    }, MAXIMUM_WAITING_TIME);

    request.onreadystatechange = function() {
        if (request.readyState != 4) {
            return;
        }
        clearTimeout(requestTimer);
        if (request.status != 200) {
            // Handle error, e.g. Display error message on page

            console.log("ERROR - XMLHttpRequest ");

            return;
        }
        // var serverResponse = request.responseText;
        // console.log("serverResponse ", serverResponse);
    };
    */

    // --- above added as error checking --- //



    // var file_suffix = url.substr(url.lastIndexOf('.') + 1); //  get just the :  wav
    var file_name = url.substr(url.lastIndexOf('/') + 1);

    // When loaded decode the data
    request.onload = function() {

        // decode the data
        audio_context.decodeAudioData(request.response, function(buffer) {

            // console.log('mp3 ... buffer.length ', buffer.length);
            console.log(file_name, ' ... buffer.length ', buffer.length);

            // ---

            is_jam_happening = true;

            // was_anything_stopped = false;   // reset for any possible subsequent playback

            play_sound(buffer, once_playback_starts_callback, given_mode, stop_callback);

            // ---

        }, on_error); // stens TODO - chase down why getting null error when attemping to decode filetype ogg / wav OK
    };

    // request.onerror = function() {
    //     console.error("ERROR - failed to load file data: " + url);
    // };

    request.send();

} //      load_sound

function get_was_anything_stopped() {

    return was_anything_stopped;
}

function pause_jam_sound() {

    source_node.disconnect();
}

function resume_jam_sound() {

    source_node.connect(fft_analyzer);
    source_node.connect(gain_node);
    source_node.connect(script_processor_time_domain_node);
}

function stop_jam_sound() {

    if (source_node) {

        source_node.stop(0);

        was_anything_stopped = true;
    }
}

function play_sound(buffer, once_playback_starts_callback, given_mode, stop_callback) {

    source_node.buffer = buffer;
    source_node.start(0);

    // // source_node.loop = true;
    // source_node.loop = false;

    // source_node.loopStart = 0;
    // source_node.loopEnd = 0.1;

    if (once_playback_starts_callback) {

        console.log('OK do have once_playback_starts_callback so call it');

        // execute callback    --> do_another_sampling <--    when actually doing playback
        // once_playback_starts_callback(given_mode);
        once_playback_starts_callback(given_mode, stop_callback);

    } else {

        console.log('BOO HOO  do NOT have once_playback_starts_callback so ignore it');
    }
}

// log if an error occurs
function on_error(e) {
    console.log(e);
}

function on_visibility_change() {

    if (document.Hidden) {

        console.log('window tab is now hidden');
    }
}

function setup_fft(flag_loop) {

    setup_audio_nodes(flag_loop);

    script_processor_audio_file_node.onaudioprocess = function() {

        // get the average for the first channel
        var array = new Uint8Array(fft_analyzer.frequencyBinCount);
        fft_analyzer.getByteFrequencyData(array);

        // draw the spectrogram
        if (source_node.playbackState == source_node.PLAYING_STATE) {

            // stens TODO - commented out below 20140811

            // audio_display_obj.update_one_row(array);
        }
    }
}

// ---

function do_mute() {

    gain_node.disconnect()
}

function un_mute() {

    // gain_node = audio_context.createGain(); // Declare gain node
    gain_node.connect(audio_context.destination); // Connect gain node to speakers
}

// ---------------------------------  setup microphone ------------------------------------  //


// console.log('cw + ss tuesday 1131am');

var is_microphone_recording = false;

function process_microphone_buffer(event) {

    var i, N, inp, microphone_output_buffer;

    microphone_output_buffer = event.inputBuffer.getChannelData(0); // stens TODO - do both channels not just left

    // stens TODO - commented out below 20140811

    // audio_display_obj.pipeline_buffer_for_time_domain_cylinder(microphone_output_buffer,
    //     microphone_output_buffer.length, "providence_3");
}

// console.log('cw + ss tuesday 2pm');


function start_microphone() { // stens TODO - verify fft works for microphone

    microphone_data.script_processor_fft_node = audio_context.createScriptProcessor(2048, 1, 1);
    microphone_data.script_processor_fft_node.connect(gain_node);

    microphone_data.fft_analyzer = audio_context.createAnalyser();
    microphone_data.fft_analyzer.smoothingTimeConstant = 0;
    microphone_data.fft_analyzer.fftSize = 1024;


    microphone_data.fft_analyzer.connect(microphone_data.script_processor_fft_node);


    // get input media stream

    microphone_data.microphone_stream = audio_context.createMediaStreamSource(microphone_data.media_stream);

    // setup js processor

    // microphone_data.script_processor_node = audio_context.createScriptProcessor(BUFF_SIZE, 1, 1);
    microphone_data.script_processor_node = audio_context.createScriptProcessor(BUFF_SIZE_AUDIO_RENDERER, 1, 1);

    microphone_data.script_processor_node.onaudioprocess = process_microphone_buffer;

    microphone_data.microphone_stream.connect(microphone_data.script_processor_node);


    microphone_data.script_processor_node.connect(microphone_data.fft_analyzer);

    microphone_data.microphone_stream.connect(gain_node);


    console.log('OK microphone stream connected');

    // ---

    microphone_data.script_processor_fft_node.onaudioprocess = function() {

        // get the average for the first channel

        var array = new Uint8Array(microphone_data.fft_analyzer.frequencyBinCount);
        microphone_data.fft_analyzer.getByteFrequencyData(array);

        // draw the spectrogram of FFT data in frequency domain onto spinning cylinder

        if (microphone_data.script_processor_node.playbackState ==
            microphone_data.script_processor_node.PLAYING_STATE) {

            // stens TODO - commented out below 20140811

            // audio_display_obj.update_one_row(array);
        }
    }

    is_microphone_recording = true;

    was_anything_stopped = false; // reset for any possible subsequent playback

} //      start_microphone

function stop_microphone() {

    microphone_data.microphone_stream.disconnect();
    microphone_data.script_processor_node.disconnect();
    microphone_data.media_stream.stop();
    microphone_data.script_processor_node.onaudioprocess = null;

    was_anything_stopped = true;

    console.log('... microphone now stopped');
}


function record_microphone() {

    // audio_context

    if (!navigator.getUserMedia) {

        navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    }

    navigator.getUserMedia(

        {
            audio: true
        },

        function(stream) {

            microphone_data.media_stream = stream;
            start_microphone();
        },

        on_error
    );
}

// ---------------------------------  end of microphone    ---------------------------------- //

function play_jam_N_do_sample(given_mode) {

    inner_play_tune_jam(do_another_sampling, given_mode, stop_jam_sound);
}


var is_jam_happening = false;

function play_tune_jam(flag_loop) {

    // 

    switch (flag_loop) {

        case 1 : {

                console.log('... OK no jam loop just play once  ');

                // source_node.loop = false;

                inner_play_tune_jam(null, null, null, false);

                break;
            }

        case 2 : {

                console.log('... OK loop jam to play endlessly ...  ');

                inner_play_tune_jam(null, null, null, true);

                break;
            }

        case 3 : {

                console.log('render syn wav buffer directly');

                // inner_play_tune_jam(null, null, null, true);

                setup_fft(true);

                var synthesized_wav_obj = {};

                render_wav_obj.get_wav_buffer(synthesized_wav_obj);

                console.log('size of synth wav buffer ', synthesized_wav_obj.buffer.length);

                source_node.buffer = synthesized_wav_obj.buffer;
                source_node.start(0);

                break;
            }

            // --- default

            break;
    }
};


function inner_play_tune_jam(once_playback_starts_callback, given_mode, stop_callback, flag_loop) {

    setup_fft(flag_loop);

    // wav

    // var chosen_audio_file = "Justice_Genesis_chewy_chocolate_cookies_gtZunGHG0ls_mono_30_seconds.mp3";
    // var chosen_audio_file = "Justice_Genesis_chewy_chocolate_cookies_gtZunGHG0ls_mono.ogg";
    // var chosen_audio_file = "Lee_Smolin_Physics_Envy_and_Economic_Theory-cWn86ESze6M_mono_1st_few_seconds.mp3";
    // var chosen_audio_file = "Lee_Smolin_Physics_Envy_and_Economic_Theory-cWn86ESze6M_mono_tiny_snip.mp3";

    // var chosen_audio_file = "Elephant_sounds_rgUFu_hVhlk_roar_mono_clip01.wav";
    // var chosen_audio_file = "Ida_Corr_Fedde_Le_Grand_Let_Me_Think_About_It-19WUwZYM7bM.wav";
    // var chosen_audio_file = "Justice_Genesis_chewy_chocolate_cookies_gtZunGHG0ls_mono.ogg";
    // var chosen_audio_file = "../media/Ida_Corr_Fedde_Le_Grand_Let_Me_Think_About_It-19WUwZYM7bM.wav";

    // var chosen_audio_file = "Chopin_Fantasie_Impromptu_opus_66-APQ2RKECMW8.wav";
    // var chosen_audio_file = "Chopin_Fantasie_Impromptu_opus_66-APQ2RKECMW8.ogg";
    // var chosen_audio_file = "Chopin_Fantasie_Impromptu_opus_66-APQ2RKECMW8_mono.wav";
    // var chosen_audio_file = "Chopin_Fantasie_Impromptu_opus_66-APQ2RKECMW8_mono_8000_16.wav";
    // var chosen_audio_file = "Justice_Genesis_mono-y6iHYTjEyKU.wav";
    // var chosen_audio_file = "Justice_Genesis_first_30_seconds.wav";
    var chosen_audio_file = "Justice_Genesis_first_30_seconds_tight.wav";



/*

        IMPORTANT - when above wav file is NOT found browser console says : stens TODO - need to better handle

http://localhost:8888/Justice_Genesis_mono-y6iHYTjEyKU.wav [HTTP/1.1 404 Not Found 1ms]
The buffer passed to decodeAudioData contains an unknown content type.
*/



    //      Stradivari viola
    // var chosen_audio_file = "Viola_16_Jay_Haide_a_L_Ancienne_Stradivari-H4ri4jE14cE.mp3";


    // var chosen_audio_file = "Elephant_sounds_rgUFu_hVhlk_roar_mono_tiny.wav";

    console.log('chosen_audio_file ', chosen_audio_file);

    // source_node.loop = flag_loop;

    load_sound(chosen_audio_file, once_playback_starts_callback, given_mode, stop_callback);

    was_anything_stopped = false; // reset for any possible subsequent playback

};      //      inner_play_tune_jam



// ---

function render_audio_buffer(render_this_buffer, render_size_buffer, done_callback) {

    console.log('TOP of render_audio_buffer    render_size_buffer', render_size_buffer,
        // ' BUFF_SIZE ', BUFF_SIZE);
        ' BUFF_SIZE_AUDIO_RENDERER ', BUFF_SIZE_AUDIO_RENDERER);



// 
    // ---

    // setup_fft();

    // ---

    var script_processor_synth_from_sample_node;

    // script_processor_synth_from_sample_node = audio_context.createScriptProcessor(BUFF_SIZE, 1, 1);
    script_processor_synth_from_sample_node = audio_context.createScriptProcessor(BUFF_SIZE_AUDIO_RENDERER, 1, 1);

    var curr_index_synth_buffer = 0; // keep playing until this reaches size of synth buffer

    // var last_time = new Date().getTime();

    script_processor_synth_from_sample_node.onaudioprocess = (function() {

        return function(event) {

            var synthesized_output_buffer;

            // stens TODO - how to pass in own buffer instead of being given object: out so I can do a circular ring of such buffers

            synthesized_output_buffer = event.outputBuffer.getChannelData(0); // stens TODO - do both channels not just left

            // for (var curr_sample = 0; curr_sample < BUFF_SIZE; curr_sample++) {
            for (var curr_sample = 0; curr_sample < BUFF_SIZE_AUDIO_RENDERER; curr_sample++) {

                synthesized_output_buffer[curr_sample] = render_this_buffer[curr_index_synth_buffer];

                curr_index_synth_buffer++;

                if (curr_index_synth_buffer >= render_size_buffer) {

                    console.log('\n\ncw + ss    thursday        419             \n\n');

                    if (script_processor_synth_from_sample_node) {

                        script_processor_synth_from_sample_node.disconnect(gain_node);

                        script_processor_synth_from_sample_node = null;
                    }

                    // ---

                    done_callback();

                    // console.log('render DONE curr_index_synth_buffer ', curr_index_synth_buffer);
                }
            }

        };

    }());

    // ---

    script_processor_synth_from_sample_node.connect(gain_node);

} //      render_audio_buffer


var in_middle_of_playback = false;

function set_false_in_middle_of_playback() {

    in_middle_of_playback = false;

    console.log('just set false to in_middle_of_playback');
}

function do_another_sampling(given_mode, stop_callback) {

    if (allow_synth) {

        // vvv

        // audio_process_obj.take_another_sample();  // stens TODO pass callback here to call stop_synth()
        audio_process_obj.take_another_sample(stop_synth, given_mode); // stens TODO pass callback here to call stop_synth()

        // console.log(' since sample is DONE now stop synth');

        // stop_synth();    // IMPORTANT cannot put here called too soon

    } else if (is_jam_happening) {

        // audio_process_obj.take_another_sample(null, given_mode);
        audio_process_obj.take_another_sample(stop_callback, given_mode);

    } else if (is_microphone_recording) {

        audio_process_obj.take_another_sample(null, given_mode); // microphone gets sampled

    } else {

        console.log('cannot since not currently synthesizing audio');
    }
}


function init_synth_settings_ignore(given_node) {

    given_node.MIN_FREQ = 20;
    given_node.MAX_FREQ = 300;

    given_node.sample_freq = given_node.MIN_FREQ; // Hertz
    // given_node.BUFF_SIZE = BUFF_SIZE;
    given_node.BUFF_SIZE = BUFF_SIZE_AUDIO_RENDERER;

    given_node.sample_rate = audio_context.sampleRate / (2 * Math.PI); // sample rate
    given_node.decreasing_freq_factor = 0.98;
    given_node.increasing_freq_factor = 1.01;
    given_node.freq_factor = given_node.increasing_freq_factor;
}

function init_synth_settings(given_node, g_MIN_FREQ, g_MAX_FREQ, g_BUFF_SIZE, g_decreasing_freq_factor, g_increasing_freq_factor) {

    given_node.MIN_FREQ = g_MIN_FREQ;
    given_node.MAX_FREQ = g_MAX_FREQ;

    // 

    given_node.sample_freq = given_node.MIN_FREQ; // Hertz
    given_node.BUFF_SIZE = g_BUFF_SIZE;

    given_node.sample_rate = audio_context.sampleRate / (2 * Math.PI); // sample rate
    given_node.decreasing_freq_factor = g_decreasing_freq_factor;
    given_node.increasing_freq_factor = g_increasing_freq_factor;
    given_node.freq_factor = g_increasing_freq_factor;
}

    // ---

function setup_onaudioprocess_callback(given_node) {

    given_node.onaudioprocess = (function() {

        return function(event) {

            if (allow_synth) {

                // console.log('inside main_glob callback   onaudioprocess   BUFF_SIZE ', BUFF_SIZE);

                var synthesized_output_buffer;

                // stens TODO - how to pass in own buffer instead of being given object: out so I can do a circular ring of such buffers

                synthesized_output_buffer = event.outputBuffer.getChannelData(0); // stens TODO - do both channels not just left

                var phi = 0,
                    dphi = 2.0 * Math.PI * given_node.sample_freq /
                    given_node.sample_rate;

                for (var curr_sample = 0; curr_sample < given_node.BUFF_SIZE; curr_sample++, phi += dphi) {

                    synthesized_output_buffer[curr_sample] = Math.sin(phi);
                }

                given_node.sample_freq *= given_node.freq_factor;

                if (given_node.sample_freq <
                    given_node.MIN_FREQ) {

                    given_node.freq_factor = given_node.increasing_freq_factor;

                } else if (given_node.sample_freq > given_node.MAX_FREQ) {

                    given_node.freq_factor = given_node.decreasing_freq_factor;
                }

                // ---

                // stens TODO - commented out below 20140811

                // audio_display_obj.pipeline_buffer_for_time_domain_cylinder(synthesized_output_buffer,
                //     BUFF_SIZE, "providence_2");
            }
        };

    }());
}       //      setup_onaudioprocess_callback

function setup_onaudioprocess_callback_render(given_node, render_this_buffer, render_size_buffer, done_callback) {

    var curr_index_synth_buffer = 0; // keep playing until this reaches size of synth buffer

    given_node.onaudioprocess = (function() {

        return function(event) {

            var synthesized_output_buffer;

            // stens TODO - how to pass in own buffer instead of being given object: out so I can do a circular ring of such buffers

            synthesized_output_buffer = event.outputBuffer.getChannelData(0); // stens TODO - do both channels not just left

            // for (var curr_sample = 0; curr_sample < BUFF_SIZE; curr_sample++) {
            for (var curr_sample = 0; curr_sample < BUFF_SIZE_AUDIO_RENDERER; curr_sample++) {

                synthesized_output_buffer[curr_sample] = render_this_buffer[curr_index_synth_buffer];

                curr_index_synth_buffer++;

                if (curr_index_synth_buffer >= render_size_buffer) {

                    // console.log('\n\ncw + ss    thursday        434             \n\n');

                    if (given_node) {

                        given_node.disconnect(gain_node);

                        given_node = null;

                        console.log('just called disconnect on node attached to this callback ');
                    }

                    // ---

                    done_callback();

                    // console.log('render DONE curr_index_synth_buffer ', curr_index_synth_buffer);
                }
            }

            // ---

        };

    }());

    // do_engage(given_node);

} //      setup_onaudioprocess_callback_render

// ------------------------

function setup_onaudioprocess_callback_stream(given_node, render_this_buffer, render_size_buffer, done_callback) {

    // 
    var curr_index_synth_buffer = 0; // keep playing until this reaches size of synth buffer

    given_node.onaudioprocess = (function() {

        return function(event) {

            var render_input_buffer;

// bbb


            console.log("curr_index_synth_buffer ", curr_index_synth_buffer, 
                        " out of render_size_buffer ", render_size_buffer);

            // console.log("final_index ", final_index);
            // console.log("curr_index_synth_buffer ", curr_index_synth_buffer);
            // console.log((flag_streaming_status === streaming_status_done) ? "NOT_DONE" : "YES_DONE_NOW");


            // stens TODO - how to pass in own buffer instead of being given object: out so I can do a circular ring of such buffers

            render_input_buffer = event.outputBuffer.getChannelData(0); // stens TODO - do both channels not just left

            // for (var curr_sample = 0; curr_sample < BUFF_SIZE; curr_sample++) {
            for (var curr_sample = 0; curr_sample < BUFF_SIZE_AUDIO_RENDERER; curr_sample++) {

                render_input_buffer[curr_sample] = render_this_buffer[curr_index_synth_buffer];

                curr_index_synth_buffer++;

                // final_index  

// bbb

                // if (curr_index_synth_buffer >= render_size_buffer) {
                if (curr_index_synth_buffer >= render_size_buffer ||
                    curr_index_synth_buffer >= final_index) {



                    // flag_streaming_status === streaming_status_done &&
                    // max_index


                    // console.log('\n\ncw + ss    thursday        434             \n\n');

                    if (given_node) {

                        given_node.disconnect(gain_node);

                        given_node.onaudioprocess = null;

                        // given_node.stop();

                        given_node = null;

                        audio_context = null;

                        console.log('just called disconnect on node attached to this callback ');

                        return;
                    }

                    // ---

                    // bbb

                    done_callback();

                    console.log('render DONE curr_index_synth_buffer ', curr_index_synth_buffer);
                }
            }

            // ---

            if (given_node                                      &&
                typeof given_node.top_up_buffer !== "undefined" &&
                flag_streaming_status           !== streaming_status_done) {

                console.log("ABOUT to call given_node.top_up_buffer");

                given_node.top_up_buffer();

            } else {

                // console.log("Boo Hoo   ... top_up_buffer   says good-bye");
            }




            // console.log('render_audio_buffer sending pipeline_buffer_for_time_domain_cylinder...');

            // audio_display_obj.pipeline_buffer_for_time_domain_cylinder(render_input_buffer, 
            //     BUFF_SIZE, "providence_1");

            // stens TODO - commented out below 20140811

            // audio_display_obj.pipeline_buffer_for_time_domain_cylinder(render_input_buffer,
            //     BUFF_SIZE, "providence_1");
        };

    }());

    // do_engage(given_node);

} //      setup_onaudioprocess_callback_stream

// ------------------------

function followup_fft(given_node) {

    given_node.connect(gain_node);

    // --- setup FFT processing --- //

    var glob_script_processor_fft_node = audio_context.createScriptProcessor(2048, 1, 1);
    glob_script_processor_fft_node.connect(gain_node);

    console.log('\n\ncw + ss    thursday         428     \n\n');

    // setup a analyzer
    var glob_fft_analyzer = audio_context.createAnalyser();
    glob_fft_analyzer.smoothingTimeConstant = 0;
    glob_fft_analyzer.fftSize = 1024;
    // glob_fft_analyzer.fftSize = 2048;

    given_node.connect(glob_fft_analyzer);
    glob_fft_analyzer.connect(glob_script_processor_fft_node);

    // ---

    glob_script_processor_fft_node.onaudioprocess = function() {

        // get the average for the first channel

        var array = new Uint8Array(glob_fft_analyzer.frequencyBinCount);
        glob_fft_analyzer.getByteFrequencyData(array);

        // draw the spectrogram of FFT data in frequency domain onto spinning cylinder

        if (given_node.playbackState ==
            given_node.PLAYING_STATE) {

            // console.log('update_one_row ... synth array length ', array.length);

            // stens TODO - commented out below 20140811
            // audio_display_obj.update_one_row(array); // show another row on FFT display
        }
    }
} //      followup_fft

function run_synth() {

    if (false == allow_synth) {

        allow_synth = true;

        // launch_synth();
        // main_glob();

        // var this_glob_01 = audio_context.createScriptProcessor(BUFF_SIZE, 1, 1);
        var this_glob_01 = audio_context.createScriptProcessor(BUFF_SIZE_AUDIO_RENDERER, 1, 1);

        // init_synth_settings(this_glob_01);

        // (given_node, g_MIN_FREQ, g_MAX_FREQ, g_BUFF_SIZE, g_decreasing_freq_factor, g_increasing_freq_factor) {


        // init_synth_settings(this_glob_01, 20, 300, BUFF_SIZE, 0.98, 1.01);
        init_synth_settings(this_glob_01, 20, 300, BUFF_SIZE_AUDIO_RENDERER, 0.98, 1.01);


        setup_onaudioprocess_callback(this_glob_01);
        // followup_fft(this_glob_01);

        this_glob_01.connect(gain_node);


        was_anything_stopped = false; // reset for any possible subsequent playback

    } else {

        console.log('we are already running synth');
    }
}

function stop_synth() {

    console.log('top of stop_synth ...........');

    allow_synth = false;

    was_anything_stopped = true;
}

function pause_tune() {

    console.log("inside pause_tune ");
}

// ---------------------------------------------------------------------------  //


function render_buffer(given_flavor) {

    console.log('\n\ncw + ss    thursday          310   \n\n');

    if (true == in_middle_of_playback) {

        console.log('currently in MIDDLE of a playback try later ...');
        return;
    }

    console.log('launching playback in render_buffer in MIDDLE of playback given_flavor ', given_flavor);

    // var local_buffer = audio_process_obj.get_buffer(given_flavor);
    // var size_buffer = audio_process_obj.get_size_buffer(given_flavor);

    // var desired_buffer_obj = audio_process_obj.get_buffer(given_flavor);
    var desired_buffer_obj = {};

    // if (desired_buffer_obj && desired_buffer_obj.buffer) {

    if (desired_buffer_obj) {

        console.log('!!!!!!!  !!!!!!! OK about to playback buffer given_flavor ', given_flavor);

        // ---

        switch (given_flavor) {

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


            case 10 : {

                console.log("stream audio from server to client browser");

                if (flag_streaming_status !== streaming_status_ready) {

                    console.error("NOTICE - currently is middle of previous streaming request ... try later");
                    return;
                }

                // ---

                // streaming_audio_obj.buffer = new Float32Array(BUFFER_SIZE_STREAM_QUEUE);
                // streaming_audio_obj.max_index = BUFFER_SIZE_STREAM_QUEUE;

                    // media_file : "Justice_Genesis_first_30_seconds_tight.wav"
                    // media_file : "2500_hz_sine_2_seconds.wav"
                    // media_file : "Ida_Corr_Fedde_Le_Grand_Let_Me_Think_About_It-19WUwZYM7bM.wav"
                    // media_file : "Justice_Genesis_first_third_sec_tight.wav"
                    // media_file : "sine_wave_32768_64.wav"
                    // media_file : "sine_wave_32768_128.wav"





                var comm_msg = {

                    mode : 6,
                    callback : cb_receive_buffer_from_server_to_web_audio_player,
                    media_file : "2500_hz_sine_2_seconds.wav"
                };

                communication_sockets.set_stream_is_complete_cb(cb_stream_is_complete);

                // communication_sockets.socket_client(5, null, cb_stream_audio_buffer_to_player);
                // communication_sockets.socket_client(6, null, cb_stream_audio_buffer_to_web_audio_player);
                // communication_sockets.socket_client(6, null, cb_receive_buffer_from_server_to_web_audio_player);
                communication_sockets.socket_client(comm_msg);

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
    play_tune_jam: play_tune_jam,
    run_synth: run_synth,
    pause_tune: pause_tune,
    do_another_sampling: do_another_sampling,
    record_microphone: record_microphone,
    stop_microphone: stop_microphone,
    stop_synth: stop_synth,
    stop_jam_sound: stop_jam_sound,
    render_buffer: render_buffer,
    get_was_anything_stopped: get_was_anything_stopped,
    pause_jam_sound: pause_jam_sound,
    resume_jam_sound: resume_jam_sound,
    play_jam_N_do_sample: play_jam_N_do_sample,
    do_mute: do_mute,
    un_mute: un_mute,
    cb_stream_is_complete : cb_stream_is_complete
};

}(); //  web_audio_player = function()

