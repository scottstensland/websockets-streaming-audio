

var client_streaming_audio = function() {

var curr_web_audio_obj;
var curr_circular_queue_memory_buffer_obj;
var request_number = 0;
var msgs_to_server = {};

// ----------------------------------------  //

function entry_point(given_request) {

    switch (given_request) {

        case "init_audio_context" : {


            // curr_web_audio_obj = client_web_audio();
            curr_web_audio_obj = Object.create(client_web_audio());

            curr_web_audio_obj.init_audio_context();

            break;
        }

        case "stream_audio" : {

            console.log("stream audio from server to client browser");

            // if (flag_streaming_status !== streaming_status_ready) {
            // if (! curr_web_audio_obj.is_streaming_status_ready()) {
            if (curr_web_audio_obj && (! curr_web_audio_obj.is_streaming_status_ready()) {

                console.log("flag_streaming_status ", curr_web_audio_obj.get_streaming_status());

                console.error("NOTICE - currently is middle of previous streaming request ... try later");
                return;
            }

            // if (request_number === 0) {

                request_number = new Date().getTime();

            // } else {

            //     console.log("We already have a request ... request_number ", request_number);
            //     return;
            // }

            // ---

            curr_circular_queue_memory_buffer_obj = null;

            curr_circular_queue_memory_buffer_obj = Object.create(circular_queue());

            console.log("curr_circular_queue_memory_buffer_obj ", curr_circular_queue_memory_buffer_obj);

            // ---

            curr_web_audio_obj = null;

            curr_web_audio_obj = Object.create(client_web_audio());

            console.log("curr_web_audio_obj ", curr_web_audio_obj);

            curr_web_audio_obj.init_audio_context();

            curr_web_audio_obj.set_circular_queue(curr_circular_queue_memory_buffer_obj);

            // ---

            console.log("request_number ", request_number);

            // ---

            console.log("Start your Engines .............");

            // init_context_audio();

            // var total_heap = window.performance.memory.totalJSHeapSize;  // total heap memory
            // var curr_used_heap = window.performance.memory.usedJSHeapSize; // currently used heap memory
            // console.log("total_heap ", total_heap, " curr_used_heap ", curr_used_heap);

            // ---

            // streaming_audio_obj.buffer = new Float32Array(BUFFER_SIZE_STREAM_QUEUE);
            // streaming_audio_obj.max_index = BUFFER_SIZE_STREAM_QUEUE;

            // media_file = "2500_hz_sine_2_seconds.wav";
                // media_file : "Ida_Corr_Fedde_Le_Grand_Let_Me_Think_About_It-19WUwZYM7bM.wav"
                // media_file : "Justice_Genesis_first_third_sec_tight.wav"
            // media_file = "sine_wave_32768_64.wav";
            // media_file = "sine_wave_32768_128.wav"
                // media_file : "J_S_Bach_Violin_Concerto_d-minor_after_BWV_1052_Mov_1_3-_mono_4jGRhbXS4E.wav"
            // media_file = "Justice_Genesis_mono-y6iHYTjEyKU.wav";
                // media_file : "Scriabin_Etude_No_3_in_G_Major_Op_65_Sviatoslav_Richter_mono_AAnImXHJHaM.wav"
            // media_file = "sine_wave_262144_64.wav";
            // media_file = "sine_wave_8388608_64.wav";
            // media_file = "Justice_Genesis_first_30_seconds_tight.wav";
            // media_file = "Justice_Genesis_mono_trim_16bit_y6iHYTjEyKU.wav";


            // streaming_audio_obj = {

            //     index_stream : 0
            // };

            // curr_index_synth_buffer = 0;

            // flag_audio_rendering = false;

            var media_file;

            var requested_action = "stream_audio_to_client";
            // media_file = "Justice_Genesis_first_30_seconds_tight.wav";
            // media_file = "sine_wave_32768_64.wav";
            // media_file = "sine_wave_262144_64.wav";

            // media_file = "Lee_Smolin_Physics_Envy_and_Economic_Theory-cWn86ESze6M_mono_1st_few_seconds.wav";
            media_file = "sine_wave_8388608_64.wav";
            // media_file = "Justice_Genesis_first_third_sec_tight.wav";
            // media_file = "Justice_Genesis_mono_trim_16bit_y6iHYTjEyKU.wav";


            var callback = curr_web_audio_obj.cb_receive_buffer_from_server_to_web_audio_player;

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

            stream_audio_msg.transmit_chunksize = 16384;
            // stream_audio_msg.transmit_chunksize = 65536;
            // stream_audio_msg.transmit_chunksize = 131072;
            // stream_audio_msg.transmit_chunksize = 262144;
            // stream_audio_msg.transmit_chunksize = 524288; // too big

            stream_audio_msg.limit_buffer_size = 0;
            // comm_msg.limit_buffer_size = 5000;
            // comm_msg.limit_buffer_size = 10000;
            // comm_msg.limit_buffer_size = 100000;
            // comm_msg.limit_buffer_size = 200000;

            // ---

            // delay start of audio rendering until we have buffered up a hefty cache of audio
            var cushion_factor = 2;
            // var cushion_factor = 10;
            // var cushion_factor = 15; 
            // var cushion_factor = 20;
            // var cushion_factor = 30;
            // var cushion_factor = 50;
            // var cushion_factor = 100;

            // ---

            var size_memory_buffer = cushion_factor * stream_audio_msg.transmit_chunksize;

            console.log("size_memory_buffer ", size_memory_buffer);
            // console.log("client_memory_mgr ", client_memory_mgr);

            // client_memory_mgr.allocate_streaming_buffer(size_memory_buffer);
            curr_web_audio_obj.allocate_streaming_buffer(size_memory_buffer);

            // console.log("get_size_memory_buffer ", client_memory_mgr.get_size_memory_buffer());
            console.log("get_size_memory_buffer ", curr_web_audio_obj.get_size_memory_buffer());


            msgs_to_server.mode_stream_audio_to_client = stream_audio_msg;

            curr_web_audio_obj.set_msgs_to_server(msgs_to_server);

            // --- 

            client_socket_comms.set_stream_is_complete_cb(curr_web_audio_obj.cb_stream_is_complete);

            console.log("stream_audio_msg ", msgs_to_server.mode_stream_audio_to_client);

            client_socket_comms.socket_client(msgs_to_server.mode_stream_audio_to_client);

            break;
        }

        case "stop_audio" : {

            console.log("stop audio");

            curr_circular_queue_memory_buffer_obj.deallocate_queue();
            curr_circular_queue_memory_buffer_obj = null;

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

