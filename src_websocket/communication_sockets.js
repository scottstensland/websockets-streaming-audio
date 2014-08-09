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

        // ---

            "use strict";
    // Initialize everything when the window finishes loading
    // window.addEventListener("load", function(event) {

      // var status = document.getElementById("status");
      // var url = document.getElementById("url");
      // var open = document.getElementById("open");
      // var close = document.getElementById("close");
      // var send = document.getElementById("send");
      // var text = document.getElementById("text");
      // var message = document.getElementById("message");
      // var socket;

      status.textContent = "Not Connected";
      // url.value = "ws://localhost:8080";
      // url.value = location.origin.replace(/^http/, 'ws');
      host = location.origin.replace(/^http/, 'ws');



      // close.disabled = true;
      // send.disabled = true;

      // Create a new connection when the Connect button is clicked
      // open.addEventListener("click", function(event) {
        // open.disabled = true;

        // --- 

        web_socket = new WebSocket(host, "echo-protocol");

        web_socket.addEventListener("open", function(event) {
          // close.disabled = false;
          // send.disabled = false;
          status.textContent = "Connected";
        });

        // Display messages received from the server
        web_socket.addEventListener("message", function(event) {

            // updateStats(JSON.parse(event.data));

            console.log("here is event  -->");
            console.log(event);
            console.log("<-----");



            console.log("here is event.data  /////#");
            console.log(event.data);
            console.log("#\\\\\\");


            var returned_msg = JSON.parse(event.data);

            if (typeof returned_msg.rss !== "undefined") {

                updateStats(returned_msg);

            } else {

                message.textContent = "Server Says: " + event.data;
            }

        });

        // Display any errors that occur
        web_socket.addEventListener("error", function(event) {
          message.textContent = "Error: " + event;
        });

        web_socket.addEventListener("close", function(event) {
          // open.disabled = false;
          status.textContent = "Not Connected";

          // ---

        });

        // ---


        web_socket.addEventListener("onclose", function(event) {
          // open.disabled = false;
          status.textContent = "Not Connected";

          console.log("doing an onclose");

          web_socket.close();

          // ---

        });

        // ---

      // });

/*
      // Close the connection when the Disconnect button is clicked
      close.addEventListener("click", function(event) {
        close.disabled = true;
        // send.disabled = true;
        message.textContent = "";
        web_socket.close();
      });
*/

/*
      // Send text to the server when the Send button is clicked
      send.addEventListener("click", function(event) {
        web_socket.send(text.value);
        text.value = "";
      });
*/

    // });



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

        // web_socket.send("Hello there server ... coming from client browser");
        web_socket.send({

            rss : "ignore",
            leaderboard :  "Empire",
            frequency : 2780
        });
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