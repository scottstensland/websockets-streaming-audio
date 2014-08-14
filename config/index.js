
var environment_mode = process.env.NODE_ENV || "dev",
	cfg = require("./config." + environment_mode);

module.exports = cfg;


