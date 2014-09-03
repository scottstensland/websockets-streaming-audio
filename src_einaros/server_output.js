


npm info it worked if it ends with ok
npm verb cli [ '/home/stens/bin/nodejs/bin/node',
npm verb cli   '/home/stens/bin/nodejs/bin/npm',
npm verb cli   'start' ]
npm info using npm@1.4.23
npm info using node@v0.10.31
npm verb run-script [ 'prestart', 'start', 'poststart' ]
npm info prestart web-audio-workers-sockets@1.2.0
npm info start web-audio-workers-sockets@1.2.0

> web-audio-workers-sockets@1.2.0 start /home/stens/Dropbox/Documents/code/github/web-audio-workers-sockets
> node src/app.js

web-audio-workers-sockets 1.2.0
OK so env var GITHUB_REPO_PARENT is defined so shared_utils
shared_utils  { get_random_in_range_inclusive_float: [Function],
  get_random_in_range_inclusive_int: [Function],
  set_random_seed: [Function],
  diff_buffers: [Function],
  show_object: [Function],
  release_all_prop_from_object: [Function],
  convert_32_bit_float_into_unsigned_16_bit_int_lossy: [Function],
  convert_16_bit_unsigned_int_to_32_bit_float: [Function],
  convert_16_bit_signed_int_to_32_bit_float: [Function],
  convert_32_bit_float_into_signed_16_bit_int_lossy: [Function],
  toFixed: [Function],
  copy_properties_across_objects: [Function],
  interleave: [Function],
  write_json_to_file: [Function],
  read_file_retrieve_json: [Function],
  convert_32_bit_floats_into_16_bit_signed_ints: [Function],
  normalize_buffer: [Function],
  read_wav_file: [Function],
  write_32_bit_float_buffer_to_16_bit_wav_file: [Function] }
here is media_dir  ../media
http server listening on 8888
websocket server created
websocket connection open
websocket connection close
websocket connection open
Received message : {"mode":"CatFoodNation","datatype":"float","requested_action":"stream_audio_to_client","requested_source":"2500_hz_sine_2_seconds.wav"}
received_json  { mode: 'CatFoodNation',
  datatype: 'float',
  requested_action: 'stream_audio_to_client',
  requested_source: '2500_hz_sine_2_seconds.wav' }
requested_action  stream_audio_to_client
stream_audio_to_client
INDEX  0
about to parse wav file, pop buffer to send back to client browser
__dirname  /home/stens/Dropbox/Documents/code/github/web-audio-workers-sockets/src
requested_input_filename  /home/stens/Dropbox/Documents/code/github/web-audio-workers-sockets/media/2500_hz_sine_2_seconds.wav
read_wav_file with input_filename  /home/stens/Dropbox/Documents/code/github/web-audio-workers-sockets/media/2500_hz_sine_2_seconds.wav
TTT ___ read_16_bit_wav_file_into_32_bit_float_buffer ___ 
name cb cb_parse_buffer_as_wav_format  cb_parse_buffer_as_wav_format
name cb cb_when_done  
thuthuthu IIIIIIIII inside read_file_into_buffer   filename  /home/stens/Dropbox/Documents/code/github/web-audio-workers-sockets/media/2500_hz_sine_2_seconds.wav
thuthuthu IIIIIIIII cb_when_done  
thuthuthu IIIIIIIII cb_post_process  cb_parse_buffer_as_wav_format
BBB ___ read_16_bit_wav_file_into_32_bit_float_buffer ___ 
INNN read_file_into_buffer with cb_post_process.name  cb_parse_buffer_as_wav_format
top of parse_wav +++++++++++++++++++++  local_input_buffer.length  176444  typeof local_input_buffer  object  instanceof local_input_buffer  other
on read ... chunckSize  176436
on read ... WAVE is what   WAVE  WAVE.length  4
on read ... fmt is what   fmt   fmt.length  4
on read ... pcm_format  16
on read ... audio_format  1
on read ... num_channels  1
on read ... sample_rate  44100
on read ... byte_rate  88200
on read ... bit_depth     16
on read ... block_align  2
on read ... bits_per_sample  16
data is what   data  data.length  4
subchunk2Size  176400
end of read header ......... offset  44
 ......... size_buffer  176400
