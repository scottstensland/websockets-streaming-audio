var client_socket_comms = function() {

    // ---

    var host;
    var web_socket;
    var flag_connected = false;

    var cb_for_client;
    var cb_stream_is_complete;

    var server_supplied_max_media_size;
    var flag_max_media_size_populated = false;
    var flag_max_media_size_retrieved = false;

    // ---------------------

    var set_stream_is_complete_cb = function(given_cb_stream_is_complete) { // supplied by calling client

        cb_stream_is_complete = given_cb_stream_is_complete; // when server side says stream is done this gets called
    }

    var pop_json_from_server = function(json_from_server, received_json) {

        console.log("RECEIVED -------- json --------");

        for (var curr_property in received_json) {

            // NOTICE - this makes NO attempt to avoid replacing previous value of given key if any

            json_from_server[curr_property] = received_json[curr_property];

            console.log("RECEIVED -------- " + curr_property + " --> " + received_json[curr_property]);
        }
        console.log("RECEIVED -------- json --------");
    };

    var create_websocket_connection = function() {

        if (!"WebSocket" in window) {

            alert("boo hoo ... websockets is not available on this browser - use firefox");
            return;
        };

        if (flag_connected) {

            return; // already connected
        }

        console.log("very cool web sockets are supported by your browser");

        host = location.origin.replace(/^http/, 'ws');
        web_socket = new WebSocket(host);

        var all_tags_from_server = {};

        web_socket.binaryType = "arraybuffer"; // stens TODO - added April 30 2014

        // ---

        web_socket.onconnection = function(stream) {
            console.log('WebSocket connect');
        };

        web_socket.onconnected = function(stream) {
            console.log('someone connected!');
        };

        web_socket.onmessage = function(event) {

            if (typeof event.data === "string") {

                // console.log('String message received: ' + event.data);

                // ---

                try {

                    var received_json = JSON.parse(event.data);

                    pop_json_from_server(all_tags_from_server, received_json);

                    if (typeof received_json["max_index"] !== "undefined" &&
                        false === flag_max_media_size_retrieved) {

                        // console.log("Corinde Stensland seeing max_index  ", received_json["max_index"]);

                        server_supplied_max_media_size = received_json["max_index"];

                        flag_max_media_size_retrieved = true;
                    }

                    // ---

                    if (typeof received_json.streaming_is_done !== "undefined") {

                        if ("yes" == received_json.streaming_is_done) {

                            var max_index = received_json.max_index;

                            console.log("OK received_json.streaming_is_done == yes  max_index ", 
                                max_index,
                                " ... so call ",  cb_stream_is_complete.name);

                            // cb_stream_is_complete();
                            cb_stream_is_complete(max_index);
                        }

                    } else if (typeof received_json.error_msg !== "undefined") {

                       display_feedback(received_json); // sent back to browser html

                    } else if (typeof received_json.rss !== "undefined") {

                        updateStats(received_json);    // put received data directly to browser screen

                    } else {

                        // this.cb_from_client_to_server_back_to_client.retrieved_cb = received_json.cb_client_to_server_to_client;
                    
                        // console.log("received_json.cb_client_to_server_to_client ", 
                        //              received_json.cb_client_to_server_to_client);

                        // cb_for_client =  received_json.cb_client_to_server_to_client;

                        // console.log("cb_for_client ", cb_for_client);

                        // cb_for_client();
                    }

                } catch (error) {

                    console.log("Received received_json NON JSON though : ", event.data);
                }

                // ---

            } else if (event.data instanceof ArrayBuffer) {

                // console.log("ArrayBuffer received: " + event.data);

                var server_side_buffer_obj = {};

                server_side_buffer_obj.buffer = new Float32Array(event.data);

                var server_buffer_len = server_side_buffer_obj.buffer.length;

                // console.log("received_buffer.length ", server_buffer_len);

                // var default_max_index = 3;
                // var max_show_index = (typeof server_buffer_len !== "undefined" && 
                //                  server_buffer_len < default_max_index) ? server_buffer_len : default_max_index;

                // console.log("max_show_index ", max_show_index);

                // for (var i = 0; i < max_show_index; i++) {

                //     console.log(i, server_side_buffer_obj.buffer[i]);
                // };



                // shared_utils.show_object(server_side_buffer_obj,
                //     "backHome server_side_audio_obj 32 bit signed float   forward_audio_buffer_to_player", "total", 10);

                // console.log("about to call cb_for_client with name of ", cb_for_client.name);

                cb_for_client(server_side_buffer_obj);

            } else if (event.data instanceof Blob) { // binary    bbb

                console.log('Blob received on client browser side of length data.size ', event.data.size);

                var size_buffer = event.data.size;

                // var binary_bytes = new Uint8Array(e.data);
                // var binary_bytes = new ArrayBuffer(e.data);
                var server_buffer = new Blob(event.data);
                // var image = context.createImageData(canvas.width, canvas.height);
                for (var i = 0; i < 200; i++) {

                    console.log(server_buffer[i]);
                }

                // ---

                for (var property in Blob) {

                    console.log("Blob property ", property, " value ", Blob[property]);
                }
            } else {

                console.log("Who Knows ", event.data);
            }
        };

        web_socket.onerror = function(stream) {
            console.log('ERROR - fault on socket');
        };

        // ---

        flag_connected = true;

    };      //      create_websocket_connection

    function send_request_to_server(given_msg) {

        if (!flag_connected) {

            console.error("ERROR - no web socket connection");
            return;
        };

        var request_msg;
        try {

            request_msg = JSON.stringify(given_msg);

        } catch (exception) {

            new Error("ERROR - failed to stringify msg to send to server : ", exception);
        }

        console.log("SEND -------- ");
        console.log("SEND -------- ", request_msg);
        console.log("SEND -------- ");

        web_socket.send(request_msg);
    };

    function socket_client(given_msg) {

        console.log("given_msg ", given_msg);

        var given_mode = given_msg.mode || 1;
        var requested_action = given_msg.requested_action || null;
        var given_callback = given_msg.cb_client_to_server_to_client || null;
        var given_media_file = given_msg.requested_source || null;

        // console.log("socket_client  given_mode ", given_mode);
        // console.log("socket_client  requested_action ", requested_action);
        // if (given_callback !== null) {console.log("given_callback ", given_callback.name); };
        // console.log("socket_client  given_media_file ", given_media_file);

        switch (given_mode) {

            case 1 : {

                // console.log('...  socket_client mode one ...  create_websocket_connection');

                create_websocket_connection();

                break;
            };

            case "mode_stream_audio" : {

                // console.log('...  socket_client mode SIX  ... stream audio buffer from server ');

                cb_for_client = given_callback;

                send_request_to_server(given_msg);

                break;
            };

            case "media_size_request" : {

                console.log("...  socket_client mode media_size_request");

                given_msg.flag_max_media_size_retrieved = flag_max_media_size_retrieved;
                given_msg.server_supplied_max_media_size = server_supplied_max_media_size;

                // return {

                //     flag_max_media_size_retrieved : flag_max_media_size_retrieved,
                //     server_supplied_max_media_size : server_supplied_max_media_size
                // }

                break;
            };

            case "mode_stop_streaming" : {

                send_request_to_server(given_msg);

                break;
            };

            default : {

                console.log('ERROR ...  socket_client mode NONE soooo ... doing nada ...');
                console.log('ERROR ...  socket_client mode NONE soooo ... doing nada ...');
                console.log('ERROR ...  socket_client mode NONE soooo ... doing nada ...');
            };
        };
    };      //		socket_client

    // ---------------------------------------

    return {        // to make visible to calling reference frame list function here comma delimited,

        socket_client: socket_client,
        set_stream_is_complete_cb : set_stream_is_complete_cb
    };

}(); //  client_socket_comms = function()
