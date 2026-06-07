const fs = require('fs');
const path = require('path');
const shared_utils = require("shared-utils");

let request_status;
const stream_status_prior = "prior";
const stream_status_populated = "populated";
const stream_status_complete = "complete";

let streaming_buffer_obj = {
    curr_state: stream_status_prior,
    index_stream: 0
};

let request_number = 0;
let previous_request_number = 0;

const request_new = "request_new";
const request_ongoing = "request_ongoing";
const header_chunk_size = 44;

let media_dir = null;
const set_media_dir = (given_media_dir) => {
    media_dir = given_media_dir;
};
exports.set_media_dir = set_media_dir;

let media_path = null;
const set_media_path = (given_media_path) => {
    media_path = given_media_path;
};
exports.set_media_path = set_media_path;

const streaming_is_done = (given_max_index, curr_ws) => {
    console.log("TOP streaming_is_done ... given_max_index ", given_max_index);

    const streaming_is_done_msg = {
        streaming_is_done: "yes",
        max_index: given_max_index
    };

    console.log("SEND -------- json DONE --------");
    console.log("SEND ---------- streaming_is_done_msg ", streaming_is_done_msg);
    console.log("SEND -------- json DONE --------");

    curr_ws.send(JSON.stringify(streaming_is_done_msg), { binary: false, mask: false });

    file_manager.close();
    previous_request_number = request_number;
};

const send_client_source_data_info = (audio_obj, curr_websocket) => {
    const all_property_tags = {};

    for (const curr_property of Object.keys(audio_obj)) {
        if (curr_property === "buffer") {
            continue;
        }
        all_property_tags[curr_property] = audio_obj[curr_property];
    }

    curr_websocket.send(JSON.stringify(all_property_tags), { binary: false, mask: false });
};

const stop_streaming = (received_json, curr_ws) => {
    streaming_is_done(0, curr_ws);
};

function stream_file_into_socket(received_json, curr_ws) {
    let read_stream;
    let curr_index = 0;
    const temp_stream_chunk_obj = {};
    let flag_active = true;

    const do_stream = (header_obj, requested_input_filename, received_json, curr_ws) => {
        console.log("about to stream ... requested_input_filename ", requested_input_filename);

        let total_media_size;
        let num_read_send_gulps = 0;
        let num_bytes_sent = 0;

        fs.stat(requested_input_filename, (error, stat) => {
            if (error) { throw error; }

            total_media_size = (stat.size - header_chunk_size) / 2;

            const media_info = {
                max_index: total_media_size
            };

            curr_ws.send(JSON.stringify(media_info));

            const BUFFER_SIZE_STREAMING = received_json.transmit_chunksize;
            temp_stream_chunk_obj.buffer = new Float32Array(BUFFER_SIZE_STREAMING);

            read_stream = fs.createReadStream(requested_input_filename, {
                flags: 'r',
                mode: '0666',
                highWaterMark: BUFFER_SIZE_STREAMING * 2,
                start: header_chunk_size
            });

            const read_from_stream = (socket_conn) => {
                let curr_buffer;

                while ((curr_buffer = read_stream.read(BUFFER_SIZE_STREAMING * 2)) || (curr_buffer = read_stream.read())) {
                    const fresh_data_buffer = shared_utils.convert_16_bit_signed_int_to_32_bit_float(curr_buffer);

                    temp_stream_chunk_obj.buffer.set(fresh_data_buffer);

                    if (fresh_data_buffer.length < temp_stream_chunk_obj.buffer.length) {
                        const pad_index = fresh_data_buffer.length;
                        const pad_max = temp_stream_chunk_obj.buffer.length;
                        for (let i = pad_index; i < pad_max; i += 1) {
                            temp_stream_chunk_obj.buffer[i] = 0;
                        }
                    }

                    curr_index += curr_buffer.length;
                }

                num_read_send_gulps += 1;
                num_bytes_sent += temp_stream_chunk_obj.buffer.length;

                console.log("", (100 * num_bytes_sent / total_media_size).toFixed(2),
                    " % sent      num_bytes_sent ", num_bytes_sent,
                    " out of ", total_media_size, " ----------");

                socket_conn.send(temp_stream_chunk_obj.buffer, { binary: true, mask: false });

                flag_active = false;
                read_stream.pause();
            };

            read_stream.on('readable', () => {
                if (flag_active) {
                    read_from_stream(curr_ws);
                }
            });

            read_stream.on('end', () => {
                streaming_is_done(total_media_size, curr_ws);
            });
        });
    };

    const init_stream = (media_dir, media_path, received_json, curr_ws, media_filename) => {
        streaming_buffer_obj = {
            curr_state: stream_status_prior,
            index_stream: 0
        };

        const requested_input_filename = path.resolve(__dirname, media_dir, media_filename);

        if (!fs.existsSync(requested_input_filename)) {
            const error_msg = {
                error_msg: "ERROR - requested file does not exist",
                media_filename: media_filename
            };

            console.log("SEND -------- json ERROR --------");
            console.log(error_msg);
            curr_ws.send(JSON.stringify(error_msg), { binary: false, mask: false });
            console.log("SEND -------- json ERROR --------");
            return;
        }

        const wav_input_file_obj = {};
        shared_utils.parse_wav_header(wav_input_file_obj, requested_input_filename, (error, header_obj) => {
            if (error) {
                console.error(error);
                return;
            } else {
                shared_utils.show_object(header_obj, "file headers", "total", 3);
                send_client_source_data_info(header_obj, curr_ws);
                do_stream(header_obj, requested_input_filename, received_json, curr_ws);
            }
        });
    };

    const roll_it = (received_json, curr_ws) => {
        flag_active = true;
        read_stream.resume();
    };

    return {
        roll_it: roll_it,
        init_stream: init_stream
    };
}

