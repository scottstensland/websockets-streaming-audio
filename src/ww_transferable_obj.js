importScripts('common_utils.js');
importScripts('shared_utils.js');
importScripts('ww_client_socket.js');

const send_console_to_browser = (() => {
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
            const log_object = {
                type: 'debug',
                msg: common_utils.source() + given_str,
                script_name: getScriptName()
            };
            self.postMessage(log_object);
        }
    };
})();

const manage_buffer_processing = (() => {
    let curr_mode_send_to_browser_or_ww = null;

    return {
        set_mode: (given_mode) => {
            curr_mode_send_to_browser_or_ww = given_mode;
        },
        get_mode: () => {
            return curr_mode_send_to_browser_or_ww;
        }
    };
})();

const send_to_ww_queue = (given_audio_obj_from_server) => {
    const curr_buffer_obj = {};
    curr_buffer_obj.buffer = new Float32Array(given_audio_obj_from_server.buffer);

    queue_first_in_first_out.push(curr_buffer_obj);

    if (queue_first_in_first_out.is_production_possible()) {
        const msgs_to_server = manage_message.get_msg().mode_stream_audio_to_client;
        ww_client_socket.socket_client(msgs_to_server);
    }
};

const send_to_browser_queue = (given_audio_obj) => {
    const float_array = new Float32Array(given_audio_obj.buffer);
    self.postMessage(float_array.buffer, [float_array.buffer]);
};

const cb_receive_buffer_from_server = (given_audio_obj_from_server) => {
    const curr_mode = manage_buffer_processing.get_mode();

    switch (curr_mode) {
        case "ww_get_audio_from_server":
        case "browser_get_audio_from_ww":
            send_to_ww_queue(given_audio_obj_from_server);
            break;

        case "browser_get_audio_from_server":
            send_to_browser_queue(given_audio_obj_from_server);
            break;

        default:
            throw new Error("ERROR - invalid cb for buffer from server: " + curr_mode);
    }
};

const cb_send_file_header = (given_json_obj) => {
    self.postMessage(JSON.stringify(given_json_obj));
};

const cb_stream_is_complete = (given_max_index) => {
    send_console_to_browser.log("cb_stream_is_complete ... given_max_index " + given_max_index);

    queue_first_in_first_out.set_max_index(given_max_index);
    queue_first_in_first_out.set_streaming_is_done();

    self.postMessage(JSON.stringify({
        ww_directed_mode: "streaming_is_done",
        max_index: given_max_index
    }));
};

const queue_first_in_first_out = (() => {
    const queue_first_in_first_out_obj = {};
    let push_index = 0;
    let pop_index = 0;
    let curr_size_ww_queue = 0;
    let max_size_ww_queue = null;

    let streaming_is_done = false;
    let max_index = null;

    const report_queue_status = () => {
        self.postMessage(JSON.stringify({
            ww_directed_mode: "queue_status",
            curr_size_ww_queue: curr_size_ww_queue,
            max_size_ww_queue: max_size_ww_queue
        }));
    };

    return {
        is_production_possible: () => {
            return (curr_size_ww_queue < max_size_ww_queue);
        },
        push: (given_audio_obj_from_server) => {
            queue_first_in_first_out_obj[push_index] = given_audio_obj_from_server;
            push_index += 1;
            curr_size_ww_queue += 1;
            report_queue_status();
        },
        is_consumption_possible: () => {
            return (curr_size_ww_queue > 0);
        },
        pop: () => {
            if (!queue_first_in_first_out.is_consumption_possible()) {
                throw new Error("ERROR - called pop when consumption is NOT possible");
            }

            if (pop_index > 0) {
                delete queue_first_in_first_out_obj[pop_index - 1];
            }

            if (pop_index < push_index) {
                curr_size_ww_queue -= 1;
                console.log("WW queue  " + curr_size_ww_queue);
                const popped = queue_first_in_first_out_obj[pop_index++];
                report_queue_status();
                return popped;
            }
        },
        set_max_size_ww_queue: (given_max_size_ww_queue) => {
            max_size_ww_queue = given_max_size_ww_queue;
            console.log("set_max_size_ww_queue max_size_ww_queue ", max_size_ww_queue);
            report_queue_status();
        },
        set_max_index: (given_max_index) => {
            max_index = given_max_index;
        },
        set_streaming_is_done: () => {
            streaming_is_done = true;
        },
        get_streaming_is_done: () => {
            return streaming_is_done;
        },
        reset_queue: () => {
            push_index = 0;
            pop_index = 0;
            curr_size_ww_queue = 0;
            streaming_is_done = false;
            max_index = null;
            for (const key of Object.keys(queue_first_in_first_out_obj)) {
                delete queue_first_in_first_out_obj[key];
            }
            report_queue_status();
        }
    };
})();

