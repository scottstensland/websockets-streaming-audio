const render_streaming_web_audio = () => {
    "use strict";

    let audio_context;
    let gain_node;
    let analyser_node;
    let streaming_node;
    let BUFF_SIZE_AUDIO_RENDERER = null;
    let cb_request_another_buffer = null;
    let cb_send_audio_to_server = null;
    let cb_get_is_streaming_done = null;

    const streaming_status_ready = "streaming_status_ready";
    const streaming_status_active = "streaming_status_active";
    const streaming_status_done = "streaming_status_done";
    let flag_streaming_status = streaming_status_ready;

    const console = (() => {
        function getScriptName() {
            const error = new Error();
            let source = null;
            const lastStackFrameRegex = new RegExp(/.+\/(.*?):\d+(:\d+)*$/);
            const currentStackFrameRegex = new RegExp(/getScriptName \(.+\/(.*):\d+:\d+\)/);

            if ((source = lastStackFrameRegex.exec(error.stack.trim())) && source[1] !== "")
                return source[1];
            else if ((source = currentStackFrameRegex.exec(error.stack.trim())))
                return source[1];
            else if (error.fileName !== undefined)
                return error.fileName;
        }

        return {
            log: (given_str) => {
                common_utils.log(getScriptName() + " " + common_utils.source() + given_str);
            }
        };
    })();

    const init_web_audio = (() => {
        if (typeof audio_context !== "undefined") {
            return;
        }

        try {
            window.AudioContext = window.AudioContext ||
                                  window.webkitAudioContext ||
                                  window.mozAudioContext ||
                                  window.oAudioContext ||
                                  window.msAudioContext;

            audio_context = new AudioContext();
        } catch (e) {
            const error_msg = "Web Audio API is not supported by this browser\n ... http://caniuse.com/#feat=audio-api";
            console.log(error_msg);
            alert(error_msg);
            throw new Error(error_msg);
        }

        gain_node = audio_context.createGain();
        analyser_node = audio_context.createAnalyser();
        analyser_node.fftSize = 256;

        gain_node.connect(analyser_node);
        analyser_node.connect(audio_context.destination);
    })();

    function setup_onaudioprocess_callback_stream(given_node, cb_populate_memory_chunk, given_buff_size, given_num_channels) {
        console.log("TOP setup_onaudioprocess_callback_stream");

        const internal_audio_buffer_obj = {};
        const buff_size_audio_renderer = given_buff_size;
        let aggregate_buffer_index = 0;
        let stop_next_event_loop_iteration = false;

        given_node.onaudioprocess = (() => {
            return (event) => {
                queue_first_in_first_out.set_flag_audio_rendering(true);

                if (stop_next_event_loop_iteration || queue_first_in_first_out.get_request_stop()) {
                    console.log("stop event loop");
                    stop_audio();
                    return;
                }

                aggregate_buffer_index += buff_size_audio_renderer;

                const max_index = queue_first_in_first_out.get_max_index();

                if (max_index && (aggregate_buffer_index > max_index)) {
                    console.log("reached end of audio streaming");
                    stop_next_event_loop_iteration = true;
                }

                for (let curr_channel = 0; curr_channel < given_num_channels; curr_channel++) {
                    internal_audio_buffer_obj[curr_channel] = event.outputBuffer.getChannelData(curr_channel);
                }

                cb_populate_memory_chunk(internal_audio_buffer_obj, given_num_channels);
                cb_request_another_buffer("Middleburg");
            };
        })();
    }

    const manage_media_headers = (() => {
        let headers_obj = null;

        return {
            set_values: (received_headers_info_json) => {
                headers_obj = received_headers_info_json;
            },
            get_value: (given_property) => {
                if (headers_obj && typeof headers_obj[given_property] !== "undefined") {
                    return headers_obj[given_property];
                } else {
                    throw new Error("ERROR - failed to find headers property : " + given_property);
                }
            }
        };
    })();

    const queue_first_in_first_out = (() => {
        const audio_from_server_obj = {};
        let push_index = 0;
        let pop_index = 0;
        let browser_queue_max_size = 4;
        let browser_queue_min_threshold = 2;
        let cb_browser_queue_is_full = null;
        let cb_browser_queue_min_reached = null;
        let curr_browser_queue_size = 0;

        let flag_index_is_rising = true;
        let flag_request_stop = false;
        let flag_audio_rendering = false;
        let max_index = null;

        return {
            is_production_possible: () => {
                const curr_size_queue = push_index - pop_index;
                const answer = (curr_size_queue < browser_queue_max_size);

                if (flag_index_is_rising && curr_size_queue >= browser_queue_max_size) {
                    flag_index_is_rising = false;
                    cb_browser_queue_is_full();
                }

                return answer;
            },
            push: (given_audio_obj_from_server) => {
                let num_channels = 2;
                try {
                    num_channels = manage_media_headers.get_value("num_channels");
                } catch (e) {
                    // Fallback to stereo default
                }
                const chunk_size = BUFF_SIZE_AUDIO_RENDERER * num_channels;
                const size_buffer_available = given_audio_obj_from_server.buffer.length;
                let offset_index = 0;

                while (size_buffer_available > offset_index) {
                    const array_buffer = new ArrayBuffer(chunk_size * Float32Array.BYTES_PER_ELEMENT);
                    const float_array = new Float32Array(array_buffer);

                    for (let i = 0; i < chunk_size; i++) {
                        float_array[i] = given_audio_obj_from_server.buffer[i + offset_index];
                    }

                    audio_from_server_obj[push_index] = float_array;
                    push_index += 1;
                    offset_index += chunk_size;
                    curr_browser_queue_size += 1;
                }
            },
            is_pop_possible: () => {
                const curr_size_queue = push_index - pop_index;

                if ((!flag_index_is_rising) && curr_size_queue <= browser_queue_min_threshold) {
                    flag_index_is_rising = true;
                    cb_browser_queue_min_reached();
                }

                return (pop_index < push_index && flag_streaming_status !== streaming_status_done);
            },
            pop: () => {
                if (pop_index > 0) {
                    delete audio_from_server_obj[pop_index - 1];
                }

                if (pop_index < push_index) {
                    curr_browser_queue_size -= 1;
                    return audio_from_server_obj[pop_index++];
                } else {
                    throw new Error("ERROR - queue_first_in_first_out is EMPTY");
                }
            },
            set_browser_queue_min_threshold: (given_minimum_threshold) => {
                browser_queue_min_threshold = given_minimum_threshold;
            },
            set_browser_queue_max_size: (given_maximum_queue_size) => {
                browser_queue_max_size = given_maximum_queue_size;
            },
            set_cb_browser_queue_is_full: (given_callback) => {
                cb_browser_queue_is_full = given_callback;
            },
            set_cb_browser_queue_min_reached: (given_callback) => {
                cb_browser_queue_min_reached = given_callback;
            },
            set_max_index: (given_max_index) => {
                max_index = given_max_index;
            },
            get_max_index: () => {
                return max_index;
            },
            set_request_stop: () => {
                flag_request_stop = true;
                console.log("set_request_stop flag_request_stop " + flag_request_stop);
            },
            get_request_stop: () => {
                return flag_request_stop;
            },
            set_flag_audio_rendering: (val) => {
                flag_audio_rendering = val;
            },
            get_flag_audio_rendering: () => {
                return flag_audio_rendering;
            },
            get_queue_size: () => {
                return Math.max(0, push_index - pop_index);
            },
            get_max_size: () => {
                return browser_queue_max_size;
            },
            reset_queue: () => {
                push_index = 0;
                pop_index = 0;
                curr_browser_queue_size = 0;
                flag_index_is_rising = true;
                flag_request_stop = false;
                flag_audio_rendering = false;
                max_index = null;
                for (const key of Object.keys(audio_from_server_obj)) {
                    delete audio_from_server_obj[key];
                }
            }
        };
    })();

    const set_BUFF_SIZE_AUDIO_RENDERER = (given_buff_size) => {
        BUFF_SIZE_AUDIO_RENDERER = given_buff_size;
    };

    const get_another_buffer = (() => {
        return (given_audio_obj, num_channels) => {
            if (queue_first_in_first_out.is_pop_possible()) {
                const audio_obj_from_queue = queue_first_in_first_out.pop();

                if (typeof audio_obj_from_queue === "undefined") {
                    throw new Error("ERROR - in get_another_buffer seeing undefined audio_obj_from_queue");
                }

                const size_buff = audio_obj_from_queue.length;
                let curr_channel = 0;

                for (let i = 0; i < size_buff; i++) {
                    const output_index = Math.floor(i / num_channels);
                    given_audio_obj[curr_channel][output_index] = audio_obj_from_queue[i];

                    curr_channel += 1;
                    if (curr_channel === num_channels) {
                        curr_channel = 0;
                    }
                }
            }
        };
    })();

    const set_cb_request_another_buffer = (given_callback) => {
        cb_request_another_buffer = given_callback;
    };

    const set_send_audio_to_server = (send_audio_to_server) => {
        cb_send_audio_to_server = send_audio_to_server;
    };

    const output_stored_media_as_downloaded_file = () => {
        if (cb_send_audio_to_server) {
            cb_send_audio_to_server();
        }
    };

    const stop_audio = () => {
        if (streaming_node) {
            streaming_node.disconnect(gain_node);
            streaming_node.onaudioprocess = null;
            streaming_node = null;
        }

        console.log('stop_audio ... just called disconnect');
        flag_streaming_status = streaming_status_ready;
        queue_first_in_first_out.set_flag_audio_rendering(false);

        output_stored_media_as_downloaded_file();
    };

    const process_audio_buffer = () => {
        if (audio_context && audio_context.state === "suspended") {
            audio_context.resume().then(() => {
                console.log('Playback resumed successfully');
            });
        }

        if (!queue_first_in_first_out.get_flag_audio_rendering() && 
            (!queue_first_in_first_out.is_production_possible() || cb_get_is_streaming_done())) {

            queue_first_in_first_out.set_flag_audio_rendering(true);
            const num_channels = manage_media_headers.get_value("num_channels");

            streaming_node = audio_context.createScriptProcessor(BUFF_SIZE_AUDIO_RENDERER, num_channels, num_channels);

            console.log("BUFF_SIZE_AUDIO_RENDERER ", BUFF_SIZE_AUDIO_RENDERER);
            console.log("OOOOOOOOOOOOOOOONNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN activating gain_node");

            streaming_node.connect(gain_node);
            flag_streaming_status = streaming_status_active;

            setup_onaudioprocess_callback_stream(streaming_node, get_another_buffer, BUFF_SIZE_AUDIO_RENDERER, num_channels);
        } else {
            cb_request_another_buffer("early_days");
        }
    };

    const set_cb_is_streaming_done = (given_callback) => {
        cb_get_is_streaming_done = given_callback;
    };

    const cb_send_buffer_to_web_audio_player = (given_audio_obj, flag_early_or_not) => {
        queue_first_in_first_out.push(given_audio_obj);

        if (flag_early_or_not) {
            process_audio_buffer();
        }
    };

    const get_frequency_data = () => {
        if (!analyser_node) return null;
        const dataArray = new Uint8Array(analyser_node.frequencyBinCount);
        analyser_node.getByteFrequencyData(dataArray);
        return dataArray;
    };

    const get_waveform_data = () => {
        if (!analyser_node) return null;
        const dataArray = new Uint8Array(analyser_node.frequencyBinCount);
        analyser_node.getByteTimeDomainData(dataArray);
        return dataArray;
    };

    const set_volume = (value) => {
        if (gain_node) {
            gain_node.gain.setValueAtTime(value, audio_context.currentTime);
        }
    };

    return {
        cb_send_buffer_to_web_audio_player,
        queue_first_in_first_out,
        set_BUFF_SIZE_AUDIO_RENDERER,
        set_cb_request_another_buffer,
        set_cb_is_streaming_done,
        set_send_audio_to_server,
        process_audio_buffer,
        manage_media_headers,
        get_frequency_data,
        get_waveform_data,
        set_volume,
        stop_audio,
        resume_context: () => {
            if (audio_context) {
                audio_context.resume();
            }
        }
    };
};
