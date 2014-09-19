

var client_streaming_audio = function() {

var curr_web_audio_obj;
var curr_circular_queue_memory_buffer_obj;
var request_number = 0;
var msgs_to_server = {};

// ---

// var status_web_audio_ready = "status_web_audio_ready";
// var status_web_audio_busy = "status_web_audio_busy";
// var status_web_audio = status_web_audio_ready;

// client_socket_comms.socket_client({ mode : 1});

function web_audio_setup() {

    // ---

    if (curr_web_audio_obj && (! curr_web_audio_obj.is_streaming_status_ready())) {

        console.log("flag_streaming_status ", curr_web_audio_obj.get_streaming_status());

        console.error("NOTICE - currently is middle of previous streaming request ... try later");
        return;
    }

    // ---

    // console.log("about to cut fresh spanking new web_audio_setup");

    var web_audio_obj = Object.create(client_web_audio());

    // console.log("web_audio_obj ", web_audio_obj);

    web_audio_obj.init_audio_context();

    web_audio_obj.set_circular_queue(Object.create(circular_queue()));


    // ---


    var media_file;

    var requested_action = "stream_audio_to_client";


    // media_file = "Justice_Genesis_first_30_seconds_tight.wav";
    // media_file = "sine_wave_32768_64.wav";
    // media_file = "sine_wave_262144_64.wav";

    // media_file = "Lee_Smolin_Physics_Envy_and_Economic_Theory-cWn86ESze6M_mono_1st_few_seconds.wav";
    // media_file = "sine_wave_8388608_64.wav";
    // media_file = "Justice_Genesis_first_third_sec_tight.wav"; // stens TODO 
    media_file = "Justice_Genesis_mono_trim_16bit_y6iHYTjEyKU.wav";
    // media_file = "L_van_Beethoven_Piano_Sonata_No_4_Op_7_in_E-Flat-Major_mono-Z0wUsO-8cx8.wav";

    var callback = web_audio_obj.cb_receive_buffer_from_server_to_web_audio_player;

    request_number = new Date().getTime();

    // ---

    var stop_streaming_msg = {};

    stop_streaming_msg.mode = "mode_stop_streaming";
    stop_streaming_msg.requested_action = "stop_streaming";
    stop_streaming_msg.request_number = request_number;

    msgs_to_server.mode_stop_streaming = stop_streaming_msg;

    // ---

    var stream_audio_msg = {};

    // stream_audio_msg.mode = 6;
    stream_audio_msg.mode = "mode_stream_audio";
    stream_audio_msg.requested_action = requested_action
    stream_audio_msg.requested_source = media_file;
    stream_audio_msg.cb_client_to_server_to_client = callback;

    stream_audio_msg.request_number = request_number;



    // stream_audio_msg.transmit_chunksize = 16384;
    // stream_audio_msg.transmit_chunksize = 32768;
    // stream_audio_msg.transmit_chunksize = 65536;
    // stream_audio_msg.transmit_chunksize = 131072;
    // stream_audio_msg.transmit_chunksize = 262144;
    // stream_audio_msg.transmit_chunksize = 524288; // too big

    var transmit_chunk_multiplier = 3; // size of server requests are this multiple of render chunksize



    stream_audio_msg.limit_buffer_size = 0;
    // comm_msg.limit_buffer_size = 5000;
    // comm_msg.limit_buffer_size = 10000;
    // comm_msg.limit_buffer_size = 100000;
    // comm_msg.limit_buffer_size = 200000;

    // ---

    // delay start of audio rendering until we have buffered up a hefty cache of audio
    // size of circular queue memory buffer is this factor times transmit chunk multiplier times render chunksize
    // var cushion_factor = 2;
    // var cushion_factor = 3;
    var cushion_factor = 5;
    // var cushion_factor = 10;
    // var cushion_factor = 15; 
    // var cushion_factor = 20;
    // var cushion_factor = 30;
    // var cushion_factor = 50;
    // var cushion_factor = 100;

    // ---

    var BUFF_SIZE_AUDIO_RENDERER = 16384;    

    // var size_memory_buffer = cushion_factor * stream_audio_msg.transmit_chunksize;

    // console.log("size_memory_buffer ", size_memory_buffer);
    // console.log("client_memory_mgr ", client_memory_mgr);

    stream_audio_msg.transmit_chunksize = BUFF_SIZE_AUDIO_RENDERER * transmit_chunk_multiplier;


    // client_memory_mgr.allocate_streaming_buffer(size_memory_buffer);
    // web_audio_obj.allocate_streaming_buffer(size_memory_buffer);
    web_audio_obj.allocate_streaming_buffer(cushion_factor, stream_audio_msg.transmit_chunksize,
                                            BUFF_SIZE_AUDIO_RENDERER);

    // console.log("get_size_memory_buffer ", client_memory_mgr.get_size_memory_buffer());
    console.log("get_size_memory_buffer ", web_audio_obj.get_size_memory_buffer());

    msgs_to_server.mode_stream_audio_to_client = stream_audio_msg;

    web_audio_obj.set_msgs_to_server(msgs_to_server);

    // --- 

    client_socket_comms.set_stream_is_complete_cb(web_audio_obj.cb_stream_is_complete);

    console.log("stream_audio_msg ", msgs_to_server.mode_stream_audio_to_client);

    client_socket_comms.socket_client(msgs_to_server.mode_stream_audio_to_client);

    return web_audio_obj;
};


// ----------------------------------------  //

function entry_point(given_request) {

    switch (given_request) {

        // case "init_audio_context" : {
        //     // curr_web_audio_obj = client_web_audio();
        //     curr_web_audio_obj = Object.create(client_web_audio());
        //     curr_web_audio_obj.init_audio_context();
        //     break;
        // }

        case "stream_audio" : {

            // console.log("stream_audio");

            curr_web_audio_obj = web_audio_setup();

            break;
        }

        case "stop_audio" : {

            console.log("stop_audio");

            // curr_circular_queue_memory_buffer_obj.deallocate_queue();
            // curr_circular_queue_memory_buffer_obj = null;

            curr_web_audio_obj.stop_audio();

            // stop_audio(streaming_node);
            curr_web_audio_obj = null; // may need to help this more explicitly

            break;
        }

        default : {

            console.error("ERROR - failed to match given_flavor ", given_flavor);

            break;
        }
    }
};

// -----------------------------------------------------------------------  //

return { // to make visible to calling reference frame list function here

    entry_point : entry_point
    // stop_audio : stop_audio,
    // render_buffer: render_buffer,
};

}(); //  client_streaming_audio = function()

