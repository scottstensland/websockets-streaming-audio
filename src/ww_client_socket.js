const ww_client_socket = (() => {
    "use strict";

    let cb_for_client = null;
    let cb_stream_is_complete = null;
    let cb_send_file_header = null;

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

    const websocket_connection = (() => {
        let web_socket = null;
        let flag_connected = false;
        const server_side_buffer_obj = {};

        const MAX_CONN_RETRY = 1000;
        let counter_retry_connection = 0;
        let retry_delay_time = 5;

        let flag_connection_active = true;

        if (!("WebSocket" in self)) {
            send_console_to_browser.log("ERROR - websockets is not available on this browser");
            return;
        }

        send_console_to_browser.log("very cool web sockets are supported by your browser");

        const wsProto = self.location.protocol === 'https:' ? 'wss:' : 'ws:';
        web_socket = new WebSocket(`${wsProto}//${self.location.host}/`);
        web_socket.binaryType = "arraybuffer";

        web_socket.onconnection = (stream) => {
            console.log('WebSocket connect');
        };

        web_socket.onconnected = (stream) => {
            console.log('someone connected!');
        };

        web_socket.onmessage = (event) => {
            if (typeof event.data === "string") {
                const received_json = JSON.parse(event.data);

                if (typeof received_json.streaming_is_done !== "undefined") {
                    if ("yes" === received_json.streaming_is_done) {
                        const local_max_index = received_json.max_index;
                        console.log("OK received_json.streaming_is_done == yes local_max_index ", local_max_index);
                        cb_stream_is_complete(local_max_index);
                    }
                } else if (typeof received_json.error_msg !== "undefined") {
                    console.log(received_json);
                    const error_msg = received_json.error_msg;
                    const requested_source = received_json.requested_source;
                    send_console_to_browser.log(error_msg + "  " + requested_source);
                } else if (typeof received_json.sample_rate !== "undefined") {
                    cb_send_file_header(received_json);
                } else if (typeof received_json.max_index !== "undefined") {
                    console.log(received_json);
                } else if (typeof received_json.rss !== "undefined") {
                    // update statistics
                } else {
                    send_console_to_browser.log("ERROR - invalid JSON ");
                    send_console_to_browser.log(received_json);
                }
            } else if (event.data instanceof ArrayBuffer) {
                server_side_buffer_obj.buffer = new Float32Array(event.data);
                cb_for_client(server_side_buffer_obj);
            } else if (event.data instanceof Blob) {
                console.log('Blob received on client browser side of length data.size ', event.data.size);
            } else {
                console.error("ERROR - socket received unknown format ", event.data);
            }
        };

        web_socket.onerror = (error_stream) => {
            send_console_to_browser.log('ERROR - fault on socket');
            for (const curr_property of Object.keys(error_stream)) {
                send_console_to_browser.log("error property " + curr_property + " -->" + error_stream[curr_property] + "<-- ");
            }
        };

        web_socket.onclose = (close_event) => {
            send_console_to_browser.log("NOTICE - onclose with message");
            flag_connection_active = false;

            for (const curr_property of Object.keys(close_event)) {
                send_console_to_browser.log("curr_property " + curr_property + " -->" + close_event[curr_property] + "<-- ");
            }

            const streaming_is_done_msg = {
                streaming_is_done: "yes",
                max_index: 0
            };

            send_console_to_browser.log("streaming_is_done_msg");
            send_console_to_browser.log(streaming_is_done_msg);
            self.postMessage(streaming_is_done_msg);
        };

        web_socket.onopen = () => {
            send_console_to_browser.log("NOTICE - onopen just called");
            flag_connected = true;
        };

        const wait_for_socket_connection = (socket, callback) => {
            setTimeout(() => {
                if (socket.readyState === 1) {
                    if (callback !== undefined) {
                        callback();
                    }
                } else {
                    console.log("... waiting for web socket connection to come online");
                    counter_retry_connection += 1;

                    if (counter_retry_connection > MAX_CONN_RETRY) {
                        const error_msg = "ERROR - connection retry count limit reached";
                        console.log(error_msg);
                        flag_connection_active = false;
                        retry_delay_time *= 2;
                        web_socket.close();
                        cb_stream_is_complete(0);
                    }
                    wait_for_socket_connection(socket, callback);
                }
            }, retry_delay_time);
        };

        const send_message = (msg) => {
            wait_for_socket_connection(web_socket, () => {
                web_socket.send(msg);
            });
        };

        let count_send_request = 0;

        return {
            init: () => {},
            send_request_to_server: (given_msg) => {
                if (!flag_connected) {
                    send_console_to_browser.log("ERROR - no web socket connection");
                    return;
                }

                const request_msg = JSON.stringify(given_msg);
                count_send_request += 1;
                send_message(request_msg);
            },
            close_socket: () => {
                send_console_to_browser.log("NOTICE - about to close socket intentionally");
                web_socket.close();
            }
        };
    })();

    const set_send_file_header_cb = (given_cb) => {
        cb_send_file_header = given_cb;
    };

    const set_stream_is_complete_cb = (given_cb_stream_is_complete) => {
        cb_stream_is_complete = given_cb_stream_is_complete;
    };

    const set_cb_for_client = (given_callback) => {
        cb_for_client = given_callback;
    };

    const socket_client = (() => {
        websocket_connection.init();

        return (given_msg) => {
            const given_mode = given_msg.mode;

            switch (given_mode) {
                case "mode_stream_audio":
                    websocket_connection.send_request_to_server(given_msg);
                    break;

                case "mode_stop_streaming":
                    console.log("mode_stop_streaming");
                    console.log(given_msg);
                    websocket_connection.send_request_to_server(given_msg);
                    break;

                default:
                    throw new Error("ERROR - invalid mode : " + given_mode);
            }
        };
    })();

    return {
        socket_client,
        set_cb_for_client,
        set_stream_is_complete_cb,
        set_send_file_header_cb
    };
})();
