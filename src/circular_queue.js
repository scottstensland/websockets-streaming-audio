
var circular_queue = function() {
	
	var memory_obj = {};

	var index_produce = 0;
	var size_available_to_produce = 0;

	var index_consume = 0;
	var size_available_to_consume = 0;

	var size_cushion  = 0; // how many buffer indices exist between populated versus consumed buffer indices
	var index_limit;

	// ---

	var flag_did_we_fill_to_brim = false;

	var has_terminal_limit_been_reached = false;

	var count_total_size_buffered = 0;
	var count_total_size_consumed = 0;

	var terminal_index;

	// ---

	var desired_size_cushion = 0; // count of the number of buffer indices between 
								  // what has been populated yet not consumed - when necessary this may be
								  // ignored as when source input has been depleted so
								  // only activity available is consumption

	var curr_num_cushion;		// current running indicator of number of transactions parked in buffer - slosh room
	var maximum_cushion_factor;	// circular queue buffer size == maximum_cushion_factor * production_chunksize
								// during transmission of a given stream event due to network glitches we may
								// consume more than is produced so working cushion may get depleted down to min of 0
	var multiplier_production_bigger_than_consumption;
	var max_consumption_chunks; // number of consumption chunks which fit into circular queue memory buffer

	var production_chunksize;		//  buffer size of each production transaction
	var consumption_chunksize;		//  buffer size of each consumption transaction

// ---

var set_terminal_index = function(given_terminal_index) {

	if (given_terminal_index > 0) {

		console.log("set_terminal_index ", given_terminal_index);

		terminal_index = given_terminal_index;
	};
};

var get_size_memory_buffer = function() {

	return memory_obj.buffer.length;
};

var deallocate_queue = function() {

	delete memory_obj.buffer;
};

// ---

var allocate_streaming_buffer = function(	given_cushion_factor,
											given_production_chunksize,
											given_consumption_chunksize) { // prev pop streaming_audio_obj

	maximum_cushion_factor = given_cushion_factor;

	curr_num_cushion = 0;

	production_chunksize = given_production_chunksize;
	consumption_chunksize = given_consumption_chunksize;

	multiplier_production_bigger_than_consumption = ~~(production_chunksize / consumption_chunksize);

	// console.log("multiplier_production_bigger_than_consumption ", multiplier_production_bigger_than_consumption);

	var buffer_size = maximum_cushion_factor * production_chunksize;

	max_consumption_chunks = ~~(buffer_size / consumption_chunksize);

	// console.log("max_consumption_chunks ", max_consumption_chunks);

	// console.log("TOP allocate_streaming_buffer ... buffer_size ", buffer_size);

	memory_obj.buffer = new Float32Array(buffer_size);

	index_limit = memory_obj.buffer.length;

	size_available_to_produce = index_limit;

	// console.log("BOT allocate_streaming_buffer ... index_limit ", index_limit);
};

// ---

function set_stop_now() {

	has_terminal_limit_been_reached = true;
}

var is_production_possible = function() {

	return ((! has_terminal_limit_been_reached) && (size_available_to_produce >= production_chunksize) ? true : false);
};

var did_buffer_get_filled = function() {

	return flag_did_we_fill_to_brim;
};

var pop_stream_buffer = function(input_buffer_obj) {

	if (typeof input_buffer_obj === "undefined") {

		console.log("ERROR - pop_stream_buffer         input_buffer_obj is undefined");

		return;
	}

	var size_buff = input_buffer_obj.buffer.length;

	if (0 == size_available_to_produce || 
		has_terminal_limit_been_reached || 
		size_buff > size_available_to_produce) {

		console.log("circular queue is full ... cannot produce now");

		input_buffer_obj.transaction_size = 0; // size of buffer processed during this transaction
		input_buffer_obj.queue_is_full = true;
		input_buffer_obj.size_available_to_produce = size_available_to_produce;

		return;
	};

	for (var index = 0, pop_index = index_produce; index < size_buff; index++) {

		memory_obj.buffer[pop_index] = input_buffer_obj.buffer[index];

		pop_index++;

		if (pop_index === index_limit) { // 

			pop_index = 0; // wrap around since we reached bottom of memory buffer
			flag_did_we_fill_to_brim = true;

			// stens TODO - put this if check OUTSIDE for loop and dedicate separate loop
		};
	};

	index_produce = pop_index;
	count_total_size_buffered += size_buff;
	size_cushion += size_buff;
	size_available_to_produce -= size_buff;
	size_available_to_consume += size_buff;
	curr_num_cushion += multiplier_production_bigger_than_consumption;

	input_buffer_obj.size_available_to_produce = size_available_to_produce;
	input_buffer_obj.size_available_to_consume = size_available_to_consume;

	input_buffer_obj.flag_did_we_fill_to_brim = flag_did_we_fill_to_brim;
	input_buffer_obj.transaction_size = size_buff; // size of buffer processed during this transaction
	input_buffer_obj.count_total_size_buffered = count_total_size_buffered; // total buffer elements queued

	// console.log("end of STOW size_available_to_produce ", size_available_to_produce);
	// console.log("end of STOW size_available_to_consume ", size_available_to_consume);
	// console.log("end of STOW count_total_size_buffered ", count_total_size_buffered);
	// console.log("end of STOW              size_cushion ", size_cushion);
	console.log("populate queue          cushion count ", curr_num_cushion, " out of ", max_consumption_chunks);
	console.log("populate queue          version 0.8.8");

	// ---

	if (count_total_size_buffered >= terminal_index) {

		has_terminal_limit_been_reached = true; // stens TODO - tighten up how we permit buff on this boundary
	};
};

var is_consumption_possible = function() {

	return (size_available_to_consume > 0) ? true : false;
};

var get_memory_chunk = function(output_buffer_obj) {

	var size_requested = output_buffer_obj.buffer.length;

	if ((size_requested > size_available_to_consume) || 
		(has_terminal_limit_been_reached && (count_total_size_consumed >= terminal_index))) {

		console.log("circular queue is empty ... cannot consume now");

		// console.log("stunted of GET size_available_to_produce ", size_available_to_produce);
		// console.log("stunted of GET size_available_to_consume ", size_available_to_consume);
		// console.log("stunted of GET count_total_size_consumed ", count_total_size_consumed);

		output_buffer_obj.transaction_size = 0; // size of buffer processed during this transaction
		output_buffer_obj.queue_is_full = false;
		output_buffer_obj.queue_is_empty = true;
		return;
	};

	for (var index = 0, consume_index = index_consume; index < size_requested; index++) {

		output_buffer_obj.buffer[index] = memory_obj.buffer[consume_index];

		consume_index++;

		if (consume_index === index_limit) {

			consume_index = 0; // wrap around since we reached bottom of memory buffer

			// stens TODO - put this if check OUTSIDE for loop and dedicate separate loop
		};
	};

	index_consume = consume_index;
	count_total_size_consumed += size_requested;
	size_cushion -= size_requested;
	size_available_to_produce += size_requested;
	size_available_to_consume -= size_requested;
	curr_num_cushion -= 1;

	output_buffer_obj.transaction_size = size_requested; // size of buffer processed during this transaction

	output_buffer_obj.size_available_to_produce = size_available_to_produce;
	output_buffer_obj.size_available_to_consume = size_available_to_consume;
	output_buffer_obj.count_total_size_consumed = count_total_size_consumed; // total buffer elements consumed

	// console.log("end of GET size_available_to_produce ", size_available_to_produce);
	// console.log("end of GET size_available_to_consume ", size_available_to_consume);
	// console.log("end of GET count_total_size_consumed ", count_total_size_consumed);
	// console.log("end of STOW             size_cushion ", size_cushion);
	console.log("get_memory_chunk   cushion count ", curr_num_cushion, " out of ", max_consumption_chunks);
};

// -----------------------------------------------------------------------  //

return { // to make visible to calling reference frame list function here

	allocate_streaming_buffer : allocate_streaming_buffer,
    get_size_memory_buffer : get_size_memory_buffer,
    pop_stream_buffer : pop_stream_buffer,
    is_production_possible : is_production_possible,
    is_consumption_possible : is_consumption_possible,
    did_buffer_get_filled : did_buffer_get_filled,
    get_memory_chunk : get_memory_chunk,
    set_terminal_index : set_terminal_index,
    deallocate_queue : deallocate_queue,
    set_stop_now : set_stop_now
};

// }(); //  circular_queue = function()
}; //  circular_queue = function()

