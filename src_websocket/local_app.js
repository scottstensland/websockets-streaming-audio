
var connect_to_server = function(working_dir) {

console.log("TOP local_app working_dir ", working_dir);

// ---

var port = process.env.PORT || 8888;

// var web_socket = require("nodejs-websocket"); // https://www.npmjs.org/package/nodejs-websocket
var WebSocketServer = require('websocket').server;
var express    = require('express');
var app        = express();
// var server     = app.listen(port);
var server     = app.listen(port, function() {
    console.log((new Date()) + ' Server is listening on port ' + port);
});

// var wsServer   = new web_socket({ httpServer : server });

// this will make Express serve your static files
// app.use(express.static(__dirname + '/public'));
app.use(express.static(working_dir));

// ---

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});



function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');

    // ---

    var wrap_stats = function() {

        console.log("NOW calling wrap_stats");

        var stats_id = setInterval(function() {

            // ws.send(JSON.stringify(process.memoryUsage()), function() {});
            connection.send(JSON.stringify(process.memoryUsage()), function() {});

        }, 100);
    };

    var ID_timeout = setTimeout(wrap_stats, 20);

    // ---

    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);

            var reply_from_server = {

                datatype : "elephant",
                length : 200
            };

            console.log("about to sent to client : ", reply_from_server);

            // connection.sendUTF(message.utf8Data);

            // connection.sendUTF(reply_from_server);
            connection.sendUTF(JSON.stringify(reply_from_server));
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');

        // ---

        clearInterval(wrap_stats.stats_id);
        // clearInterval(run.stats_id);
        // clearInterval(ID_write);
        clearTimeout(ID_timeout);
    });
});

// ---



};      //      connect_to_server

exports.connect_to_server = connect_to_server;

// ---

var inside_local_app = function() {

    console.log("TOP inside_local_app");
};
exports.inside_local_app = inside_local_app;
