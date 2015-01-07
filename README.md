websockets-streaming-audio
==========================

Stream audio to a Web Audio API enabled browser from Node.js server side using Web Worker and Web Socket.

My plan is to make this modular enough to get added to your process as simple API calls - using Angularjs ;-)

I have now introduced a Web Worker to handle all server side calls - this fixed glitches of early versions suffered due to the single threaded browser - This outlines the flow of control :

    Browser   <-->   Web Worker   <-->   Web Socket   <-->   Node.js

Here is the state transition sequence : 1 --> 2 <--> 3
That is start mode 1 then cycle between mode 2 and mode 3 until finished

**mode 1**
- Fill up audio queue on browser by requesting server side to start streaming the media file and return floating point typed array buffers via Web Worker using Web Sockets
- transition to mode 2 when browser queue is full

**mode 2**
- Browser renders audio using Web Audio API by consuming buffers from browser buffer queue. Simultaneously, the Web Worker is told to replenish its own WW side audio buffer queue by requesting buffers from Node.js server side using Web Socket
- transition to mode 3 when browser buffer queue gets too low

**mode 3**
- Browser seamlessly continues to render audio by consuming its same browser buffer queue.  Web Worker does not interact with Node.js server side in this mode (critical to avoid interruptions).
- Web Worker begins this mode with a full buffer queue replinished during mode 2
- Web Audio API event loop callback drives the browser to request WW to send typed array audio buffers which refills the browser buffer queue at twice its consumption rate
- transition to mode 2 when browser audio buffer queue is full

[![NPM](https://nodei.co/npm/websockets-streaming-audio.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/websockets-streaming-audio/)

**Installation**

visit [nodejs.org](http://nodejs.org) and install node.js

see project npm site at 

[https://www.npmjs.org/package/websockets-streaming-audio](https://www.npmjs.org/package/websockets-streaming-audio)

Clone this repository to your local machine:

```bash
npm install websockets-streaming-audio
```
Change directory into the project folder websockets-streaming-audio to install the dependent modules:

```bash
cd websockets-streaming-audio
npm install
```

Launch the nodejs app:

```bash
npm start
```

Using a Web Audio API savvy browser (ff/chrome), point it at URL :

```bash
		 http://localhost:8888 
```

then click one of the stream buttons, click reload inbetween hitting another stream button

or ignore above and just see this WebGL app deployed live on heroku :

[http://websockets-streaming-audio.herokuapp.com](http://websockets-streaming-audio.herokuapp.com)


**Current Limitations**
- server side source media parser I wrote only handles WAV format, however now that I am using Web Worker I could transition to a compressed format. The bloated ogg decoder enabled using emscripten may go in soon dunno.
                     
- please click reload in between each stream button hit until I teach myself Angularjs ;-)))

**Lessions Learned**
- To stream using Web Audio API you must offload Web Socket calls
                       to the server side by the introduction of a Web Worker layer


Feel free to contact me on twitter if you have any questions! :) [@scottstensland](http://twitter.com/scottstensland)
