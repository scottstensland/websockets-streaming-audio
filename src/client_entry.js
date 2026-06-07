const client_entry = (() => {
    "use strict";

    window.onerror = (message, url, lineNumber) => {  
        const err_msg = `\nERROR - ${message}\nURL ${url}\nlineNumber ${lineNumber}`;
        console.log(err_msg);
        return true;
    }; 

    let ww_handle = null;
    try {
        ww_handle = new Worker("ww_transferable_obj.js");
    } catch(err_event) {
        console.error("ERROR - failed to create Web Worker : " + err_event);
    }

    let callback_send_audio_to_audio_player = null;
    let startTime = 0;
    let current_worker_queue_size = 0;
    let max_worker_queue_size = 0;
    let available_tracks = [];

    // Callbacks for UI updates
    let on_queue_update_cb = null;
    let on_tracks_loaded_cb = null;
    let on_state_change_cb = null;
    let on_header_cb = null;

    const manage_state = (() => {
        const mode_browser_get_audio_from_server = "browser_get_audio_from_server";
        const mode_ww_get_audio_from_server = "ww_get_audio_from_server";
        const mode_browser_get_audio_from_ww = "browser_get_audio_from_ww";

        let current_browser_mode = mode_browser_get_audio_from_server;
        const msgs_to_server_by_mode = {};

        const notify_state_change = () => {
            if (on_state_change_cb) {
                on_state_change_cb(current_browser_mode);
            }
        };

        return {
            get_state: () => current_browser_mode,
            reset_state: () => {
                current_browser_mode = mode_browser_get_audio_from_server;
                notify_state_change();
            },
            set_browser_queue_filled: () => {
                if (current_browser_mode === mode_browser_get_audio_from_server ||
                    current_browser_mode === mode_browser_get_audio_from_ww) {

                    if (manage_audio.get_is_streaming_done()) {
                        console.log("Already reached end of source media AND worker queue should be empty");
                    } else {
                        current_browser_mode = mode_ww_get_audio_from_server;
                        console.log("new state " + current_browser_mode);
                        notify_state_change();
                        ww_handle.postMessage(JSON.stringify(msgs_to_server_by_mode[mode_ww_get_audio_from_server]));
                    }
                }
            },
            set_browser_queue_min_threshold_reached: () => {
                console.log("TOP browser_queue_min_threshold_reached");
                if (current_browser_mode === mode_ww_get_audio_from_server) {
                    current_browser_mode = mode_browser_get_audio_from_ww;
                    console.log("new state " + current_browser_mode);
                    notify_state_change();
                    ww_handle.postMessage(JSON.stringify(msgs_to_server_by_mode[mode_browser_get_audio_from_ww]));
                }
            },
            is_early_days: () => (current_browser_mode === mode_browser_get_audio_from_server),
            request_another_buffer: () => {
                if (current_browser_mode !== mode_ww_get_audio_from_server) {
                    const returned_msg = manage_state.get_msg_to_server_by_mode(current_browser_mode);
                    ww_handle.postMessage(JSON.stringify(returned_msg));
                }
            },
            set_msg_to_server_by_mode: (given_mode, given_msg) => {
                msgs_to_server_by_mode[mode_browser_get_audio_from_server] = given_msg;
                msgs_to_server_by_mode[mode_ww_get_audio_from_server] = {};
                msgs_to_server_by_mode[mode_browser_get_audio_from_ww] = {};

                const arr_other_modes = [mode_ww_get_audio_from_server, mode_browser_get_audio_from_ww];

                for (const mode of arr_other_modes) {
                    for (const curr_property of Object.keys(given_msg)) {
                        msgs_to_server_by_mode[mode][curr_property] = given_msg[curr_property];
                    }
                }

                msgs_to_server_by_mode[mode_ww_get_audio_from_server].browser_directed_mode = mode_ww_get_audio_from_server;
                msgs_to_server_by_mode[mode_browser_get_audio_from_ww].browser_directed_mode = mode_browser_get_audio_from_ww;
            },
            get_msg_to_server_by_mode: (given_mode) => msgs_to_server_by_mode[given_mode]
        };
    })();

    const browser_queue_is_full_callback = () => {
        manage_state.set_browser_queue_filled();
    };

    const cb_browser_queue_min_reached = () => {
        manage_state.set_browser_queue_min_threshold_reached();
    };

    const cb_request_another_buffer = (given_source) => {
        if (on_queue_update_cb) {
            on_queue_update_cb(get_queues_status());
        }

        if (((given_source === "early_days" || given_source === "Middleburg") && 
             manage_audio.get_is_production_possible()) || given_source === "tell_ww_to_refill") {
            manage_state.request_another_buffer();
        }
    };

    const cb_get_is_streaming_done = () => manage_audio.get_is_streaming_done();

    const output_stored_media = () => {
        send_audio_to_server.output_media();
    };

    const manage_audio = (() => {
        const web_audio_obj = Object.create(render_streaming_web_audio());

        callback_send_audio_to_audio_player = web_audio_obj.cb_send_buffer_to_web_audio_player;

        web_audio_obj.set_cb_request_another_buffer(cb_request_another_buffer);
        web_audio_obj.queue_first_in_first_out.set_cb_browser_queue_is_full(browser_queue_is_full_callback);
        web_audio_obj.queue_first_in_first_out.set_cb_browser_queue_min_reached(cb_browser_queue_min_reached);
        web_audio_obj.set_cb_is_streaming_done(cb_get_is_streaming_done);
        web_audio_obj.set_send_audio_to_server(output_stored_media);

        let streaming_is_done = false;

        return {
            set_header_info: (given_headers_obj) => {
                web_audio_obj.manage_media_headers.set_values(given_headers_obj);
            },
            set_BUFF_SIZE_AUDIO_RENDERER: (given_buff_size) => {
                web_audio_obj.set_BUFF_SIZE_AUDIO_RENDERER(given_buff_size);
            },
            set_queue_min_threshold: (given_min_threshold) => {
                web_audio_obj.queue_first_in_first_out.set_browser_queue_min_threshold(given_min_threshold);
            },
            set_queue_max_size: (given_max_size) => {
                web_audio_obj.queue_first_in_first_out.set_browser_queue_max_size(given_max_size);			
            },
            stop_audio: (given_msg_to_ww) => {
                console.log("stop_audio trigger");
                if (given_msg_to_ww) {
                    given_msg_to_ww.browser_directed_mode = "mode_stop_streaming";
                    ww_handle.postMessage(JSON.stringify(given_msg_to_ww));
                }
                web_audio_obj.queue_first_in_first_out.set_request_stop();
                web_audio_obj.stop_audio();
                manage_state.reset_state();
            },
            get_is_production_possible: () => web_audio_obj.queue_first_in_first_out.is_production_possible(),
            set_is_streaming_done: (given_max_index) => {
                streaming_is_done = true;
                web_audio_obj.queue_first_in_first_out.set_max_index(given_max_index);
            },
            get_is_streaming_done: () => streaming_is_done,
            get_flag_audio_rendering: () => web_audio_obj.queue_first_in_first_out.get_flag_audio_rendering(),
            launch_audio_streaming_done: () => {
                web_audio_obj.process_audio_buffer();
            },
            get_browser_queue_size: () => web_audio_obj.queue_first_in_first_out.get_queue_size(),
            get_browser_queue_max: () => web_audio_obj.queue_first_in_first_out.get_max_size(),
            reset_queue: () => {
                streaming_is_done = false;
                web_audio_obj.queue_first_in_first_out.reset_queue();
            },
            set_volume: (val) => web_audio_obj.set_volume(val),
            get_frequency_data: () => web_audio_obj.get_frequency_data(),
            get_waveform_data: () => web_audio_obj.get_waveform_data(),
            resume_context: () => web_audio_obj.resume_context()
        };
    })();

    const populate_launch_stream_audio_msg = (msgs_to_server) => {
        const stop_streaming_msg = {
            mode: "mode_stop_streaming",
            requested_action: "stop_streaming"
        };
        msgs_to_server.mode_stop_streaming = stop_streaming_msg;

        const stream_audio_msg = {
            mode: "mode_stream_audio",
            requested_action: "stream_audio_to_client"
        };

        const BUFF_SIZE_AUDIO_RENDERER = 16384;
        const transmit_chunk_multiplier = 2;
        const browser_queue_max_size = 10;
        const browser_queue_min_threshold = 6;

        stream_audio_msg.transmit_chunksize = BUFF_SIZE_AUDIO_RENDERER * transmit_chunk_multiplier;
        stream_audio_msg.BUFF_SIZE_AUDIO_RENDERER = BUFF_SIZE_AUDIO_RENDERER;
        stream_audio_msg.browser_queue_min_threshold = browser_queue_min_threshold;
        stream_audio_msg.browser_queue_max_size = browser_queue_max_size;
        stream_audio_msg.ww_queue_max_size = browser_queue_max_size * 4;

        msgs_to_server.mode_stream_audio_to_client = stream_audio_msg;
    };

    const process_file_headers = (received_json) => {
        manage_audio.set_header_info(received_json);
        if (on_header_cb) {
            on_header_cb(received_json);
        }
    };

    const process_ww_directed_mode = (received_json) => {
        const ww_directed_mode = received_json.ww_directed_mode;

        switch (ww_directed_mode) {
            case "streaming_is_done":
                console.log("seeing streaming_is_done");
                const max_index = received_json.max_index;
                if (typeof max_index !== "undefined") {
                    manage_audio.set_is_streaming_done(max_index);
                    if (!manage_audio.get_flag_audio_rendering()) {
                        manage_audio.launch_audio_streaming_done();
                    }
                }
                break;
            default:
                throw new Error("ERROR - invalid ww_directed_mode");
        }
    };

    const send_audio_to_server = (() => {
        const array_this_media = [];

        return {
            store_this_buffer: (retrieved_audio_buffer_obj) => {
                array_this_media.push(retrieved_audio_buffer_obj);
            },
            output_media: () => {
                console.log("Audio download trigger, elements: " + array_this_media.length);
            }
        };
    })();

    ww_handle.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
            const elapsed = (new Date() - startTime) / 1000.0;
            const data_from_ww = event.data;

            const rate_KB = Math.round((data_from_ww.byteLength / 1024) / elapsed);

            const retrieved_audio_buffer_obj = {
                buffer: new Float32Array(data_from_ww)
            };

            callback_send_audio_to_audio_player(retrieved_audio_buffer_obj, manage_state.is_early_days());
            send_audio_to_server.store_this_buffer(retrieved_audio_buffer_obj);

            if (on_queue_update_cb) {
                on_queue_update_cb(get_queues_status());
            }

            if (manage_state.get_state() === "browser_get_audio_from_ww" && manage_audio.get_is_production_possible()) {
                manage_state.request_another_buffer();
            }

        } else if (typeof event.data === "string") {
            const received_json = JSON.parse(event.data);

            if (received_json.ww_directed_mode === "queue_status") {
                current_worker_queue_size = received_json.curr_size_ww_queue;
                max_worker_queue_size = received_json.max_size_ww_queue;
                if (on_queue_update_cb) {
                    on_queue_update_cb(get_queues_status());
                }
            } else if (typeof received_json.ww_directed_mode !== "undefined") {
                process_ww_directed_mode(received_json);
            } else if (typeof received_json.sample_rate !== "undefined") {
                process_file_headers(received_json);
            }
        }
    };

    const get_queues_status = () => {
        return {
            browser_queue_size: manage_audio.get_browser_queue_size(),
            browser_queue_max: manage_audio.get_browser_queue_max(),
            worker_queue_size: current_worker_queue_size,
            worker_queue_max: max_worker_queue_size,
            current_mode: manage_state.get_state(),
            streaming_done: manage_audio.get_is_streaming_done()
        };
    };

    // Initialize Web Worker configuration on page load
    const msg_to_ww = {};
    populate_launch_stream_audio_msg(msg_to_ww);
    const mode_stream_audio_to_client = msg_to_ww.mode_stream_audio_to_client;
    const mode_stop_streaming = msg_to_ww.mode_stop_streaming;

    msg_to_ww.browser_directed_mode = "setup_stream_audio_from_server";
    manage_audio.set_BUFF_SIZE_AUDIO_RENDERER(msg_to_ww.mode_stream_audio_to_client.BUFF_SIZE_AUDIO_RENDERER);
    manage_audio.set_queue_min_threshold(msg_to_ww.mode_stream_audio_to_client.browser_queue_min_threshold);
    manage_audio.set_queue_max_size(msg_to_ww.mode_stream_audio_to_client.browser_queue_max_size);

    ww_handle.postMessage(JSON.stringify(msg_to_ww));

    let curr_msg_stream = {};
    let curr_msg_stop = null;
    let curr_request_number = null;

    const playTrack = (media_file) => {
        // Stop any active playing stream and disconnect nodes
        stopTrack();

        // Explicitly reset the state machine back to Mode 1 (Preload browser queue)
        manage_state.reset_state();

        // Reset the browser's own audio queue
        manage_audio.reset_queue();

        curr_request_number = new Date().getTime();

        curr_msg_stop = { ...mode_stop_streaming };
        curr_msg_stop.request_number = curr_request_number;
        curr_msg_stop.requested_source = media_file;

        curr_msg_stream = { ...mode_stream_audio_to_client };
        curr_msg_stream.request_number = curr_request_number;
        curr_msg_stream.browser_directed_mode = manage_state.get_state();
        curr_msg_stream.requested_source = media_file;

        // Re-setup the web worker queues and WebSocket state for the new track session
        const setup_msg = {
            browser_directed_mode: "setup_stream_audio_from_server",
            mode_stream_audio_to_client: curr_msg_stream,
            mode_stop_streaming: curr_msg_stop
        };
        ww_handle.postMessage(JSON.stringify(setup_msg));

        startTime = new Date();
        manage_state.set_msg_to_server_by_mode(manage_state.get_state(), curr_msg_stream);

        // Request worker to start streaming this source
        ww_handle.postMessage(JSON.stringify(curr_msg_stream));
    };

    const stopTrack = () => {
        manage_audio.stop_audio(curr_msg_stop);
    };

    const fetchTracks = async () => {
        try {
            const res = await fetch("/api/media");
            available_tracks = await res.json();
            if (on_tracks_loaded_cb) {
                on_tracks_loaded_cb(available_tracks);
            }
        } catch (e) {
            console.error("Error loading playlist: ", e);
        }
    };

    return {
        fetchTracks,
        playTrack,
        stopTrack,
        setVolume: (val) => manage_audio.set_volume(val),
        getFrequencyData: () => manage_audio.get_frequency_data(),
        getWaveformData: () => manage_audio.get_waveform_data(),
        getQueuesStatus: get_queues_status,
        registerOnQueueUpdate: (cb) => { on_queue_update_cb = cb; },
        registerOnTracksLoaded: (cb) => { on_tracks_loaded_cb = cb; },
        registerOnStateChange: (cb) => { on_state_change_cb = cb; },
        registerOnHeader: (cb) => { on_header_cb = cb; }
    };
})();
