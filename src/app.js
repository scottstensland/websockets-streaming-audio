
var flavor_socket = process.env.FLAVOR_SOCKET || "new";

console.log("here is flavor_socket ", flavor_socket);


var path = require('path');

console.log("here is __dirname ", __dirname);

var parent_dir = path.join(__dirname, "/../");

console.log("here is parent_dir ", parent_dir);

var dir_suffix;

if (flavor_socket === "new") {

    dir_suffix = "src_ws";

} else {

    dir_suffix = "src_websocket";
}

var working_dir = path.join(parent_dir, dir_suffix, "/");

console.log("here is working_dir ", working_dir);

var working_app = path.join(working_dir, "local_app");

console.log("here is working_app ", working_app);

var app_obj = require(working_app);

console.log("app_obj ", app_obj);

app_obj.connect_to_server(working_dir);

app_obj.inside_local_app();


console.log("version:   0.2.4  ");
