
importScripts('common_utils.js');
importScripts('shared_utils.js');
importScripts('ww_client_socket.js');

// ---------------------------------- //

// function log(msg) {

// 	// var object = {
// 	// 	type: 'debug',
// 	// 	msg: common_utils.source() + msg + ' [' + common_utils.time() + ']'
// 	// };

// 	var object = {
// 		type: 'debug',
// 		msg: common_utils.source() + msg
// 	};

//   self.postMessage(object);
// }



// var console = (function() {

//     return {

//         log : function(given_str) {

//             send_console_to_browser(given_str);
//         }
//     };
// }());



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




// ---

var manage_buffer_processing = (function() {

	var curr_mode_send_to_browser_or_ww = null;

	return {

		set_mode : function(given_mode) {

			curr_mode_send_to_browser_or_ww = given_mode;

			// console.log("manage_buffer_processing");
			// console.log(curr_mode_send_to_browser_or_ww);
		},
		get_mode : function() {

			return curr_mode_send_to_browser_or_ww;
		}
	};
}());

function send_to_ww_queue(given_audio_obj_from_server) {

    var curr_buffer_obj = {};

	curr_buffer_obj.buffer = new Float32Array(given_audio_obj_from_server.buffer);

	var size_buffer = curr_buffer_obj.buffer.length;

	// console.log("ww TOP send_to_browser_queue length " + size_buffer);

	// for (var i = 0; i < size_buffer; i++) {

	// 	curr_buffer_obj.buffer[i] = given_audio_obj_from_server.buffer[i];

	// 	// if (i < 1) {
	// 	// 	console.log("cb " + float_array[i]);
	// 	// }
	// }

    queue_first_in_first_out.push(curr_buffer_obj);

    // ---

	if (queue_first_in_first_out.is_production_possible()) {

		var msgs_to_server = manage_message.get_msg().mode_stream_audio_to_client;

		// shared_utils.show_object(msgs_to_server, "ggggggggggggggg msgs_to_server", "total", 10);

		ww_client_socket.socket_client(msgs_to_server);

    } else {

    	// console.log("at this point ww queue is full and browser is consuming its own queue");
    	// console.log("when browser queue drains to min threshold then browser will consume");
    	// console.log("ww queue until browser queue is full at which point it toggles back into");
    	// console.log("mode where ww queue gets filled by server ... yet once again");
    }
}

function send_to_browser_queue(given_audio_obj) {

	// var size_buffer = given_audio_obj.buffer.length;

	// * Float32Array.BYTES_PER_ELEMENT

	// console.log(given_audio_obj);

	// array_buffer = new ArrayBuffer(given_audio_obj.buffer.byteLength);
	// float_array = new Float32Array(array_buffer);
	var float_array = new Float32Array(given_audio_obj.buffer);

	var size_buffer = float_array.length;

	// console.log("ww TOP send_to_browser_queue length " + size_buffer);

	// for (var i = 0; i < size_buffer; i++) {

	// 	float_array[i] = given_audio_obj.buffer[i];

	// 	// if (i < 1) {
	// 	// 	console.log("cb " + float_array[i]);
	// 	// }
	// }

	// console.log("cb " + float_array[0]);

	self.postMessage(float_array.buffer, [float_array.buffer]); // sending array back to browser
}

function cb_receive_buffer_from_server(given_audio_obj_from_server) {

	var curr_mode = manage_buffer_processing.get_mode();

	// console.log("cb_receive_buffer_from_server " + curr_mode);

	switch (curr_mode) {

		case "ww_get_audio_from_server" : {

			send_to_ww_queue(given_audio_obj_from_server);

			break;
		}

		case "browser_get_audio_from_ww" : {

			send_to_ww_queue(given_audio_obj_from_server);

			break;
		}

		case "browser_get_audio_from_server" : {

			send_to_browser_queue(given_audio_obj_from_server);

			break;
		}

		default : {

			throw new Error("ERROR - invalid cb for buffer from server : " + curr_mode);
		}
	}
}

function cb_send_file_header(given_json_obj) {

	// console.log("sending file header back to browser");

	self.postMessage(JSON.stringify(given_json_obj));
}

function cb_stream_is_complete(given_max_index) {

	send_console_to_browser.log("cb_stream_is_complete ... given_max_index " + given_max_index);

	// bbbbbbbbbbbb

	queue_first_in_first_out.set_max_index(given_max_index);
	queue_first_in_first_out.set_streaming_is_done();

	self.postMessage(JSON.stringify({
		ww_directed_mode : "streaming_is_done",
		max_index : given_max_index
	}));
}

