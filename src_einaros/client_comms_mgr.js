
var client_comms_mgr = function() {

	var worker;
	var flag_mode_binary_typed_array = false;


  // ------------------------------

  worker = new Worker("communication_sockets.js");

  // ---

  function tell_worker_connect_to_server() {

  	console.log("tell_worker_connect_to_server TO worker");

    var curr_msg = {
      'cmd': 'tell_worker_connect_to_server', 
      'msg': 'Hi'
    };

    worker.postMessage(curr_msg);
  }

  function tell_worker_heavy(size_heavy) {

    console.log("browser is telling worker to craft size_heavy of ", size_heavy);

    var curr_msg = {
      'cmd': 'tell_worker_to_return_heavy_load', 
      'msg': 'Hi',
      "size_heavy" : size_heavy
    };

    worker.postMessage(curr_msg);
  }

  // ---

  function sayHi() {

    var curr_msg = {
      'cmd': 'start', 
      'msg': 'Hi'
    };

    console.log("browser sending msg to ww from client_comms_mgr : ", curr_msg);

    // worker.postMessage({'cmd': 'start', 'msg': 'Hi'});
    worker.postMessage(curr_msg);
  };

  // ---

  var show_load = function(heavy_load) {

    var max_index = 20;
    max_index = (heavy_load.length < max_index) ? heavy_load.length : max_index;

    for (var index = 0; index < max_index; index++) {

      console.log(index, heavy_load[index]);
    }
  }

  // ---

  worker.onmessage = function(e) {

    var data = e.data;

    if (flag_mode_binary_typed_array) {

      some_heavy_load = new Float32Array(data);

      console.log("some_heavy_load  length ", some_heavy_load.length);

      show_load(some_heavy_load);

      flag_mode_binary_typed_array = false;

    } else {

      switch (data.cmd) {

        case 'worker_returning_heavy_load' :

          console.log("worker_returning_heavy_load");

          flag_mode_binary_typed_array = true;

          // console.log("data.cmd.heavy_load ", data.cmd["heavy_load"]);


          // some_heavy_load = new Float32Array(data.cmd.heavy_load);

          // console.log("some_heavy_load length ", some_heavy_load.buffer.length);
          // console.log("some_heavy_load element 0 ", some_heavy_load.length);

          break;

        case "tell_worker_connect_to_server" :

        	console.log("MSG back from worker ... client_comms_mgr tell_worker_connect_to_server ");

        	break;

        default :

          document.getElementById('result').textContent = data;
      }
    }

    // console.log("data.cmd ", data.cmd);
  }

  // -------------


return {

    sayHi: sayHi,
    tell_worker_heavy : tell_worker_heavy,
    tell_worker_connect_to_server : tell_worker_connect_to_server
    // internal_webGLStart.sayHi : internal_webGLStart.sayHi
};

}();