end of read payload buffer size   176400
ssssssssssss      size_buffer  176400
ssssssssssss     num_channels  1
ssssssssssss  bits_per_sample  16
ssssssssssss  num_samples  88200
buffer size  176400
max_int_value_seen  1999  min_int_value_seen  -1999
max_float_value_seen  0.06100650131702423  min_float_value_seen  -0.061004638671875
cb_read_file_done 
received_json.cb_client_to_server_to_client  undefined
received_json.cb_client_to_server_to_client  undefined
received_json.cb_client_to_server_to_client  undefined
received_json.cb_client_to_server_to_client  undefined
received_json.cb_client_to_server_to_client  undefined
populated buffer size  88200
_______TOP show_object  backHome audio_obj 32 bit signed float   read_file_done total
_______TOP limit_size_buffer  10
_______TOP size_buffer        10
backHome audio_obj 32 bit signed float   read_file_done  property -->filename<--	 /home/stens/Dropbox/Documents/code/github/web-audio-workers-sockets/media/2500_hz_sine_2_seconds.wav
backHome audio_obj 32 bit signed float   read_file_done  property -->pcm_format<--	 16
backHome audio_obj 32 bit signed float   read_file_done  property -->audio_format<--	 1
backHome audio_obj 32 bit signed float   read_file_done  property -->num_channels<--	 1
backHome audio_obj 32 bit signed float   read_file_done  property -->sample_rate<--	 44100
backHome audio_obj 32 bit signed float   read_file_done  property -->byte_rate<--	 88200
backHome audio_obj 32 bit signed float   read_file_done  property -->bit_depth<--	 16
backHome audio_obj 32 bit signed float   read_file_done  property -->block_align<--	 2
backHome audio_obj 32 bit signed float   read_file_done  property -->bits_per_sample<--	 16
backHome audio_obj 32 bit signed float   read_file_done  about to show  buffer
backHome audio_obj 32 bit signed float   read_file_done buffer  of length  88200
backHome audio_obj 32 bit signed float   read_file_done buffer 	 0 0
backHome audio_obj 32 bit signed float   read_file_done buffer 	 1 0.02127140201628208
backHome audio_obj 32 bit signed float   read_file_done buffer 	 2 0.0398876927793026
backHome audio_obj 32 bit signed float   read_file_done buffer 	 3 0.053498946130275726
backHome audio_obj 32 bit signed float   read_file_done buffer 	 4 0.06036561354994774
backHome audio_obj 32 bit signed float   read_file_done buffer 	 5 0.05966368690133095
backHome audio_obj 32 bit signed float   read_file_done buffer 	 6 0.05148472636938095
backHome audio_obj 32 bit signed float   read_file_done buffer 	 7 0.036835841834545135
backHome audio_obj 32 bit signed float   read_file_done buffer 	 8 0.01754814386367798
backHome audio_obj 32 bit signed float   read_file_done buffer 	 9 -0.00390625
backHome audio_obj 32 bit signed float   read_file_done 	....... 
backHome audio_obj 32 bit signed float   read_file_done  min_value_seen  -0.00390625  max_value_seen  0.06036561354994774
backHome audio_obj 32 bit signed float   read_file_done  property -->curr_state<--	 populated
backHome audio_obj 32 bit signed float   read_file_done  property -->index_stream<--	 0
backHome audio_obj 32 bit signed float   read_file_done  property -->max_index<--	 88200
_______ BOTTOM show_object  backHome audio_obj 32 bit signed float   read_file_done total  buffer size  undefined
0 out of 88200
about to send binary temp_stream_chunk_buffer to client
Received message : {"mode":"CatFoodNation","datatype":"float","requested_action":"stream_audio_to_client","requested_source":null}
received_json  { mode: 'CatFoodNation',
  datatype: 'float',
  requested_action: 'stream_audio_to_client',
  requested_source: null }
requested_action  stream_audio_to_client
stream_audio_to_client
INDEX  16384
16384 out of 88200
about to send binary temp_stream_chunk_buffer to client
Received message : {"mode":"CatFoodNation","datatype":"float","requested_action":"stream_audio_to_client","requested_source":null}
received_json  { mode: 'CatFoodNation',
  datatype: 'float',
  requested_action: 'stream_audio_to_client',
  requested_source: null }
requested_action  stream_audio_to_client
stream_audio_to_client
INDEX  32768
32768 out of 88200
about to send binary temp_stream_chunk_buffer to client
Received message : {"mode":"CatFoodNation","datatype":"float","requested_action":"stream_audio_to_client","requested_source":null}
received_json  { mode: 'CatFoodNation',
  datatype: 'float',
  requested_action: 'stream_audio_to_client',
  requested_source: null }
requested_action  stream_audio_to_client
stream_audio_to_client
INDEX  49152
49152 out of 88200
about to send binary temp_stream_chunk_buffer to client
Received message : {"mode":"CatFoodNation","datatype":"float","requested_action":"stream_audio_to_client","requested_source":null}
received_json  { mode: 'CatFoodNation',
  datatype: 'float',
  requested_action: 'stream_audio_to_client',
  requested_source: null }
requested_action  stream_audio_to_client
stream_audio_to_client
INDEX  65536
65536 out of 88200
about to send binary temp_stream_chunk_buffer to client
Received message : {"mode":"CatFoodNation","datatype":"float","requested_action":"stream_audio_to_client","requested_source":null}
received_json  { mode: 'CatFoodNation',
  datatype: 'float',
  requested_action: 'stream_audio_to_client',
  requested_source: null }
requested_action  stream_audio_to_client
stream_audio_to_client
INDEX  81920
81920 out of 88200
about to send binary temp_stream_chunk_buffer to client
streaming_is_done_msg  { streaming_is_done: 'yes', max_index: 88200 }
Received message : {"mode":"CatFoodNation","datatype":"float","requested_action":"stream_audio_to_client","requested_source":null}
received_json  { mode: 'CatFoodNation',
  datatype: 'float',
  requested_action: 'stream_audio_to_client',
  requested_source: null }
requested_action  stream_audio_to_client
stream_audio_to_client
INDEX  88200
88200 out of 88200
about to send binary temp_stream_chunk_buffer to client
streaming_is_done_msg  { streaming_is_done: 'yes', max_index: 88200 }


