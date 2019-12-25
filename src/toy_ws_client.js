

const WebSocket = require('ws');
 

const ws_port = 8888

var ws_url = 'ws://localhost:' + ws_port

console.log("\nhere is ws_url ", ws_url, "\n\n");

// const ws = new WebSocket('ws://www.host.com/path');
// const ws = new WebSocket('ws://localhost:8080');
const ws = new WebSocket( ws_url );
 
ws.on('open', function open() {
  const array = new Float32Array(5);
 
  for (var i = 0; i < array.length; ++i) {
    array[i] = i / 2;
  }
 
  ws.send(array);
});