const file_manager = (() => {
    let curr_stream_session = null;
    let media_filename = null;

    return {
        read_file_pop_buffer_stream_back_to_client_async: (received_json, curr_ws, request_status) => {
            if (request_status === request_new) {
                curr_stream_session = null;
                curr_stream_session = stream_file_into_socket(received_json, curr_ws);
                curr_stream_session.init_stream(media_dir, media_path, received_json, curr_ws, media_filename);
            } else {
                if (curr_stream_session) {
                    curr_stream_session.roll_it(received_json, curr_ws);
                }
            }
        },
        set_media_filename: (given_media_filename) => {
            media_filename = given_media_filename;
        },
        get_media_filename: () => {
            return media_filename;
        },
        close: () => {
            curr_stream_session = null;
        }
    };
})();

const route_msg = (received_json, curr_ws) => {
    const requested_action = received_json.requested_action;

    if (typeof requested_action === "undefined") {
        console.error("ERROR - failed to see property: requested_action in client JSON msg");
        return;
    }

    if (received_json.request_number === request_number) {
        request_status = request_ongoing;
    } else {
        request_number = received_json.request_number;
        request_status = request_new;

        const media_filename = received_json.requested_source;
        if (typeof media_filename !== "undefined") {
            file_manager.set_media_filename(media_filename);
        } else {
            throw new Error("ERROR - failed to supply requested_source");
        }
    }

    switch (requested_action) {
        case "stream_audio_to_client": {
            if (request_status === request_ongoing) {
                if (request_number === previous_request_number) {
                    console.log("cool we have already stopped this stream request so ignoring stream request");
                    break;
                }
            }

            const random_delay = 0; // use this in prod
            setTimeout(() => {
                file_manager.read_file_pop_buffer_stream_back_to_client_async(
                    received_json, curr_ws, request_status);
            }, random_delay);

            break;
        }

        case "stop_streaming": {
            console.log("RECEIVED ---------- stop_streaming");
            stop_streaming(received_json, curr_ws);
            break;
        }

        default: {
            console.error("ERROR - failed to recognize client requested_action: ", requested_action);
            break;
        }
    }
};

exports.route_msg = route_msg;
