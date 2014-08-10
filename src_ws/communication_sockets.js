var communication_sockets = function() {

    // ---

    var host;
    var web_socket;
    var flag_connected = false;

    // ---------------------

    console.log("create_websocket_connection");

    var create_websocket_connection = function() {

        if (!"WebSocket" in window) {

            alert("Boo Hoo WebSocket is not available on this browser");
            return;
        };

        if (flag_connected) {

            return; // already connected
        }

        console.log('client in browser says ... WebSocket is supported by your browser.');

        host = location.origin.replace(/^http/, 'ws');
        web_socket = new WebSocket(host);

        console.log("web_socket ", web_socket);

        web_socket.binaryType = "arraybuffer"; // stens TODO - added April 30 2014

        // ---

        web_socket.onconnection = function(stream) {
            console.log('WebSocket connect');
        };

        web_socket.onconnected = function(stream) {
            console.log('someone connected!');
        };

        web_socket.onmessage = function(event) {

            if (typeof event.data === "string") {

                // console.log('String message received: ' + event.data);

                updateStats(JSON.parse(event.data));    // send received data directly to browser screen

            } else if (event.data instanceof ArrayBuffer) {

                console.log("ArrayBuffer received: " + event.data,
                    " received size ", event.data.size,
                    " size ", event.size);

                // var binary_bytes = new ArrayBuffer(e.data);

                var binary_bytes = new Uint8Array(event.data);

                var default_max_index = 20;
                // var max_index = (event.size > default_max_index) ? default_max_index : event.size;
                var max_index = (typeof event.size !== "undefined" && event.size < default_max_index) ? event.size : default_max_index;

                console.log("max_index ", max_index);

                for (var i = 0; i < max_index; i++) {

                    console.log(i, binary_bytes[i]);
                }

            } else if (event.data instanceof Blob) { // binary    bbb

                // console.log('Blob received on client browser side of length ', e.data.length);
                // console.log('Blob received on client browser side of length      size ', e.size);
                console.log('Blob received on client browser side of length data.size ', event.data.size);

                var size_buffer = event.data.size;

                // var binary_bytes = new Uint8Array(e.data);
                // var binary_bytes = new ArrayBuffer(e.data);
                var binary_bytes = new Blob(event.data);
                // var image = context.createImageData(canvas.width, canvas.height);
                for (var i = 0; i < 200; i++) {

                    console.log(binary_bytes[i]);
                }

                // ---

                for (var property in Blob) {

                    console.log("Blob property ", property, " value ", Blob[property]);
                }
            }

        };

        // web_socket.on('error', function (stream) {
        //   console.log('ERROR - fault on socket');
        // });

        web_socket.onerror = function(stream) {
            console.log('ERROR - fault on socket');
        };

        // ---

        flag_connected = true;
    };

    // setTimeout(create_websocket_connection, 500);


    // ---

    // web_socket.on('connection', function (stream) {
    //   console.log('someone connected!');
    // });

    function answer_back_from_server() {

        console.log("Oh Yeah ... answer_back_from_server");
    };

    // ---------------------

    function send_message_to_server() {

        if (!flag_connected) {

            console.log("hit button create_websocket_connection");
            return;
        };

        console.log("send_message_to_server");

        web_socket.send("Hello there server ... coming from client browser");
    };

    function display_binary_from_server(given_data) {

        console.log("Haa Yoo ... display_binary_from_server")
    }

    function request_server_send_binary() {

        if (!flag_connected) {

            console.log("hit button create_websocket_connection");
            return;
        };

        console.log("request_server_send_binary");

        // aaa

        // web_socket.send("Hello there server ... coming from client browser");


        // web_socket.send('mode : "apple"');
        web_socket.send(JSON.stringify({

            mode : "apple",
            datatype : "float",
            callback : "display_binary_from_server"
        }));

    };



    // web_socket.onmessage = function (event) {
    //   var li = document.createElement('li');
    //   li.innerHTML = JSON.parse(event.data);
    //   document.querySelector('#pings').appendChild(li);
    // };


    function socket_client(given_mode) {

        switch (given_mode) {

            case 1:
                {

                    console.log('...  socket_client mode one ...  create_websocket_connection');

                    create_websocket_connection();

                    break;
                }

            case 2:
                {

                    console.log('...  socket_client mode two  ... send_message_to_server ');

                    send_message_to_server();

                    break;
                }

            case 3:
                {

                    console.log('...  socket_client mode three  ... request server send binary float ');

                    request_server_send_binary();

                    break;
                }

            default:
                {
                    console.log('...  socket_client mode NONE doing default  ');
                }
        }
    }; //		socket_client

    // ---------------------------------------

    return { // to make visible to calling reference frame list function here comma delimited,

        socket_client: socket_client,
        send_message_to_server: send_message_to_server
        // socket_server: socket_server

        // get_size_buffer: get_size_buffer,
        // get_sampled_buffer: get_sampled_buffer,
        // get_size_sampled_buffer: get_size_sampled_buffer
    };

}(); //  communication_sockets = function()