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

        host = location.origin.replace(/^http/, 'ws')
        web_socket = new WebSocket(host);

        // ---

        web_socket.onconnection = function(stream) {
            console.log('WebSocket connect');
        };

        web_socket.onconnected = function(stream) {
            console.log('someone connected!');
        };

        web_socket.onmessage = function(event) {
            updateStats(JSON.parse(event.data));
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