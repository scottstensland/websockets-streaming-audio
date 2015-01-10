
var common_utils = (function() {

// ---------------------------

function setClone( ab ) {

      var f32 = new Float32Array(ab.length);
      f32.set(ab);
      return f32;
    }

// http://www.html5rocks.com/en/tutorials/webgl/typed_arrays/
// function memcpy(dst, dstOffset, src, srcOffset, length) {
//   var dstU8 = new Uint8Array(dst, dstOffset, length);
//   var srcU8 = new Uint8Array(src, srcOffset, length);
//   dstU8.set(srcU8);
// };


function memcpy_float_32_bit(dst, dstOffset, src, srcOffset, length) {

  var destination_float = new Float32Array(dst, dstOffset, length);
  var source_float      = new Float32Array(src, srcOffset, length);
  destination_float.set(source_float);

  return destination_float;
};





function time() {
  var now = new Date();
  var time = /(\d+:\d+:\d+)/.exec(now)[0] + ':';
  for (var ms = String(now.getMilliseconds()), i = ms.length - 3; i < 0; ++i) {
    time += '0';
  }
  return time + ms;
}

function source(s) {
  if (self.importScripts) {
    return '<span style="color:red;">worker_log:</span> ';
  } else {
    return '<span style="color:green;">thread:</span> ';
  }
}

function seconds(since) {
  return (new Date() - since) / 1000.0;
}

function toMB(bytes) {
  return Math.round(bytes / 1024 / 1024);
}


function toKB(bytes) {
  return Math.round(bytes / 1024);
}

// ---------------------------


function log(str) {
  var elem = document.getElementById('result');
  var log = function(s) {
   elem.innerHTML += ''.concat(time(), ' ', s, '\n');
  };
  log(str);
}

// --------------------

return {

	log : log,
	source : source,
	time : time,
	seconds : seconds,
	toMB : toMB,
	toKB : toKB,
	memcpy_float_32_bit : memcpy_float_32_bit

}

}());