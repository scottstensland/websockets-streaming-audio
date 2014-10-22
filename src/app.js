
var streaming_audio_server = function() {

"use strict";

console.log(require('../package.json').name, require('../package.json').version);

var path = require('path');

var working_dir = path.join(__dirname, "/");

var working_app = path.join(working_dir, "local_app");

console.log("working_app ", working_app);

var app_obj = require(working_app);

console.log("app_obj ", app_obj);

app_obj.launch_server(working_dir);

// -----------------------------------------------------------------------  //

}(); //  streaming_audio_server = function()

