
var client_entry = (function() {
	
"use strict";

// var ww_handle = new Worker("ww_transferable_obj.js");
var ww_handle = new Worker("ww_transferable_obj.js");

var callback_send_audio_to_audio_player = null;
var retrieved_audio_buffer_obj = {};

var array_stats_for_launch = [];
var startTime = 0;

var manage_state = (function() {

    // (1) initial preload
    // browser asks ww to get audio from server which gets returned to fill browser queue
    // ... this is prior to launching web audio API
    var mode_browser_get_audio_from_server = "browser_get_audio_from_server"; // (1)
    // (1) --> (2) triggered when browser queue becomes full


    // (2) server fills up ww queue while browser consumes its own queue undisturbed by server or ww
    var mode_ww_get_audio_from_server      = "ww_get_audio_from_server"; // (2)
    // (2) --> (3) triggered when browser queue becomes too empty


    // (3) ww sends twice as much data to browser as it consumes so browser queue fills - server side idle
    var mode_browser_get_audio_from_ww     = "browser_get_audio_from_ww"; // (3)
    // (3) --> (2) triggered when browser queue becomes full


    var current_browser_mode = mode_browser_get_audio_from_server; // initially state (1) preload browser q

    // --- state transition --- //
    // 
    //      (1) --> (2) --> (3)  ... loop back to (2)

    // ----------------------------------------------------------------

    var msgs_to_server_by_mode = {};

    return {

        get_state : function() {

            return current_browser_mode;
        },
        set_browser_queue_filled : function() {

            console.log("TOP browser_queue_filled");

            // do transition from state (1) OR (3) --> (2)

            if (current_browser_mode === mode_browser_get_audio_from_server ||
                current_browser_mode === mode_browser_get_audio_from_ww) {

                if (manage_audio.get_is_streaming_done()) {

                    console.log("already reached end of source media AND ww queue should be EMPTY " +
                        "\nso avoid triggering into new state");

                } else {

                    var msg_curr_mode = msgs_to_server_by_mode[mode_ww_get_audio_from_server];

                    if (typeof msg_curr_mode !== "undefined") {

                        // OK

                    } else {

                        msg_curr_mode = msgs_to_server_by_mode[mode_browser_get_audio_from_server];

                        if (typeof msg_curr_mode !== "undefined") {

                            msg_curr_mode.browser_directed_mode = mode_ww_get_audio_from_server;

                            msgs_to_server_by_mode[mode_ww_get_audio_from_server] = msg_curr_mode;

                        } else {

                            throw new Error("ERROR - we assumed initial state was populated");
                        }
                    }

                    shared_utils.show_object(msg_curr_mode, "ggggg#####ggggg msg_curr_mode", "total", 10);

                    // ------------

                    current_browser_mode = mode_ww_get_audio_from_server; // (1) OR (3) --> (2)

                    console.log("new state " + current_browser_mode + " ################################### ");

                    // ww_handle.postMessage(JSON.stringify({
                    //  browser_directed_mode : current_browser_mode
                    // }));

                    ww_handle.postMessage(
                        JSON.stringify(manage_state.get_msg_to_server_by_mode(manage_state.get_state())));
                }

            } else {

                throw new Error("ERROR - was told browser_queue_filled yet " +
                                "current state not (1) or (3) : " + current_browser_mode);
            }
        },
        set_browser_queue_min_threshold_reached : function() {

            console.log("TOP browser_queue_min_threshold_reached");

            // do transition from (2) --> (3)

            if (current_browser_mode === mode_ww_get_audio_from_server) {

                var msg_curr_mode = msgs_to_server_by_mode[mode_browser_get_audio_from_ww];

                if (typeof msg_curr_mode !== "undefined") {

                    // OK

                } else {

                    msg_curr_mode = msgs_to_server_by_mode[mode_browser_get_audio_from_server];

                    if (typeof msg_curr_mode !== "undefined") {

                        msg_curr_mode.browser_directed_mode = mode_browser_get_audio_from_ww;

                        msgs_to_server_by_mode[mode_browser_get_audio_from_ww] = msg_curr_mode;

                    } else {

                        throw new Error("ERROR - we assumed initial state was populated");
                    }
                }


                shared_utils.show_object(msg_curr_mode, "yyyyyy^^^^^^^yyyyyyy msg_curr_mode", "total", 10);


                // ---------

                current_browser_mode = mode_browser_get_audio_from_ww;

                console.log("new state " + current_browser_mode + " ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ");

                // ww_handle.postMessage(JSON.stringify({
                //  browser_directed_mode : current_browser_mode
                // }));

                ww_handle.postMessage(
                    JSON.stringify(manage_state.get_msg_to_server_by_mode(manage_state.get_state())));
            }
        },
        is_early_days : function() {

            return (current_browser_mode === mode_browser_get_audio_from_server);
        },
        request_another_buffer : function() {

            console.log("request_another_buffer " + manage_state.get_state());

            if (current_browser_mode !== mode_ww_get_audio_from_server) {


                var returned_msg = manage_state.get_msg_to_server_by_mode(manage_state.get_state());

                // ww_handle.postMessage(JSON.stringify({
                //  browser_directed_mode : current_browser_mode
                // }));


                ww_handle.postMessage(JSON.stringify(returned_msg));


            }
        },
        set_msg_to_server_by_mode : function(given_mode, given_msg) {

            msgs_to_server_by_mode[given_mode] = given_msg;
        },
        get_msg_to_server_by_mode : function(given_mode) {

            return msgs_to_server_by_mode[given_mode];
        }
    };
}());   //      manage_state

function browser_queue_is_full_callback() {

    console.log("AAAAAAAAAAAAAAAAbout to call manage_state.set_browser_queue_filled");

    manage_state.set_browser_queue_filled();
}

function cb_browser_queue_min_reached() {

    manage_state.set_browser_queue_min_threshold_reached();
}

var cb_request_another_buffer = (function() { // stens TODO - remove this as it just limits calls for ts

    var count_requests = 0;
    var max_requests = 999999; // limit only to ease troubleshooting

    return function(given_source) {

        if (count_requests < max_requests) {

            // if (manage_state.is_early_days()) { // 
            if (((given_source === "early_days" || 
                  given_source === "Middleburg") && manage_audio.get_is_production_possible()) ||
                  given_source === "tell_ww_to_refill") {

                    console.log("cb_request_another_buffer given_source " + given_source);

                    manage_state.request_another_buffer();

            } else {

                console.log("sorry its NOT early days or Middleburg ...");
            }

        } else {

            throw new Error("ERROR - NOTICE - hold your horses ... intentionally stopping");
        }

        count_requests += 1;
    };
}());

function cb_get_is_streaming_done() {

    console.log("here is is streaming done " + manage_audio.get_is_streaming_done());

    return manage_audio.get_is_streaming_done();
}

var manage_audio = (function() {

	var web_audio_obj = Object.create(render_streaming_web_audio());

	callback_send_audio_to_audio_player = web_audio_obj.cb_send_buffer_to_web_audio_player;

    // define callback so audio processing can execute web worker request for another buffer
    web_audio_obj.set_cb_request_another_buffer(cb_request_another_buffer);

    web_audio_obj.queue_first_in_first_out.set_cb_browser_queue_is_full(browser_queue_is_full_callback);
    web_audio_obj.queue_first_in_first_out.set_cb_browser_queue_min_reached(cb_browser_queue_min_reached);
    // web_audio_obj.queue_first_in_first_out.set_cb_get_state(cb_get_state);

    web_audio_obj.set_cb_is_streaming_done(cb_get_is_streaming_done);

    var streaming_is_done = false; // did we reach end of source media we are streaming
                                    // if true we have received last buffer from ww or server
    var flag_desire_to_stop = false;

    // var max_index = null;

    // var stop_next_event_loop_iteration = false;

	return {

        set_BUFF_SIZE_AUDIO_RENDERER : function(given_buff_size) {

            web_audio_obj.set_BUFF_SIZE_AUDIO_RENDERER(given_buff_size);
        },
		set_queue_min_threshold : function(given_min_threshold) {

			web_audio_obj.queue_first_in_first_out.set_browser_queue_min_threshold(given_min_threshold);
		},
		set_queue_max_size : function(given_max_size) {

			web_audio_obj.queue_first_in_first_out.set_browser_queue_max_size(given_max_size);			
		},
        stop_audio : function(given_msg_to_ww) {

            console.log("stop_audio uuuuuuuuuuuuuuuuuu");

            given_msg_to_ww.browser_directed_mode = "mode_stop_streaming";

            console.log(given_msg_to_ww);

            ww_handle.postMessage(JSON.stringify(given_msg_to_ww));

            if (typeof web_audio_obj !== "undefined") {

                web_audio_obj.queue_first_in_first_out.set_request_stop();

                // if (curr_web_audio_obj && (! curr_web_audio_obj.is_streaming_status_ready())) {

                console.log("stop_audio");
            }
        },
        get_is_production_possible : function() {

            return web_audio_obj.queue_first_in_first_out.is_production_possible();
        },
        set_is_streaming_done : function(given_max_index) {

            streaming_is_done = true;

            web_audio_obj.queue_first_in_first_out.set_max_index(given_max_index);
        },
        get_is_streaming_done : function() {

            return streaming_is_done;
        },
        get_flag_audio_rendering : function() {

            return web_audio_obj.queue_first_in_first_out.get_flag_audio_rendering();
        },
        launch_audio_streaming_done : function() {

            web_audio_obj.process_audio_buffer();
        }
	};
}());       //      manage_audio

function populate_launch_stream_audio_msg(msgs_to_server) {

    // var request_number = new Date().getTime();

    // ---

    var stop_streaming_msg = {};

    stop_streaming_msg.mode = "mode_stop_streaming";
    stop_streaming_msg.requested_action = "stop_streaming";
    // stop_streaming_msg.request_number = request_number;

    msgs_to_server.mode_stop_streaming = stop_streaming_msg;

    // ---

    var stream_audio_msg = {};

    // stream_audio_msg.mode = 6;
    stream_audio_msg.mode = "mode_stream_audio";
    stream_audio_msg.requested_action = "stream_audio_to_client";
    // stream_audio_msg.requested_source = media_file;
    // stream_audio_msg.cb_client_to_server_to_client = callback; // stens TODO bridge

    // stream_audio_msg.request_number = request_number;

    // var transmit_chunk_multiplier = 2; // size of server requests are this multiple of render chunksize
    // var transmit_chunk_multiplier = 4; // size of server requests are this multiple of render chunksize
    // var transmit_chunk_multiplier = 8; // size of server requests are this multiple of render chunksize
    // var transmit_chunk_multiplier = 16; // size of server requests are this multiple of render chunksize

    // stream_audio_msg.limit_buffer_size = 0;

    // ---

    // delay start of audio rendering until we have buffered up a hefty cache of audio
    // size of circular queue memory buffer is this factor times transmit chunk multiplier times render chunksize
    // var cushion_factor = 1;
    // var cushion_factor = 2;
    // var cushion_factor = 3;
    // var cushion_factor = 6;
    // var cushion_factor = 10;
    var cushion_factor = 15; 
    // var cushion_factor = 20;
    // var cushion_factor = 30;
    // var cushion_factor = 50;
    // var cushion_factor = 100;

    // ---

    var transmit_chunk_multiplier = null;
    var BUFF_SIZE_AUDIO_RENDERER = null;

    // var array_render_N_chunk = { BUFF_SIZE_AUDIO_RENDERER : 2048, transmit_chunk_multiplier : 16 };
    // var array_render_N_chunk = { BUFF_SIZE_AUDIO_RENDERER : 4096, transmit_chunk_multiplier : 8 };
    // var array_render_N_chunk = { BUFF_SIZE_AUDIO_RENDERER : 8192, transmit_chunk_multiplier : 4 };
    var array_render_N_chunk = { BUFF_SIZE_AUDIO_RENDERER : 16384, transmit_chunk_multiplier : 2 };

    BUFF_SIZE_AUDIO_RENDERER  = array_render_N_chunk.BUFF_SIZE_AUDIO_RENDERER;
    transmit_chunk_multiplier = array_render_N_chunk.transmit_chunk_multiplier;

    console.log("BUFF_SIZE_AUDIO_RENDERER " + BUFF_SIZE_AUDIO_RENDERER + 
                "\ntransmit_chunk_multiplier " + transmit_chunk_multiplier);

    // var BUFF_SIZE_AUDIO_RENDERER = 2048;
    // var BUFF_SIZE_AUDIO_RENDERER = 4096;
    // var BUFF_SIZE_AUDIO_RENDERER = 8192;
    // var BUFF_SIZE_AUDIO_RENDERER = 16384;

var browser_queue_max_size      = null; // browser side maximum queue size
var browser_queue_min_threshold = null; // triggers browser from consuming its own queue to reading ww queue

    // var array_min_thr_N_size = { browser_queue_max_size : 4, browser_queue_min_threshold : 2 };// quickest start
    // var array_min_thr_N_size = { browser_queue_max_size : 6, browser_queue_min_threshold : 3 };
    var array_min_thr_N_size = { browser_queue_max_size : 10, browser_queue_min_threshold : 2 };
    // var array_min_thr_N_size = { browser_queue_max_size : 12, browser_queue_min_threshold : 3 };
    // var array_min_thr_N_size = { browser_queue_max_size : 18, browser_queue_min_threshold : 6 };// good
    // var array_min_thr_N_size = { browser_queue_max_size : 24, browser_queue_min_threshold : 6 };
    // var array_min_thr_N_size = { browser_queue_max_size : 28, browser_queue_min_threshold : 8 };// slow start

    browser_queue_max_size       = array_min_thr_N_size.browser_queue_max_size;
    browser_queue_min_threshold  = array_min_thr_N_size.browser_queue_min_threshold;

    stream_audio_msg.transmit_chunksize = BUFF_SIZE_AUDIO_RENDERER * transmit_chunk_multiplier;

    stream_audio_msg.BUFF_SIZE_AUDIO_RENDERER = BUFF_SIZE_AUDIO_RENDERER;


    stream_audio_msg.browser_queue_min_threshold = browser_queue_min_threshold;
    stream_audio_msg.browser_queue_max_size = browser_queue_max_size;
    // stream_audio_msg.ww_queue_max_size = browser_queue_max_size * 2; // integer multiple >= 2
    // stream_audio_msg.ww_queue_max_size = browser_queue_max_size * 4; // integer multiple >= 2
    stream_audio_msg.ww_queue_max_size = browser_queue_max_size * 6; // integer multiple >= 2
    // stream_audio_msg.ww_queue_max_size = browser_queue_max_size * 8; // integer multiple >= 2

    msgs_to_server.mode_stream_audio_to_client = stream_audio_msg;

}	//	populate_launch_stream_audio_msg

function process_ww_directed_mode(received_json) {

    console.log("process_ww_directed_mode");
    console.log(received_json);

    var ww_directed_mode = received_json.ww_directed_mode;

    console.log(ww_directed_mode);

    switch (ww_directed_mode) {

        case "streaming_is_done" : {

            console.log("cool seeing streaming_is_done");

            var max_index = received_json.max_index;

            if (typeof max_index !== "undefined") {

                manage_audio.set_is_streaming_done(max_index);

                if (! manage_audio.get_flag_audio_rendering()) {

                    console.log("flag    manage_audio.get_flag_audio_rendering " +
                                manage_audio.get_flag_audio_rendering());

                    console.log("launch_audio_streaming_done    ===========");

                    manage_audio.launch_audio_streaming_done();
                }

            } else {

                throw new Error("ERROR - seeing streaming_is_done yet not seeing max_index");
            }

            break;
        }

        default : {

            throw new Error("ERROR - invalid ww_directed_mode");
        }
    }
}

ww_handle.onmessage = function(event) {  // handle traffic from ww

    if (event.data instanceof ArrayBuffer) {

        var elapsed = common_utils.seconds(startTime);

        var data_from_ww = event.data;

        var stats_this_launch = {};

        // log('postMessage roundtrip took: ' + (elapsed * 1000) + ' ms');

        stats_this_launch.elapsed = common_utils.seconds(startTime);

        var rate_KB = Math.round(common_utils.toKB(data_from_ww.byteLength) / elapsed);
        // log('postMessage roundtrip rate: ' + rate_KB + ' KB/s');

        stats_this_launch.rate_KB = rate_KB;

        array_stats_for_launch.push(stats_this_launch);

        retrieved_audio_buffer_obj.buffer = new Float32Array(data_from_ww);

        callback_send_audio_to_audio_player(retrieved_audio_buffer_obj, manage_state.is_early_days());

    } else if (typeof event.data === "string") {

        var received_json = JSON.parse(event.data);

        if (typeof received_json.ww_directed_mode !== "undefined") {

            process_ww_directed_mode(received_json);

        } else {

            throw new Error("ERROR - ww is not sending JSON with key ww_directed_mode");
        }

    } else if (event.data instanceof Blob) {

        console.log("Received Blob from ww");

    } else if (event.data.type && event.data.type == 'debug') {

        log(event.data.msg);

        // console.log("Received msg with debug from ww", event.data);

    } else {

        throw new Error("ERROR - received unknown from ww - here is event.data ", event);
    }
};

var media_manager = (function() {

    var all_media = {}; // stens TODO - populate from server supplied list

//       ls -Slr media/  | cut -c25-34,48-999

    // all_media[0] = "Justice_Genesis_first_third_sec_tight.wav"; // its 8 bit not 16 bit like all others here
    // all_media[1] = "sine_wave_32768_64.wav";
    all_media[2] = "sine_wave_32768_128.wav";
    // all_media[3] = "sine_wave_32768_64.wav";
    // all_media[4] = "sine_wave_65536_64.wav";
    all_media[5] = "Lee_Smolin_Physics_Envy_and_Economic_Theory-cWn86ESze6M_mono_1st_few_seconds_trim.wav";
    // all_media[6] = "1_to_11.wav";
    // all_media[7] = "Viola_16_Jay_Haide_a_L_Ancienne_Stradivari-H4ri4jE14cE_4_seconds.wav";
    // all_media[8] = "sine_wave_262144_64.wav";
    // all_media[9] = "Viola_16_Jay_Haide_a_L_Ancienne_Stradivari-H4ri4jE14cE_10_seconds.wav";
    // all_media[10] = "Elephant_sounds_mono_cute_clip_rgUFu_hVhlk.wav";
    // all_media[11] = "Elephant_sounds_mono_clip_rgUFu_hVhlk.wav";
    // all_media[12] = "Die_Antwoord_11_doong_doong_30_sec.wav";
    all_media[13] = "Justice_Genesis_first_30_seconds_tight.wav";
    // all_media[14] = "Glenn_Gould_Partita_No_5_BWV_829_Praeambulum_mono-0YvnW_lMNTM.wav";
    // all_media[15] = "Contrabass_Saxophone_mono_hXBeu7o9uUM.wav";
    all_media[16] = "SHAKUHACHI_Masayuki_Koga_trim_mono-IMi00aV1tdA.wav";
    // all_media[17] = "Justice_Genesis_mono-y6iHYTjEyKU.wav";
    // all_media[17] = "Chopin_Fantasie_Impromptu_opus_66_mono_clip_APQ2RKECMW8.wav";

    return {

        get_media_filename : function(chosen_media) {

            var chosen_media_filename = all_media[chosen_media];

            if (typeof chosen_media_filename === "undefined") {

                throw new Error("ERROR - failed to resolve media filename for chosen_media : " + chosen_media);
            }

            return chosen_media_filename;
        }
    };
}());

var entry_point = (function() {     //      handle traffic from browser UI

	console.log("entry_point");

    var msg_to_ww = {};

    populate_launch_stream_audio_msg(msg_to_ww);

    var mode_stream_audio_to_client = msg_to_ww.mode_stream_audio_to_client;
    var mode_stop_streaming         = msg_to_ww.mode_stop_streaming;

    // shared_utils.show_object(msg_to_ww, "msg_to_ww", "total", 10);

    // shared_utils.show_object(mode_stream_audio_to_client, "mode_stream_audio_to_client", "total", 10);

    console.log("\n\nmsg_to_ww\n\n");
    console.log(msg_to_ww);
    console.log("\n\n");

    msg_to_ww.browser_directed_mode = "setup_stream_audio_from_server";

    shared_utils.show_object(msg_to_ww, "msg_to_ww SEETTUUPP", "total", 10);

    manage_audio.set_BUFF_SIZE_AUDIO_RENDERER(msg_to_ww.mode_stream_audio_to_client.BUFF_SIZE_AUDIO_RENDERER);
    manage_audio.set_queue_min_threshold(msg_to_ww.mode_stream_audio_to_client.browser_queue_min_threshold);
    manage_audio.set_queue_max_size(msg_to_ww.mode_stream_audio_to_client.browser_queue_max_size);

    /*
    msg_to_ww.browser_directed_mode = manage_state.get_state();

    msg_to_ww.mode = msg_to_ww.mode_stream_audio_to_client.mode;
    msg_to_ww.requested_action = msg_to_ww.mode_stream_audio_to_client.requested_action;
    msg_to_ww.requested_source = media_file;
    */

    ww_handle.postMessage(JSON.stringify(msg_to_ww));

    // --------

    var curr_msg_stream = {};
    var curr_msg_stop = null;
    var curr_request_number = null;

	return function(request, chosen_media) {

		switch (request) {

            case "launch_stream_audio" : {

                // ---

                if (typeof chosen_media !== "undefined") {

                } else {

                    throw new Error("ERROR - browser must supply chosen_media");
                }

                var media_file = media_manager.get_media_filename(chosen_media);

                console.log("media_file " + media_file);

                // manage_audio.stop_audio(msg_to_ww);

                // --------- deal with stopping prior run --------- //

                if (curr_msg_stop) {

                    console.log("deal with prior run .... curr_msg_stop");
                    console.log("deal with prior run .... curr_msg_stop");
                    console.log("deal with prior run .... curr_msg_stop");
                    console.log("deal with prior run .... curr_msg_stop");
                    console.log("deal with prior run .... curr_msg_stop");
                    console.log("deal with prior run .... curr_msg_stop");
                    console.log("deal with prior run .... curr_msg_stop");
                    console.log("deal with prior run .... curr_msg_stop");
                    console.log("deal with prior run .... curr_msg_stop");
                    console.log("deal with prior run .... curr_msg_stop");
                    console.log("deal with prior run .... curr_msg_stop");
                    console.log("deal with prior run .... curr_msg_stop");
                    console.log("deal with prior run .... curr_msg_stop");
                    console.log("deal with prior run .... curr_msg_stop");
                    console.log("deal with prior run .... curr_msg_stop");
                }

                // ------ stens TODO identify if we need to issue a stop_audio on current request_number

                curr_request_number = new Date().getTime();

                curr_msg_stop = mode_stop_streaming;
                curr_msg_stop.request_number = curr_request_number;
                curr_msg_stop.requested_source = media_file;

                // ---

                curr_msg_stream = mode_stream_audio_to_client;
                curr_msg_stream.request_number = curr_request_number;
                curr_msg_stream.browser_directed_mode = manage_state.get_state();
                curr_msg_stream.requested_source = media_file;

                console.log("just POPulated requested_source");
                console.log("just POPulated requested_source");
                console.log("just POPulated requested_source");
                console.log("just POPulated requested_source");
                console.log("just POPulated requested_source");
                console.log("just POPulated requested_source");
                console.log("just POPulated requested_source");
                console.log("just POPulated requested_source");
                console.log("just POPulated requested_source");
                console.log("just POPulated requested_source");
                console.log("just POPulated requested_source");
                console.log("just POPulated requested_source");
                console.log("just POPulated requested_source");
                console.log("just POPulated requested_source");
                console.log("just POPulated requested_source");

                console.log("\n\n launch_stream_audio \n\n");
                console.log(curr_msg_stream);
                console.log("\n\n");
                console.log("curr_msg_stream.browser_directed_mode " + curr_msg_stream.browser_directed_mode);
                console.log("                     media_file " + media_file);
                console.log("\n\n");

                startTime = new Date();

                manage_state.set_msg_to_server_by_mode(manage_state.get_state(), curr_msg_stream);

                var returned_msg = manage_state.get_msg_to_server_by_mode(manage_state.get_state());

                shared_utils.show_object(returned_msg, "returned_msg uuu uuu uuu uuu uuu", "total", 10);

                shared_utils.show_object(curr_msg_stream, "curr_msg_stream MMMMMMMMMMMMMMMMM", "total", 10);

                ww_handle.postMessage(JSON.stringify(curr_msg_stream));

                break;
            }

            case "stop_audio" : {

                shared_utils.show_object(curr_msg_stop, "curr_msg_stop pp pp pp pp pp p", "total", 10);

                manage_audio.stop_audio(curr_msg_stop);

                break;
            }

			default : {

				throw new Error("ERROR - invalid request sent to entry_point : ", request);
			}
		}
	};

}());

return {

	entry_point : entry_point
};

}());	//	client_entry