# Implementation Plan - Audio Quality, state machine, & Queue UI Tracking Fix

This plan addresses choppy audio playback, formatting, and UI tracking issues.

## Proposed Changes

### 1. Server-Side Audio Streaming

#### [MODIFY] [server_streaming_audio.js](file:///home/tycho/src/github.com/scottstensland/websockets-streaming-audio/src/server_streaming_audio.js)
- Update `highWaterMark` in the read stream options to `BUFFER_SIZE_STREAMING * 2` bytes.
- Ensure robust reading by using `read_stream.read(BUFFER_SIZE_STREAMING * 2)` or falling back to `read_stream.read()`.

---

### 2. Client-Side Web Audio Renderer

#### [MODIFY] [render_streaming_web_audio.js](file:///home/tycho/src/github.com/scottstensland/websockets-streaming-audio/src/render_streaming_web_audio.js)
- Update the browser queue's `push` function to chunk data at `BUFF_SIZE_AUDIO_RENDERER * num_channels` instead of `BUFF_SIZE_AUDIO_RENDERER`.
- Update `get_another_buffer` de-interleaving logic to map input elements using `Math.floor(i / num_channels)` for the output sample index.

---

### 3. Client State Machine & Refill Logic

#### [MODIFY] [client_entry.js](file:///home/tycho/src/github.com/scottstensland/websockets-streaming-audio/src/client_entry.js)
- In `ww_handle.onmessage`, when the browser is in Mode 3 (`browser_get_audio_from_ww`) and there is still space in the browser buffer queue (`get_is_production_possible() === true`), immediately request the next buffer from the Web Worker. This ensures rapid drainage of the worker queue into the browser queue, restoring it to the maximum limit and transitioning back to Mode 2.

---

### 4. Browser Buffer Queue UI Tracking

#### [MODIFY] [client_entry.js](file:///home/tycho/src/github.com/scottstensland/websockets-streaming-audio/src/client_entry.js)
- Update `cb_request_another_buffer` to call `on_queue_update_cb(get_queues_status())` whenever called by the audio rendering process loop (upon chunk consumption). This ensures real-time updates for browser queue size decrements.

---

### 5. Terminal Log Output CSS Styling

#### [MODIFY] [common.css](file:///home/tycho/src/github.com/scottstensland/websockets-streaming-audio/src/common.css)
- Add `white-space: pre-wrap;` and `word-wrap: break-word;` to the `.deck-terminal-screen` selector to ensure the `\n` characters in log messages render as new lines and don't wrap into a single continuous block.

## Verification Plan

### Automated/Manual Verification
1. Open the cassettes web app at [http://localhost:8080/](http://localhost:8080/).
2. Run the headless Chrome script `/home/tycho/.gemini/antigravity/brain/90833fc7-8b2f-470b-a5ac-32eebf993650/scratch/test_headlessly.js` to ensure the audio queue is filled continuously.
3. Verify that each telemetry log statement on the bottom screen starts on a new line and wraps nicely without merging together.
4. Manually observe the browser queue bar at the bottom: it should smoothly decrement/increment as audio plays instead of remaining frozen at 10/10.
