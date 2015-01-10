websockets-streaming-audio
==========================

[![NPM](https://nodei.co/npm/websockets-streaming-audio.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/websockets-streaming-audio/)

stream audio to a Web Audio API enabled browser from Node.js server using Web Worker and Web Socket

plan is to make this modular enough to get added to your process as simple API calls - using Angularjs ;-)

I have now introduced a Web Worker to handle all server side calls - this fixed glitches of early versions suffered due to the single threaded browser

basic architecture :

    Browser   <-->   Web Worker   <-->   Web Socket   <-->   Node.js

**state transition sequence**
- start mode 1 then cycle between mode 2 and mode 3 until stream is done

**mode 1**
- fill up browser audio buffer queue by requesting server side to start streaming the media file to return floating point typed array buffers via Web Worker using Web Sockets
- to minimize audio play startup lag avoid populating Web Worker audio buffer queue
- transition to mode 2 when browser queue is full

**mode 2**
- launch Web Audio event loop if not already running
- browser consumes audio buffers from browser buffer queue
- browser avoids any interaction with Web Worker or server side
- Web Worker is told to replenish its own audio buffer queue by requesting buffers from Node.js server side using Web Socket
- transition to mode 3 when browser audio buffer queue gets too low

**mode 3**
- browser seamlessly continues to render audio by consuming browser buffer queue
- Web Worker does not interact with Node.js server side in this mode (critical to avoid interruption of rendered audio)
- Web Worker begins this mode with a full buffer queue replinished during mode 2
- Web Audio API event loop callback drives the browser to request Web Worker to send typed array audio buffers taken from the WW buffer queue which refills the browser buffer queue at twice the browser Web Audio consumption rate
- transition to mode 2 when browser audio buffer queue becomes full


**Installation**

visit [nodejs.org](http://nodejs.org) and install node.js

see project npm site at 

[https://www.npmjs.org/package/websockets-streaming-audio](https://www.npmjs.org/package/websockets-streaming-audio)

Clone this repository to your local machine:

```bash
npm install websockets-streaming-audio
```
Change directory into the project folder to install the upstream modules:

```bash
cd node_modules/websockets-streaming-audio
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

then click one of the stream buttons, after a song has played click reload before hitting another stream button - I am still learning front ends ;-)

... OR ignore above and just see this app deployed live on heroku :

[http://websockets-streaming-audio.herokuapp.com](http://websockets-streaming-audio.herokuapp.com)


**Current Limitations**
- server side source media parser I wrote only handles WAV format, however now that I am using Web Worker, I could transition to a compressed format. The bloated ogg decoder enabled using emscripten may go in soon - dunno
- only streams audio from server side to browser - not other direction - I do plan to enable streaming microphone audio back to server side (or other browser originated audio : synthesized or uploaded file)
- please click reload in between each stream button hit until I teach myself Angularjs ;-)))

**Lessions Learned**
- to stream audio using Web Audio API you must offload your Web Socket calls to a Web Worker layer or else you will hear audible glitches when the single threaded browser is suddenly interrupted away from babysitting the audio rendering committments just to service responses received from the server side as sent using Web Socket
- a stepping stone to above point : the browser wants its own buffer queue, do not short change the design by relying on a Web Worker buffer queue to directly supply Web Audio event loop callback demands for time critical fresh audio buffers or else responses back from the server will interrupt the audio playback
- create two buffer queues : browser based as well as Web Worker based, this assures the real time sensitive audio rendering done by Web Audio API is never interrupted by responses received back from server side

Feel free to contact me via the github Issues forum if you have any questions!  :-) 

[@scottstensland](http://twitter.com/scottstensland) 

