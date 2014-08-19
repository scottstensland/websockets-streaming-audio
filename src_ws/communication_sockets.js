var communication_sockets = function() {

    // ---

    var host;
    var web_socket;
    var flag_connected = false;

    // var cb_from_client_to_server_back_to_client;

    var cb_for_client;
    var cb_stream_is_complete;

    // ---

    // function forward_audio_buffer_to_player() {

    //     console.log("Corinde where U at ... here I am ... forward_audio_buffer_to_player");
    //     console.log("Corinde where U at ... here I am ... forward_audio_buffer_to_player");
    //     console.log("Corinde where U at ... here I am ... forward_audio_buffer_to_player");
    //     console.log("Corinde where U at ... here I am ... forward_audio_buffer_to_player");
    //     console.log("Corinde where U at ... here I am ... forward_audio_buffer_to_player");
    // }

    // ---------------------

    var set_stream_is_complete_cb = function(given_cb_stream_is_complete) { // supplied by calling client

        console.log("OK defining given_cb_stream_is_complete as : ", given_cb_stream_is_complete.name);

        cb_stream_is_complete = given_cb_stream_is_complete; // when server side says stream is done this gets called
    }


    console.log("create_websocket_connection");

    var create_websocket_connection = function() {

        if (!"WebSocket" in window) {

            alert("Boo Hoo WebSocket is not available on this browser");
            return;
        };

        if (flag_connected) {

            return; // already connected
        }

        console.log('client in browser says ... WebSocket is supported by your browser.');

        host = location.origin.replace(/^http/, 'ws');
        web_socket = new WebSocket(host);

        console.log("web_socket ", web_socket);

        web_socket.binaryType = "arraybuffer"; // stens TODO - added April 30 2014

        // var property_key_callback = "callback_in_client_back_from_server";

        // var cb_for_client;

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

                    console.log("received_json ", received_json);

                    if (typeof received_json.streaming_is_done !== "undefined") {

                        if ("yes" == received_json.streaming_is_done) {

                            console.log("OK received_json.streaming_is_done == yes ... so call ",
                                            cb_stream_is_complete.name);

                            cb_stream_is_complete();
                        }


                    } else if (typeof received_json.rss !== "undefined") {

                        updateStats(received_json);    // send received data directly to browser screen

                    } else {

                        // this.cb_from_client_to_server_back_to_client.retrieved_cb = received_json.cb_client_to_server_to_client;
                    
                        // console.log("received_json.cb_client_to_server_to_client ", 
                        //              received_json.cb_client_to_server_to_client);

                        // cb_for_client =  received_json.cb_client_to_server_to_client;

                        // console.log("cb_for_client ", cb_for_client);

                        // cb_for_client();
                    }

                } catch (error) {

                    // console.error("ERROR " + error);
                    // process.exit(8);

                    console.log("Received received_json NON JSON though : ", event.data);
                }

                // ---

                // updateStats(JSON.parse(event.data));    // send received data directly to browser screen

            } else if (event.data instanceof ArrayBuffer) {

                console.log("ArrayBuffer received: " + event.data);

                // var server_buffer = new ArrayBuffer(e.data);

                // var server_buffer = new Uint8Array(event.data);

                var server_side_buffer_obj = {};

                server_side_buffer_obj.buffer = new Float32Array(event.data);

                var server_buffer_len = server_side_buffer_obj.buffer.length;

                console.log("received_buffer.length ", server_buffer_len);

                var default_max_index = 3;
                // var max_index = (event.size > default_max_index) ? default_max_index : event.size;
                var max_index = (typeof server_buffer_len !== "undefined" && 
                                 server_buffer_len < default_max_index) ? server_buffer_len : default_max_index;

                console.log("max_index ", max_index);

                for (var i = 0; i < max_index; i++) {

                    console.log(i, server_side_buffer_obj.buffer[i]);
                };

                shared_utils.show_object(server_side_buffer_obj,
                    "backHome server_side_audio_obj 32 bit signed float   forward_audio_buffer_to_player", "total", 3);

                console.log("about to call cb_for_client with name of ", cb_for_client.name);

                cb_for_client(server_side_buffer_obj);

                // forward_audio_buffer_to_player();

                // cb_from_client_to_server_back_to_client.callback();

                // console.log("cb_from_client_to_server_back_to_client ", this.cb_from_client_to_server_back_to_client);

            } else if (event.data instanceof Blob) { // binary    bbb

                // console.log('Blob received on client browser side of length ', e.data.length);
                // console.log('Blob received on client browser side of length      size ', e.size);
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

        // web_socket.on('error', function (stream) {
        //   console.log('ERROR - fault on socket');
        // });

        web_socket.onerror = function(stream) {
            console.log('ERROR - fault on socket');
        };

        // ---

        flag_connected = true;
    };

    // setTimeout(create_websocket_connection, 500);


    // ---

    // web_socket.on('connection', function (stream) {
    //   console.log('someone connected!');
    // });

    function answer_back_from_server() {

        console.log("Oh Yeah ... answer_back_from_server");
    };

    // ---------------------

    function send_message_to_server() {

        if (!flag_connected) {

            console.log("hit button create_websocket_connection");
            return;
        };

        console.log("send_message_to_server");

        // web_socket.send("Hello there server ... coming from client browser");
        web_socket.send(JSON.stringify({requested_action : null, hello : "from client browser"}));
    };

    function display_binary_from_server(given_data) {

        console.log("Haa Yoo ... display_binary_from_server");
    }

    function request_server_send_binary(requested_action, requested_source, given_callback) {

        if (!flag_connected) {

            console.log("hit button create_websocket_connection");
            return;
        };

        var request_msg;
        try {

            request_msg = JSON.stringify({

                    mode : "CatFoodNation",
                    datatype : "float",
                    requested_action : requested_action,
                    requested_source : requested_source,
                    cb_client_to_server_to_client : given_callback
            });

        } catch (exception) {

            new Error("ERROR - failed to stringify msg to send to server : ", exception);
        }

        web_socket.send(request_msg);
    };

    function socket_client(given_mode, given_binary_data, given_callback) {

        switch (given_mode) {

            case 1 : {

                console.log('...  socket_client mode one ...  create_websocket_connection');

                create_websocket_connection();

                break;
            }

            case 2 : {

                console.log('...  socket_client mode two  ... send_message_to_server ');

                send_message_to_server();

                break;
            }

            case 3 : {

                console.log('...  socket_client mode three  ... request server send binary float ');

                var requested_action = null;
                var requested_source = null; // have server just synthesize some audio data
                var local_callback = "display_binary_from_server";

                request_server_send_binary(requested_action, requested_source, local_callback);

                break;
            }

            case 4 : {

                console.log('...  socket_client mode four  ... get audio buffer from server ');

                cb_for_client = given_callback;

                var requested_action = "get_audio_buffer_from_server";
                var requested_source = "Justice_Genesis_first_30_seconds_tight.wav"; // get buffer of this from svr

                request_server_send_binary(requested_action, requested_source, given_callback);

                break;
            }

            case 5 : {

                console.log('...  socket_client mode Five  ... stream audio buffer from server ');

                cb_for_client = given_callback;

                var requested_action = "stream_audio_from_server_to_client";
                var requested_source = "Justice_Genesis_first_30_seconds_tight.wav"; // get buffer of this from svr

                request_server_send_binary(requested_action, requested_source, given_callback);

                break;
            }

            default : {

                console.log('...  socket_client mode NONE doing default  ');
            }
        }
    }; //		socket_client

    // ---------------------------------------

    return { // to make visible to calling reference frame list function here comma delimited,

        socket_client: socket_client,
        send_message_to_server: send_message_to_server,
        set_stream_is_complete_cb : set_stream_is_complete_cb

        // socket_server: socket_server

        // get_size_buffer: get_size_buffer,
        // get_sampled_buffer: get_sampled_buffer,
        // get_size_sampled_buffer: get_size_sampled_buffer
    };

}(); //  communication_sockets = function()