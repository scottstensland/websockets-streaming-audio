

var ww_client_socket = (function() {      //      inside ww

"use strict";

var cb_for_client = null;
var cb_stream_is_complete = null;
var cb_send_file_header = null;



var send_console_to_browser = (function() {
// var console = (function() {

    function getScriptName() {
        var error = new Error();
        var source = null;
        var lastStackFrameRegex = new RegExp(/.+\/(.*?):\d+(:\d+)*$/);
        var currentStackFrameRegex = new RegExp(/getScriptName \(.+\/(.*):\d+:\d+\)/);

        if((source = lastStackFrameRegex.exec(error.stack.trim())) && source[1] !== "")
            return source[1];
        else if((source = currentStackFrameRegex.exec(error.stack.trim())))
            return source[1];
        else if(error.fileName !== undefined)
            return error.fileName;
    }

    return {

        log : function(given_str) {

            var log_object = {

                type: 'debug',
                msg: common_utils.source() + given_str,
                script_name : getScriptName()
            };

            self.postMessage(log_object);
        }
    };
}());




var websocket_connection = (function() {

	var web_socket = null;
	var flag_connected = false;
	var server_side_buffer_obj = {};

    var MAX_CONN_RETRY = 1000;
    var counter_retry_connection = 0;

    var retry_delay_time = 5; // init with this number of miliseconds ... exponentially 
                              // increase upon hickups


    var flag_connection_active = true; // start OK if closed then becomes false

    if (! ("WebSocket" in self)) {

        send_console_to_browser.log("ERROR - boo hoo ... websockets is not available on this browser - use firefox");
        return;
    }

    if (flag_connected) {

    	// throw new Error("ERROR - socket already connected ... zap this error msg");
        return; // already connected
    }

    send_console_to_browser.log("very cool web sockets are supported by your browser");

    var host = location.origin.replace(/^http/, 'ws');
    web_socket = new WebSocket(host);


    // console.log("Corinde alpha");


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

        // console.log("top of onmessage");

        if (typeof event.data === "string") {

            // console.log('String message received: ' + event.data);

            var received_json = JSON.parse(event.data);

        	// console.log("RECEIVED --- ");
         //    console.log("RECEIVED --- received_json ");
         //    shared_utils.show_object(received_json, "received_json string  ", "total", 3);
         //    console.log("RECEIVED --- ");

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

                send_console_to_browser.log(error_msg + "  " + requested_source); // sent back to browser html

            } else if (typeof received_json.sample_rate !== "undefined") {

                // console.log("source media header info");
                // console.log(received_json);

                // shared_utils.show_object(received_json, "send_file_header  ", "total", 3);

                cb_send_file_header(received_json);

            } else if (typeof received_json.max_index !== "undefined") {

                console.log(received_json); // stens TODO - ignore for now

            } else if (typeof received_json.rss !== "undefined") {

                // updateStats(received_json);    // put received data directly to browser screen

            } else {

                send_console_to_browser.log("ERROR - invalid JSON ");
                send_console_to_browser.log(received_json);

                // throw new Error("ERROR - invalid JSON ");
            }

        } else if (event.data instanceof ArrayBuffer) {

            // console.log("RECEIVED --- ");
            // console.log("RECEIVED --- ArrayBuffer received: " + event.data);
            // console.log("RECEIVED --- ");

            server_side_buffer_obj.buffer = new Float32Array(event.data);

            var server_buffer_len = server_side_buffer_obj.buffer.length;

            // ---
            /*
            curr_buffer_index += server_buffer_len;

            console.log("running            max_index " + max_index);
            console.log("running    curr_buffer_index " + curr_buffer_index);

            if (max_index && curr_buffer_index >= max_index) {

                console.log("cool now deal            max_index " + max_index);
                console.log("cool now deal    curr_buffer_index " + curr_buffer_index);
            }
            */

            // ---

            cb_for_client(server_side_buffer_obj);

        } else if (event.data instanceof Blob) { // binary

            console.log('Blob received on client browser side of length data.size ', event.data.size);

            var size_buffer = event.data.size;

            // var binary_bytes = new Uint8Array(e.data);
            // var binary_bytes = new ArrayBuffer(e.data);
            var server_buffer = new Blob(event.data);
            // var image = context.createImageData(canvas.width, canvas.height);
            // for (var i = 0; i < 200; i++) {

            //     console.log(server_buffer[i]);
            // }

            // ---

            for (var property in Blob) {

                console.log("Blob property ", property, " value ", Blob[property]);
            }

        } else {

            console.error("ERROR - socket receieved Who Knows ", event.data);
        }
    };

    web_socket.onerror = function(error_stream) {

        send_console_to_browser.log('ERROR - fault on socket');

        for (var curr_property in error_stream) {

            if (error_stream.hasOwnProperty(curr_property)) {

                send_console_to_browser.log("error property " + 
                                curr_property + " -->" + error_stream[curr_property] +
                                                "<-- ");
            }
        }
    };

    // ---

    // flag_connected = true; // stens TODO put this in correct callback above

    web_socket.onclose = function(close_event) {

        send_console_to_browser.log("NOTICE - onclose with message");

        flag_connection_active = false;

        // console.log(close_event);

        // shared_utils.show_object(close_event, "ceoeoeoeoeoe   close_event  ", "total", 3);

        for (var curr_property in close_event) {

            if (close_event.hasOwnProperty(curr_property)) {

                send_console_to_browser.log("curr_property " + 
                                        curr_property + " -->" + close_event[curr_property] +
                                                        "<-- ");
            }
        }

        var streaming_is_done_msg = {

            streaming_is_done : "yes",
            max_index : 0
        };

        send_console_to_browser.log("streaming_is_done_msg");
        send_console_to_browser.log(streaming_is_done_msg);

        self.postMessage(streaming_is_done_msg);

    };

    web_socket.onopen = function(){

        // send some message

        send_console_to_browser.log("NOTICE - onopen just called");

        flag_connected = true; // stens TODO put this in correct callback above
    };


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

		    function wait_for_socket_connection(socket, callback) {

		        setTimeout(
		            function() {

                        // console.log("Corinde beta");

		                if (socket.readyState === 1) {
		                    if(callback !== undefined){
		                        callback();
		                    }
		                    return;

		                } else {

		                    console.log("... waiting for web socket connection to come online");

                            counter_retry_connection += 1;

                            if (counter_retry_connection > MAX_CONN_RETRY) {

                                var error_msg = "ERROR - connection retry count limit reached";

                                console.log(error_msg);

                                flag_connection_active = false;

                                retry_delay_time *= 2; // exponentially increase delay time

                                web_socket.close();

                                cb_stream_is_complete(0); // intentionally stop 
                            }

		                    wait_for_socket_connection(socket,callback);
		                }
		            }, retry_delay_time);
		    }

		    function send_message(msg) {

		        wait_for_socket_connection(web_socket, function() {

                    // console.log("SENDING ------ ");
                    // console.log(msg);
                    // console.log("SENDING ------ ");

		            web_socket.send(msg);
		        });
		    }

		    // -------------

		    var count_send_request = 0;

		    return function(given_msg) {

		        // console.log("[][][][][]  ..........  send_request_to_server");

		        if (! flag_connected) {

		            send_console_to_browser.error("ERROR - no web socket connection");
		            return;
		        }

		        var request_msg = JSON.stringify(given_msg);

		        // console.log(count_send_request , " SEND -------- ");
		        // console.log(count_send_request , " SEND -------- ", request_msg);
		        // console.log(count_send_request , " SEND -------- ");
                
		        count_send_request += 1;

		        send_message(request_msg);
		    };
		}()),
        close_socket : function() {

            send_console_to_browser.log("NOTICE - about to close socket intentionally");

            web_socket.close();

        }
	};
}());      //      websocket_connection

