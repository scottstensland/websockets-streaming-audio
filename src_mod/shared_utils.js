
// var shared_utils = function() {

var shared_utils = function(exports) {

	// ----------------------

	exports.show_object = function (given_obj, given_label, given_mode, limit_size_buffer) {

		console.log("_______TOP show_object ", given_label, given_mode);

		// populate defaults if not supplied
		
		var mode = given_mode || "partial";
		var label = given_label || "";

		var size_buffer = limit_size_buffer;

		// if (0 != size_buffer) {

		// 	size_buffer = 10;
		// }

		console.log("_______TOP limit_size_buffer ", limit_size_buffer);
		console.log("_______TOP size_buffer       ", size_buffer);


		if ("partial" == mode) {

		    for (var property in given_obj) {

		        console.log(given_label, " property ", property);
		    }

		} else {

		    for (var property in given_obj) {

		        // console.log(property, "\t property.substring(0,3) \t", property.substring(0,3));

		        if (property.substring(0,3) == "cb_") {

		        	console.log(given_label, property, " ignoring callback");

		        } else if (property == "socket_conn") {

		        	console.log(given_label, property, " ignoring socket connection details");


		        } else if ("buffer" == property || 
		        	   "raw_buffer" == property || 
		  "buffer_input_file_float" == property || 
		        "buffer_input_file" == property)   {

		        		var max_value_seen = -9999999, min_value_seen = 9999999;

			        	console.log(given_label, " about to show ", property);
			        	console.log(given_label, property, " of length ", given_obj[property].length);

			        	var local_min_size_buffer = (given_obj[property].length < size_buffer) ? 
			        							     given_obj[property].length : size_buffer;

			        	var local_max_size_buffer = local_min_size_buffer;

			        	if (local_min_size_buffer == 0) {

			        		local_max_size_buffer = given_obj[property].length;
			        	}

			    		for (var index = 0; index < local_max_size_buffer; index++) {

			        		console.log(given_label, property, "\t", index, given_obj[property][index]);

			        		min_value_seen = (given_obj[property][index] < min_value_seen) ? 
			        						  given_obj[property][index] : min_value_seen;
			        		max_value_seen = (given_obj[property][index] > max_value_seen) ? 
			        						  given_obj[property][index] : max_value_seen;
			    		}
			    		// if (given_obj.buffer.length > local_size_buffer) {
			    		if (given_obj[property].length > local_max_size_buffer) {

			        		console.log(given_label, "\t....... ");
			    		}

			        	console.log(given_label, " min_value_seen ", min_value_seen,
			        							 " max_value_seen ", max_value_seen);
		    	} else {

		    		// if (typeof property === "object") {
		    		// if (typeof given_obj[property] === "object") {

		    		// 	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof

		    		// 	console.log("cool seeing property ", property, " IS typeof object so recurse");

		    		// 	show_object(given_obj[property], given_label + " " + property, 
		    		// 				given_mode, limit_size_buffer);

		    		// } else {

		        		console.log(given_label, " property -->" + property + "<--\t", given_obj[property]);
		    		// }
		    	}
		    }
		}

		console.log("_______ BOTTOM show_object ", given_label, given_mode, " buffer size ",
					given_obj[property].length);
	};
	// exports.show_object = show_object;

	// ----------------------

  //   return {

		// show_object
  //   }

// }(); //  shared_utils = function()

    return exports;

}({});
