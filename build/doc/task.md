# Tasks: Fix Choppy Audio and Buffer Mismatches

- [x] Fix server-side `highWaterMark` byte mismatch in `src/server_streaming_audio.js`
- [x] Fix client-side queue `push` chunk size mismatch in `src/render_streaming_web_audio.js`
- [x] Fix client-side de-interleaving index calculation in `src/render_streaming_web_audio.js`
- [x] Fix client-side queue refill stall in Mode 3 in `src/client_entry.js`
- [x] Trigger queue update callback when consuming chunks in `src/client_entry.js`
- [x] Style the terminal screen with white-space: pre-wrap in `src/common.css`
- [x] Verify using the headless browser verification script