var queue_first_in_first_out = (function() { // first in first out queue

	// console.log("iiiiiiiiiiiiii  TOP queue_first_in_first_out");

    var queue_first_in_first_out_obj = {};
    var push_index = 0;
    var pop_index = 0;
    var curr_size_ww_queue = 0;    // number of entries currently in queue
    var max_size_ww_queue = null;   // maximum queue size

    var streaming_is_done = false; // supplied only after end of source media has been reached
    var max_index = null;          // supplied only after end of source media has been reached

    return {

        is_production_possible : function() {

        	// console.log("INNN is_production_possible max_size_ww_queue " + max_size_ww_queue +
        	// 	" ... curr_size_ww_queue " + curr_size_ww_queue + 
        	// 	"   ANSWER " + (curr_size_ww_queue < max_size_ww_queue));

        	// console.log("kkkkkkkkkkkkkkkkk    is_WW_production_possible ... curr_size_ww_queue " + 
        	// 			curr_size_ww_queue + "  " + (curr_size_ww_queue < max_size_ww_queue));

            return (curr_size_ww_queue < max_size_ww_queue);
            // return ((curr_size_ww_queue < max_size_ww_queue) ? true : false);
        },
        push : function(given_audio_obj_from_server) { // execute production

            // if (! queue_first_in_first_out.is_production_possible()) {

            //     throw new Error("ERROR - called push when production is NOT possible");
            //     return;
            // }

            // console.log("curr_size_ww_queue ", curr_size_ww_queue, 
            // 		  "   max_size_ww_queue ", max_size_ww_queue);

            queue_first_in_first_out_obj[push_index] = given_audio_obj_from_server;

            push_index += 1;
            curr_size_ww_queue += 1;   // increment queue size

            // console.log("OK push ... curr_size_ww_queue ", curr_size_ww_queue);
        },
        is_consumption_possible : function() {

        	// console.log("toooooooooooooop is_WW_consumption_possible ... curr_size_ww_queue " + 
        	// 			curr_size_ww_queue + "   " + (curr_size_ww_queue > 0));

            return (curr_size_ww_queue > 0);
        },
        pop : function() {	// execute consumption

            if (! queue_first_in_first_out.is_consumption_possible()) {

                throw new Error("ERROR - called pop when consumption is NOT possible");
            }

            if (pop_index > 0) {

                delete queue_first_in_first_out_obj[pop_index - 1]; // destroy previously consumed entry

                // console.log("about to delete queue_first_in_first_out_obj ... pop_index ", pop_index - 1);
            }

            if (pop_index < push_index) {

                curr_size_ww_queue -= 1;   // decrement queue size

                // log("WW queue  " + curr_size_ww_queue);

                console.log("WW queue  " + curr_size_ww_queue);

                return (queue_first_in_first_out_obj[pop_index++]);
            }
        },
        set_max_size_ww_queue : function(given_max_size_ww_queue) {

            max_size_ww_queue = given_max_size_ww_queue;

            console.log("set_max_size_ww_queue    max_size_ww_queue  ", max_size_ww_queue);
        },
        set_max_index : function(given_max_index) {

        	max_index = given_max_index;
        },
        set_streaming_is_done : function() {

        	streaming_is_done = true;
        },
        get_streaming_is_done : function() {

        	return streaming_is_done;
        }
        // get_curr_size_ww_queue : function() {

        // 	return curr_size_ww_queue;
        // }
        // get_max_size_ww_queue : function() {

        // 	return max_size_ww_queue;
        // }
    };
})();       //      queue_first_in_first_out

var manage_message = (function() {

	var msgs_to_server = null;

	return {

		set_msg : function(given_msgs_to_server) {

			msgs_to_server = given_msgs_to_server;

			// console.log("msgs_to_server " + msgs_to_server);
		},
		get_msg : function() {

			return msgs_to_server;
		}
	};
}());

