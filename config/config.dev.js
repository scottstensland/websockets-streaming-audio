
var config = require('./config.global');

config.env = "dev";
config.hostname = 'test.example';

//    media_path   <--  a double quote : delimited list of full paths to reach dirs containing 
//                                       audio media files  IE. song files in WAV format

config.media_path = "/home/stens/Dropbox/Documents/data/audio:/some/full/path/to/dir/of/files";

module.exports = config;


