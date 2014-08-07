var communication_sockets = function() {

    // ---

    var host;
    var ws;
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
        ws = new WebSocket(host);

        // ---

        ws.onconnection = function(stream) {
            console.log('WebSocket connect');
        };

        ws.onconnected = function(stream) {
            console.log('someone connected!');
        };

        ws.onmessage = function(event) {
            updateStats(JSON.parse(event.data));
        };

        // ws.on('error', function (stream) {
        //   console.log('ERROR - fault on socket');
        // });


        ws.onerror = function(stream) {
            console.log('ERROR - fault on socket');
        };

        // ---

        flag_connected = true;
    };

    // setTimeout(create_websocket_connection, 500);


    // ---

    // ws.on('connection', function (stream) {
    //   console.log('someone connected!');
    // });

    // ---------------------

    function send_message_to_server() {

        if (!flag_connected) {

            console.log("hit button create_websocket_connection");
            return;
        };

        console.log("send_message_to_server");

        ws.send("Hello there server from client browser");
    };


    // ws.onmessage = function (event) {
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