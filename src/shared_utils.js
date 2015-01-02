
var shared_utils = (function() {

	var local_random = Math.random;

	var set_random_seed = function(given_seed) {

		/*
			If your process needs a repeatable sequence of random values, then execute
			this ONCE at top of your process.  Subsequent calls to below get_random_* functions
			will then return the same sequence of random values across process executional runs.
			IMPORTANT - if instead, you need a fresh random sequence across runs then avoid calling this.

		*/

		Math.seed = function(s) {
		    return function() {
		        s = Math.sin(s) * 10000; return s - Math.floor(s);
		    };
		};

		// usage:
		var random1 = Math.seed(given_seed);
		var random2 = Math.seed(random1());
		// Math.random = Math.seed(random2());
		local_random = Math.seed(random2());
	};

	// ---

	/**
	 * Returns a random number between min and max inclusive   
	 */
	var get_random_in_range_inclusive_float = function (min, max) {
	    // return Math.random() * (max - min) + min;
	    return local_random() * (max - min) + min;
	};

	/**
	 * Returns a random integer between min and max inclusive 
	 * Using Math.round() will give you a non-uniform distribution!
	 */
	var get_random_in_range_inclusive_int = function (min, max) {
	    // return Math.floor(Math.random() * (max - min + 1)) + min;
	    return Math.floor(local_random() * (max - min + 1)) + min;
	};

	// ---

	var release_all_prop_from_object = function (given_object) {    // purge memory for object reuse

		for (var curr_property in given_object)
		{
			if (given_object.hasOwnProperty(curr_property))
				delete given_object[curr_property];
		}
	};

	var convert_32_bit_float_into_unsigned_16_bit_int_lossy = function(input_32_bit_buffer) {

		// this method is LOSSY - intended as preliminary step when saving audio into WAV format files

	    var size_source_buffer = input_32_bit_buffer.length;

	    var new_16_bit_array = new Uint16Array(size_source_buffer);

	    var max_valid_16_bit_integer = -1 + Math.pow(2, 16);

	    // console.log("max_valid_16_bit_integer ", max_valid_16_bit_integer);

	    // ---

	    var prelim_value;

	    for (var index = 0; index < size_source_buffer; index++) {

	        prelim_value = ~~((input_32_bit_buffer[index] + 1.0) * 32768);
	        new_16_bit_array[index] = prelim_value;

	        if (prelim_value !== new_16_bit_array[index]) {

	        	if (prelim_value > max_valid_16_bit_integer) {

	        		new_16_bit_array[index] = max_valid_16_bit_integer;

	        	} else if (prelim_value < 0) {

	        		new_16_bit_array[index] = 0;
	        	}
	        }
	    }

	    return new_16_bit_array;
	};

	// ---

	var convert_16_bit_unsigned_int_to_32_bit_float = function(input_16_bit_int_buffer) {

		// assumes input range of 16 bit ints :  0 to (2^16 - 1)  == 0 to 65535

		var size_source_buffer = input_16_bit_int_buffer.length;

		var max_valid_input_value = 2 >> 16 - 1;

		// console.log("max_valid_input_value ", max_valid_input_value);


		var new_32_bit_array = new Float32Array(input_16_bit_int_buffer.length);

		for (var index = 0; index < size_source_buffer; index++) {

		    new_32_bit_array[index] = input_16_bit_int_buffer[index] / 32768 - 1.0;
		}

		return new_32_bit_array;
	};

	// ----------------------

	var conv_bit_size = function(input_unsigned_int, bits_per_sample) { // converts unsigned into signed

		var max = (1 << (bits_per_sample - 1)) - 1;

		return ((input_unsigned_int > max) ? input_unsigned_int - ((max << 1) + 2) : input_unsigned_int);
	};

	var convert_16_bit_signed_int_to_32_bit_float = function(input_8_bit_int_buffer) {

		// input buffer is 8 bit integers which need to get shifted and OR'd into 16 bit signed integers
		//              which is then converted into 32 bit floats
		//
		// This does NOT fully utilize 32 bits since input is only 16 bit

		// assumes input range of 16 bit signed ints :  -2^15 to (2^15 - 1)  == -32768 to 32767
		// ONLY after the shift and logical OR happens from a pair of 8 bit integers

		var bits_per_sample = 16;

		var size_source_buffer = input_8_bit_int_buffer.length;

		var new_32_bit_array = new Float32Array(input_8_bit_int_buffer.length / 2);

		var max_int_value_seen = -99999999.9;
		var min_int_value_seen =  99999999.9;

		var max_float_value_seen = -99999999.9;
		var min_float_value_seen =  99999999.9;

		// var tmp_16_bit_signed_int;
		var tmp_16_bit_unsigned_int;

		var value_16_bit_signed_int;
		var index_32_bit_floats = 0;

		for (var index = 0; index < size_source_buffer; index += 2, index_32_bit_floats++) {

			// tmp_16_bit_signed_int = (input_8_bit_int_buffer[index + 1] << 8) | input_8_bit_int_buffer[index];
			tmp_16_bit_unsigned_int = (input_8_bit_int_buffer[index + 1] << 8) | input_8_bit_int_buffer[index];

			// value_16_bit_signed_int = conv_bit_size(tmp_16_bit_signed_int, bits_per_sample);
			value_16_bit_signed_int = conv_bit_size(tmp_16_bit_unsigned_int, bits_per_sample);

			// console.log("tmp_16_bit_unsigned_int ", tmp_16_bit_unsigned_int, 
			// 		   " value_16_bit_signed_int ", value_16_bit_signed_int);

			if (value_16_bit_signed_int < min_int_value_seen) {

				min_int_value_seen = value_16_bit_signed_int;

			} else if (value_16_bit_signed_int > max_int_value_seen) {

				max_int_value_seen = value_16_bit_signed_int;
			}

			// ---

		    new_32_bit_array[index_32_bit_floats] = ((0 < value_16_bit_signed_int) ? 
		    											  value_16_bit_signed_int / 0x7FFF : 
		    											  value_16_bit_signed_int / 0x8000);
			// ---

			if (new_32_bit_array[index_32_bit_floats] < min_float_value_seen) {

				min_float_value_seen = new_32_bit_array[index_32_bit_floats];

			} else if (new_32_bit_array[index_32_bit_floats] > max_float_value_seen) {

				max_float_value_seen = new_32_bit_array[index_32_bit_floats];
			}
		}

		// console.log("max_int_value_seen ", max_int_value_seen, " min_int_value_seen ", min_int_value_seen);
		// console.log("max_float_value_seen ", max_float_value_seen, " min_float_value_seen ", min_float_value_seen);

		return new_32_bit_array;
	};

	// ----------------------

	var convert_32_bit_float_into_signed_16_bit_int_lossy = function(input_32_bit_buffer) {

		// this method is LOSSY - intended as preliminary step when saving audio into WAV format files
		//                        output is a byte array where the 16 bit output format 
		//						  is spread across two bytes in little endian ordering

	    var size_source_buffer = input_32_bit_buffer.length;

	    var buffer_byte_array = new Int16Array(size_source_buffer * 2); // Int8Array 8-bit twos complement signed integer

	    var value_16_bit_signed_int;
	    var index_byte = 0;


	    for (var index = 0; index < size_source_buffer; index++) {

	        value_16_bit_signed_int = ~~((0 < input_32_bit_buffer[index]) ? input_32_bit_buffer[index] * 0x7FFF : 
	        																input_32_bit_buffer[index] * 0x8000);

	        buffer_byte_array[index_byte] = value_16_bit_signed_int & 0xFF;

	        var byte_two_of_two = (value_16_bit_signed_int >> 8);

	        buffer_byte_array[index_byte + 1] = byte_two_of_two;

	        index_byte += 2;
	    }

	    // ---

	    return buffer_byte_array;
	};
			
	// ----------------------

	var show_object = function (given_obj, given_label, given_mode, limit_size_buffer) {

		console.log("_______TOP show_object ", given_label, given_mode);

		// populate defaults if not supplied
		
		var mode = given_mode || "partial";
		var label = given_label || "";
 
		limit_size_buffer = (limit_size_buffer === 0) ? 9999999999 : limit_size_buffer; // no limit if given 0 as limit

		var size_buffer = limit_size_buffer;

		console.log("_______TOP limit_size_buffer ", limit_size_buffer);
		console.log("_______TOP size_buffer       ", size_buffer);

		var property = null;

		if ("partial" == mode) {

		    for (property in given_obj) {

		        // console.log(given_label, " property ", property);
		        console.log(given_label, " property -->" + property + "<--\t", given_obj[property]);
		    }

		} else {

		    for (property in given_obj) {

		        // console.log(property, "\t property.substring(0,3) \t", property.substring(0,3));

		        if (property.substring(0,3) == "cb_") {

		        	// console.log(given_label, property, " ignoring callback");

		        } else if (property == "socket_conn") {

		        	// console.log(given_label, property, " ignoring socket connection details");


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

			        	if (local_min_size_buffer === 0) {

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

	// ----------------------

	var diff_entire_buffers = function(left_obj, right_obj, size_buffer, given_spec) {

		console.log("TOP of diff_entire_buffers");

		var total_diffs = 0;
		var total_raw_left = 0;
		var total_raw_right = 0;

		var left_buffer = left_obj.buffer;
		var right_buffer = right_obj.buffer;

		for (var index = 0; index < size_buffer; index++) {

			total_diffs += Math.abs(left_buffer[index] - right_buffer[index]);

			total_raw_left  += Math.abs(left_buffer[index]);
			total_raw_right += Math.abs(right_buffer[index]);
		}

		console.log("total_diffs ", total_diffs);

		given_spec.total_diffs = total_diffs;

		given_spec.total_raw_left  = total_raw_left;
		given_spec.total_raw_right = total_raw_right;
	};

	// ---

	var diff_buffers = function (left_obj, right_obj, given_spec) {

		// console.log("here is left_obj ", left_obj);
		// console.log("here is right_obj ", right_obj);


		var extent = "entire";	// default - diff which portions of buffers
		var master = "left";	// default - determines which buffer determines buffer length

		var spec;

	    if (typeof given_spec === "undefined") {

	        console.log("seeing NO input spec so populating with defaults");

	    	spec = { 
						extent : extent,	// diff which portions of buffers
						master : master,	// determines which buffer determines buffer length
					};
		} else {
	        spec = given_spec;
	        console.log("seeing input spec ", spec);
	    }

	    if (typeof spec.extent !== "undefined") {
	        extent = spec.extent;
	        console.log("seeing input spec with spec.extent ", spec.extent);
	    }

	    if (typeof spec.master !== "undefined") {
	        master = spec.master;
	        console.log("seeing input spec with spec.master ", spec.master);
	    }

	    given_spec.extent = extent;
	    given_spec.master = master;

	    console.log("here is spec ", given_spec);
	    console.log("here is extent ", extent);
	    console.log("here is master ", master);

	    var size_buffer;

        switch (master) {

            case "left" : {

                size_buffer = left_obj.buffer.length;
                break;
            }

            case "right" : {

                size_buffer = right_obj.buffer.length;
                break;
            }

            // --- default - catch all if not identifed above

            default :

            console.error("ERROR - failed to find spec.master in diff_buffers");
            process.exit(8);

            break;
        }

	    console.log("size_buffer ", size_buffer);
	    console.log("size left   ", left_obj.buffer.length);
	    console.log("size right  ", right_obj.buffer.length);

	    if (size_buffer > left_obj.buffer.length || size_buffer > right_obj.buffer.length) {

            throw new Error("ERROR - you defined master as : ", master, 
            			  " yet buffer size is larger than other buffer");
	    }

	    spec.size_buffer = size_buffer;

	    // ---

        switch (extent) {

            case "entire" : {

	            console.log("OK extent is ", extent)    ;

	    		diff_entire_buffers(left_obj, right_obj, size_buffer, given_spec);

	    		break;
            }

            default : {

            	throw new Error("ERROR - failed to find recognized value of spec.extent : ", extent);
            }
        }

	    console.log("extent ", extent);

	};

return {

	show_object : show_object,
	diff_buffers : diff_buffers,
	set_random_seed : set_random_seed,
	get_random_in_range_inclusive_float : get_random_in_range_inclusive_float,
	get_random_in_range_inclusive_int : get_random_in_range_inclusive_int,
	release_all_prop_from_object : release_all_prop_from_object,
	convert_32_bit_float_into_unsigned_16_bit_int_lossy : convert_32_bit_float_into_unsigned_16_bit_int_lossy,
	convert_16_bit_unsigned_int_to_32_bit_float : convert_16_bit_unsigned_int_to_32_bit_float,
	convert_16_bit_signed_int_to_32_bit_float : convert_16_bit_signed_int_to_32_bit_float,
	convert_32_bit_float_into_signed_16_bit_int_lossy : convert_32_bit_float_into_signed_16_bit_int_lossy
};
	
}());