const manage_message = (() => {
    let msgs_to_server = null;

    return {
        set_msg: (given_msgs_to_server) => {
            msgs_to_server = given_msgs_to_server;
        },
        get_msg: () => {
            return msgs_to_server;
        }
    };
})();

const setup_stream_audio_from_server = (msgs_to_server) => {
    manage_message.set_msg(msgs_to_server);

    ww_client_socket.set_cb_for_client(cb_receive_buffer_from_server);
    ww_client_socket.set_stream_is_complete_cb(cb_stream_is_complete);
    ww_client_socket.set_send_file_header_cb(cb_send_file_header);

    queue_first_in_first_out.reset_queue();
    queue_first_in_first_out.set_max_size_ww_queue(msgs_to_server.mode_stream_audio_to_client.ww_queue_max_size);
};

const drain_ww_queue_send_to_browser = () => {
    if (!queue_first_in_first_out.is_consumption_possible()) {
        if (queue_first_in_first_out.get_streaming_is_done()) {
            console.log("streaming_is_done and ww queue is empty so just return");
            return;
        }
        return;
    }
    send_to_browser_queue(queue_first_in_first_out.pop());
};

self.onmessage = (event) => {
    if (typeof event.data === "string") {
        const received_json = JSON.parse(event.data);

        if (typeof received_json.browser_directed_mode !== "undefined") {
            switch (received_json.browser_directed_mode) {
                case "browser_get_audio_from_ww":
                    manage_buffer_processing.set_mode(received_json.browser_directed_mode);
                    drain_ww_queue_send_to_browser();
                    break;

                case "ww_get_audio_from_server":
                    manage_buffer_processing.set_mode(received_json.browser_directed_mode);
                    if (queue_first_in_first_out.is_production_possible()) {
                        ww_client_socket.socket_client(received_json);
                    }
                    break;

                case "browser_get_audio_from_server": {
                    manage_buffer_processing.set_mode(received_json.browser_directed_mode);

                    const msgs_to_server = manage_message.get_msg();
                    const specific_mode_stream = msgs_to_server.mode_stream_audio_to_client;
                    const specific_mode_stop = msgs_to_server.mode_stop_streaming;

                    specific_mode_stream.request_number = received_json.request_number;
                    specific_mode_stream.requested_source = received_json.requested_source;

                    specific_mode_stop.request_number = received_json.request_number;
                    specific_mode_stop.requested_source = received_json.requested_source;

                    msgs_to_server.mode_stream_audio_to_client = specific_mode_stream;
                    msgs_to_server.mode_stop_streaming = specific_mode_stop;

                    manage_message.set_msg(msgs_to_server);
                    ww_client_socket.socket_client(received_json);
                    break;
                }

                case "setup_stream_audio_from_server":
                    setup_stream_audio_from_server(received_json);
                    break;

                case "mode_stop_streaming":
                    console.log("momomomomomomomomomomo mode_stop_streaming");
                    ww_client_socket.socket_client(manage_message.get_msg().mode_stop_streaming);
                    queue_first_in_first_out.reset_queue();
                    manage_buffer_processing.set_mode("browser_get_audio_from_server");
                    break;

                default:
                    send_console_to_browser.log("ERROR - invalid browser_directed_mode : " + received_json.browser_directed_mode);
            }
        } else {
            send_console_to_browser.log("ERROR - ww did receive string from browser ... yet NOT seeing browser_directed_mode");
        }
    } else {
        send_console_to_browser.log("ERROR - ww received NON string from browser ... maybe event.data instanceof ArrayBuffer ");
    }
};