var set_send_file_header_cb = function(given_cb) {

    // console.log("set_send_file_header_cb " + given_cb.name);

    cb_send_file_header = given_cb;
};

var set_stream_is_complete_cb = function(given_cb_stream_is_complete) { // supplied by calling client

    // console.log("now SET cb_stream_is_complete to ", given_cb_stream_is_complete.name);
    
    cb_stream_is_complete = given_cb_stream_is_complete; // when server side says stream is done this gets called
};

var set_cb_for_client = function(given_callback) {

    cb_for_client = given_callback;
};

var socket_client = (function() {

	websocket_connection.init();

	return function(given_msg) {

		// console.log("socket_client  given_msg ", given_msg);

        // shared_utils.show_object(given_msg, "CCCCCCCCCCC   given_msg  ", "total", 3);

	    var given_mode = given_msg.mode;

	    // console.log("socket_client  given_mode ", given_mode);

	    switch (given_mode) {

	        case "mode_stream_audio" : {    //  stream audio buffer from server 

	            // console.log('mode_stream_audio  Launch request to stream audio ////////');


                // websocket_connection.close_socket(); // troubleshooting only

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
	set_stream_is_complete_cb : set_stream_is_complete_cb,
    set_send_file_header_cb : set_send_file_header_cb
};

}());	//	ww_client_socket