

var ww_client_socket = (function() {      //      inside ww

"use strict";

var cb_for_client;
var cb_stream_is_complete;

var websocket_connection = (function() {

	var web_socket = null;
	var flag_connected = false;
	var server_side_buffer_obj = {};
    // var max_index = null;
    // var curr_buffer_index = 0; // rolling total index seen so far - used to limit buffers sent based
                                // on max_index once identified

    // if (!"WebSocket" in self) {
    if (! ("WebSocket" in self)) {

        alert("boo hoo ... websockets is not available on this browser - use firefox");
        return;
    }

    if (flag_connected) {

    	// throw new Error("ERROR - socket already connected ... zap this error msg");
        return; // already connected
    }

    console.log("very cool web sockets are supported by your browser");

    var host = location.origin.replace(/^http/, 'ws');
    web_socket = new WebSocket(host);

    // var all_tags_from_server = {};

    // following binaryType must be set or you will get this error :
    /* Uncaught TypeError: Failed to construct 'Blob': The 1st argument provided is either null, 
       or an invalid Array object.
    */
    web_socket.binaryType = "arraybuffer"; // stens TODO - added April 30 2014

    // ---

    web_socket.onconnection = function(stream) {
        console.log('WebSocket connect');
    };

    web_socket.onconnected = function(stream) {
        console.log('someone connected!');
    };

    web_socket.onmessage = function(event) {        //      receive message from server side

        if (typeof event.data === "string") {

            console.log('String message received: ' + event.data);

            var received_json = JSON.parse(event.data);

        	console.log("RECEIVED --- ");
            console.log("RECEIVED --- received_json ", received_json);
            console.log("RECEIVED --- ");

            // ---

            if (typeof received_json.streaming_is_done !== "undefined") {

                if ("yes" == received_json.streaming_is_done) {

                    var local_max_index = received_json.max_index;

                    console.log("OK received_json.streaming_is_done == yes  local_max_index ", 
                        local_max_index,
                        " ... so call cb_stream_is_complete ",  cb_stream_is_complete.name);

                    cb_stream_is_complete(local_max_index);
                }

            } else if (typeof received_json.error_msg !== "undefined") {

                console.log(received_json);

                var error_msg = received_json.error_msg;
                var requested_source = received_json.requested_source;

                throw new Error(error_msg + "  " + requested_source); // sent back to browser html

            } else if (typeof received_json.sample_rate !== "undefined") {

                console.log(received_json); // stens TODO - ignore for now

            } else if (typeof received_json.max_index !== "undefined") {

                console.log(received_json); // stens TODO - ignore for now

            } else if (typeof received_json.rss !== "undefined") {

                // updateStats(received_json);    // put received data directly to browser screen

            } else {

                console.error(received_json);

                throw new Error("ERROR - invalid JSON ");
            }

        } else if (event.data instanceof ArrayBuffer) {

            // console.log("RECEIVED --- ");
            // console.log("RECEIVED --- ArrayBuffer received: " + event.data);
            // console.log("RECEIVED --- ");

            server_side_buffer_obj.buffer = new Float32Array(event.data);

            var server_buffer_len = server_side_buffer_obj.buffer.length;

            // ---
            /*
            curr_buffer_index += server_buffer_len; // bbbbbbbbbbbbbbbb

            console.log("running            max_index " + max_index);
            console.log("running    curr_buffer_index " + curr_buffer_index);

            if (max_index && curr_buffer_index >= max_index) {

                console.log("cool now deal            max_index " + max_index);
                console.log("cool now deal    curr_buffer_index " + curr_buffer_index);
            }
            */

            // ---

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

            console.error("ERROR - socket receieved Who Knows ", event.data);
        }
    };

    web_socket.onerror = function(stream) {
        console.log('ERROR - fault on socket');
    };

    // ---

    flag_connected = true; // stens TODO put this in correct callback above

	return {

		init : function() {

		},
		send_request_to_server : (function() {

	            // below pair of functions act as a try / wait until web socket connection is ready

		    // see SO question
		    // Tornado WebSockets - InvalidStateError “Still in CONNECTING State”
		    // my error was 
		    // InvalidStateError: Failed to execute 'send' on 'WebSocket': Still in CONNECTING state
		    // since I moved web socket init logic out of page reload

		    function wait_for_socket_connection(socket, callback){

		        setTimeout(
		            function(){
		                if (socket.readyState === 1) {
		                    if(callback !== undefined){
		                        callback();
		                    }
		                    return;

		                } else {

		                    console.log("... waiting for web socket connection to come online");

		                    wait_for_socket_connection(socket,callback);
		                }
		            }, 5);
		    }

		    function send_message(msg) {

		        wait_for_socket_connection(web_socket, function() {

		            // console.log("SENDING ------ ", msg);

		            web_socket.send(msg);
		        });
		    }

		    // -------------

		    var count_send_request = 0;

		    return function(given_msg) {

		        // console.log("[][][][][]  ..........  send_request_to_server");

		        // if (!flag_connected) {

		        //     console.error("ERROR - no web socket connection");
		        //     return;
		        // };

		        var request_msg = JSON.stringify(given_msg);

		        console.log(count_send_request , " SEND -------- ");
		        console.log(count_send_request , " SEND -------- ", request_msg);
		        console.log(count_send_request , " SEND -------- ");
                
		        count_send_request += 1;

		        send_message(request_msg);
		    };
		}())
	};
}());      //      websocket_connection

var set_stream_is_complete_cb = function(given_cb_stream_is_complete) { // supplied by calling client

    console.log("now SET cb_stream_is_complete to ", given_cb_stream_is_complete.name);
    
    cb_stream_is_complete = given_cb_stream_is_complete; // when server side says stream is done this gets called
};

var set_cb_for_client = function(given_callback) {

    cb_for_client = given_callback;
};

var socket_client = (function() {

	websocket_connection.init();

	return function(given_msg) {

		console.log("socket_client  given_msg ", given_msg);

        shared_utils.show_object(given_msg, "CCCCCCCCCCC   given_msg  ", "total", 3);

	    var given_mode = given_msg.mode;

	    console.log("socket_client  given_mode ", given_mode);

	    switch (given_mode) {

	        case "mode_stream_audio" : {    //  stream audio buffer from server 

	            // console.log('mode_stream_audio  Launch request to stream audio ////////');

	            websocket_connection.send_request_to_server(given_msg);

	            break;
	        }

	        case "mode_stop_streaming" : {

	            console.log("mode_stop_streaming");
                console.log(given_msg);

	            websocket_connection.send_request_to_server(given_msg);

	            break;
	        }

	        default : {

	            throw new Error("ERROR - invalid mode : " + given_mode);
	        }
		}
	};
}());

return {

	socket_client : socket_client,
	set_cb_for_client : set_cb_for_client,
	set_stream_is_complete_cb : set_stream_is_complete_cb
};

}());	//	ww_client_socket