var setup_stream_audio_from_server = function(msgs_to_server) {

	// console.log("tttttttttttttt setup_stream_audio_from_server ............................");


    // shared_utils.show_object(msgs_to_server, "ooooooooooooooooooooo  msgs_to_server ", "total", 10);



	manage_message.set_msg(msgs_to_server);

	ww_client_socket.set_cb_for_client(cb_receive_buffer_from_server);

	ww_client_socket.set_stream_is_complete_cb(cb_stream_is_complete);

	ww_client_socket.set_send_file_header_cb(cb_send_file_header);

	queue_first_in_first_out.set_max_size_ww_queue(msgs_to_server.mode_stream_audio_to_client.ww_queue_max_size);

	// console.log("bbbbbbbbbbbbb setup_stream_audio_from_server ............................");
};

function drain_ww_queue_send_to_browser() {

	if (! queue_first_in_first_out.is_consumption_possible()) {

		if (queue_first_in_first_out.get_streaming_is_done()) {

			console.log("streaming_is_done and ww queue is empty so just return");

			// bbbbbbbbbb  link flag_connection_active from client socket to
			//		avoid loop

			return;
		}

		return;
	}

	send_to_browser_queue(queue_first_in_first_out.pop());
}

self.onmessage = function(event) {	//    retrieved a message from browser

	if (typeof event.data === "string") {

		// console.log(event.data);

		var received_json = JSON.parse(event.data);

		// shared_utils.show_object(received_json, "WWWWWWWWWWWW received_json", "total", 10);

		if (typeof received_json.browser_directed_mode !== "undefined") {

			// console.log("received_json.browser_directed_mode " + received_json.browser_directed_mode);

			switch (received_json.browser_directed_mode) { // mode 3

				case "browser_get_audio_from_ww" : {

					manage_buffer_processing.set_mode(received_json.browser_directed_mode);

					drain_ww_queue_send_to_browser();

					break;
				}

				case "ww_get_audio_from_server" : { // mode 2

					// stens TODO - flip callback which retrieves data from server

					// console.log("wswswswswswswswswsws    ww_get_audio_from_server");

					manage_buffer_processing.set_mode(received_json.browser_directed_mode);

					if (queue_first_in_first_out.is_production_possible()) {

						ww_client_socket.socket_client(received_json);

					} else {

						// console.log("booo hoo is_production_possible says NNNOOOOOOOOOOO");
					}

					break;
				}

				case "browser_get_audio_from_server" : { // mode 1

					// console.log("bsbs bsbsbsbs bsbsbsbs bsbs    browser_get_audio_from_server");

					// -----------

					// for (var curr_property in received_json) {

					// 	if (received_json.hasOwnProperty(curr_property)) {

					// 		console.log("received_json property " + curr_property);
					// 	}
					// }

					// ------------

					manage_buffer_processing.set_mode(received_json.browser_directed_mode);

					// ---

// mode_stop_streaming              MIGHT need to do below to THIS mode as well
// mode_stream_audio_to_client

					var msgs_to_server = manage_message.get_msg();

					var specific_mode_stream = msgs_to_server.mode_stream_audio_to_client;
					var specific_mode_stop   = msgs_to_server.mode_stop_streaming;

					specific_mode_stream.request_number   = received_json.request_number;
					specific_mode_stream.requested_source = received_json.requested_source;
					
					specific_mode_stop.request_number   = received_json.request_number;
					specific_mode_stop.requested_source = received_json.requested_source;

					msgs_to_server.mode_stream_audio_to_client = specific_mode_stream;
					msgs_to_server.mode_stop_streaming = specific_mode_stop;

					manage_message.set_msg(msgs_to_server);

					// ---

					// ww_client_socket.socket_client(
					// 	manage_message.get_msg().mode_stream_audio_to_client);

					ww_client_socket.socket_client(received_json);

					break;
				}

				case "setup_stream_audio_from_server" : {

					setup_stream_audio_from_server(received_json);

					break;
				}

				case "mode_stop_streaming" : {

					console.log("momomomomomomomomomomo     mode_stop_streaming");

					ww_client_socket.socket_client(
						manage_message.get_msg().mode_stop_streaming);

					// --- reset to prepare for next media --- //					

					manage_buffer_processing.set_mode("browser_get_audio_from_server");

					break;
				}

				default : {

					send_console_to_browser.log("ERROR - invalid browser_directed_mode : " + 
									received_json.browser_directed_mode);
				}
			}

		} else {

			send_console_to_browser.log("ERROR - ww did receive string from browser" +
						"... yet NOT seeing browser_directed_mode");
		}

	} else {

		send_console_to_browser.log("ERROR - ww received NON string from browser" +
					"... maybe event.data instanceof ArrayBuffer ");
	}
};
