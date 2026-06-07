const fs = require("fs");
const path = require("path");
const http = require("http");
const express = require("express");
const { Server: WebSocketServer } = require("ws");
const server_streaming_audio = require("./server_streaming_audio.js");
const cfg = require("../config");

const launch_server = (working_dir) => {
    "use strict";

    console.log("TOP of launch_server");
    const pkg = require('../package.json');
    console.log(pkg.name, pkg.version);

    const app = express();
    const port = process.env.PORT || 8080;

    const media_dir = cfg.media_dir;
    console.log("here is media_dir ", media_dir);
    server_streaming_audio.set_media_dir(media_dir);

    const media_path = cfg.media_path;
    console.log("here is media_path ", media_path);
    server_streaming_audio.set_media_path(media_path);

    // API endpoint to dynamically discover WAV files in the media folder
    app.get("/api/media", (req, res) => {
        // Resolve target media directory (usually working_dir/../media)
        const fullMediaDir = path.resolve(working_dir, media_dir);
        
        fs.readdir(fullMediaDir, (err, files) => {
            if (err) {
                console.error("Error reading media directory:", err);
                return res.status(500).json({ error: "Failed to read media files" });
            }

            const wavFiles = files
                .filter(file => file.toLowerCase().endsWith(".wav"))
                .map(file => {
                    try {
                        const stats = fs.statSync(path.join(fullMediaDir, file));
                        return {
                            name: file,
                            size: stats.size
                        };
                    } catch (e) {
                        return {
                            name: file,
                            size: 0
                        };
                    }
                });

            res.json(wavFiles);
        });
    });

    app.use(express.static(working_dir));

    const server = http.createServer(app);
    server.listen(port, () => {
        console.log(`http server listening on ${port}`);
        console.log(`http://localhost:${port}`);
    });

    console.log("about to call new WebSocketServer");
    const wss = new WebSocketServer({ server });
    console.log("websocket server created");

    wss.on("headers", (headers) => {
        for (const curr_property of Object.keys(headers)) {
            console.log(`headers property ${curr_property} -->${headers[curr_property]}<-- `);
        }
    });

    wss.on("error", (error) => {
        console.error("ERROR - seeing fault on WebSocketServer : ");
        for (const curr_property of Object.keys(error)) {
            console.log(`error property ${curr_property} -->${error[curr_property]}<-- `);
        }
    });

    wss.on("connection", (ws) => {
        console.log("OK cool ... just opened up a client connection ...");

        let ID_timeout;
        const run = () => {
            console.log(process.memoryUsage());
            ws.send(JSON.stringify(process.memoryUsage()), () => {});
            ID_timeout = setTimeout(run, 360000);
        };
        run();

        console.log("websocket connection open");

        ws.on("message", (received_data) => {
            let received_json;
            try {
                received_json = JSON.parse(received_data);
            } catch (error) {
                console.error(`ERROR - received NON JSON message -->${error}<-- received_data : ${received_data}`);
                return;
            }
            server_streaming_audio.route_msg(received_json, ws);
        });

        ws.on("error", (event) => {
            console.error(`ERROR on websocket connection: ${event}`);
        });

        ws.on("close", () => {
            console.log("websocket connection close");
            clearTimeout(ID_timeout);
        });
    });
};

exports.launch_server = launch_server;
