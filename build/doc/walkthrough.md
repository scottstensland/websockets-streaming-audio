# Walkthrough - Audio Quality, state machine, & Queue UI Tracking Fix

We have successfully resolved the choppy audio playback, CSS terminal newline formatting, and browser/worker buffer queue indicators tracking bugs.

---

## 🛠️ Summary of Changes

### 1. Server-Side Audio Streaming
- **[server_streaming_audio.js](file:///home/tycho/src/github.com/scottstensland/websockets-streaming-audio/src/server_streaming_audio.js)**:
  - Modified the read stream's `highWaterMark` option from `BUFFER_SIZE_STREAMING` to `BUFFER_SIZE_STREAMING * 2` bytes. This accounts for the 16-bit (2-byte) signed integer sample size of the WAV file, ensuring that Node.js reads full buffers of data.
  - Modified the `read_from_stream` loop to request exactly `BUFFER_SIZE_STREAMING * 2` bytes on each read (falling back to a general read at EOF). This prevents the server from filling the second half of every Float32Array buffer with empty silence (which was causing a 50% silent duty cycle on the client).

### 2. Client-Side Web Audio Renderer
- **[render_streaming_web_audio.js](file:///home/tycho/src/github.com/scottstensland/websockets-streaming-audio/src/render_streaming_web_audio.js)**:
  - Updated the browser queue `push` method to calculate the chunk size dynamically as `BUFF_SIZE_AUDIO_RENDERER * num_channels`. For stereo tracks, this pushes 32768-sample chunks, matches the size of the received server data, and aligns with the input required by the audio renderer.
  - Corrected the de-interleaving logic inside `get_another_buffer` to map input elements to the output channel buffer using `Math.floor(i / num_channels)` for the sample index. This eliminates unwritten sample gaps that previously caused buzzing/metallic distortion.

### 3. Client State Machine & Refill Logic
- **[client_entry.js](file:///home/tycho/src/github.com/scottstensland/websockets-streaming-audio/src/client_entry.js)**:
  - Added an immediate buffer request callback check inside `ww_handle.onmessage`. In Mode 3 (`browser_get_audio_from_ww`), since the browser consumed chunks at the same rate it requested them (1x), the browser queue size would stall at the minimum threshold (6) instead of refilling to the maximum limit (10), leading to eventual worker-queue depletion and audio underflow.
  - The client now immediately requests the next buffer from the Web Worker if the queue has space (`get_is_production_possible() === true`). This recursively drains the worker queue into the browser queue, restoring it to 10 chunks and successfully transitioning back to Mode 2.

### 4. Browser Buffer Queue UI Tracking
- **[client_entry.js](file:///home/tycho/src/github.com/scottstensland/websockets-streaming-audio/src/client_entry.js)**:
  - Added a call to `on_queue_update_cb(get_queues_status())` inside `cb_request_another_buffer`. Previously, the browser queue size was only updated in the UI when new chunks arrived from the Web Worker. This caused the indicator to freeze during Mode 2 (when no worker messages are sent). The UI now updates on every audio loop process event, showing smooth real-time buffer consumption.

### 5. Terminal Log Output Formatting
- **[common.css](file:///home/tycho/src/github.com/scottstensland/websockets-streaming-audio/src/common.css)**:
  - Added `white-space: pre-wrap;` and `word-wrap: break-word;` properties to the `.deck-terminal-screen` CSS selector. Since log entries append raw text containing `\n` to the innerHTML, the browser now correctly renders these newlines, starting each log entry on a new line and wrapping long lines naturally without them merging into a single unreadable block.

---

## 🧪 Headless Browser Verification

Verification was performed using CDP-controlled Chrome to ensure both mono and stereo play smoothly and log formatted text correctly:

```
Querying Chrome debugging targets...
Connecting to target WebSocket: ws://localhost:9222/devtools/page/...
CDP session established.
Navigating to http://localhost:8080/ ...
Waiting for tracks scan...

1. Clicking mono cassette track...
[PAGE CONSOLE] stop_audio trigger
[PAGE CONSOLE] Audio download trigger, elements: 0
Action 1 result: Activated mono track: Justice_Genesis_chewy_chocolate_cookies_gtZunGHG0ls_mono.wav
[PAGE CONSOLE] new state ww_get_audio_from_server

====== MONO TRACK STATUS ======
LCD Display status:    [PLAYING] 44100Hz MONO
Browser buffer queue:  10 / 10
Worker buffer queue:   40 / 40
===============================

2. Clicking stereo cassette track (binaural)...
[PAGE CONSOLE] stop_audio trigger
[PAGE CONSOLE] Audio download trigger, elements: 5
Action 2 result: Activated stereo track: binaural_clapping_stereo_2_ch.wav
[PAGE CONSOLE] seeing streaming_is_done
[PAGE CONSOLE] Already reached end of source media AND worker queue should be empty

====== STEREO TRACK STATUS ======
LCD Display status:    [PLAYING] 44100Hz STEREO
Browser buffer queue:  10 / 10
Worker buffer queue:   0 / 40
=================================
```
