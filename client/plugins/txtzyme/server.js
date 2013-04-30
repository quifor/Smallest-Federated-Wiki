// Generated by CoffeeScript 1.4.0
(function() {
  var WebSocketServer, delay, es, fs, startServer, txtzymeDevice;

  WebSocketServer = require('ws').Server;

  fs = require('fs');

  es = require('event-stream');

  delay = function(done) {
    return setTimeout(done, 1000);
  };

  txtzymeDevice = function(done) {
    var result;
    result = null;
    if (process.platform === "win32") {
      return done("on windows...");
    }
    return fs.readdir('/dev', function(err, files) {
      var file, _i, _len;
      if (err) {
        done(err);
      }
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        if (file.match(/^ttyACM/)) {
          result = file;
        }
        if (file.match(/^cu.usbmodem1234/)) {
          result = file;
        }
      }
      if (result) {
        return done(null, "/dev/" + result);
      }
      return done("can't find txtzyme device");
    });
  };

  startServer = function(params) {
    console.log("startServer");
    return txtzymeDevice(function(err, fn) {
      var fromDevice, rawDevice, server, toDevice;
      if (err) {
        console.log(err);
        delay(function() {
          return startServer(params);
        });
        return;
      }
      toDevice = fs.createWriteStream(fn);
      toDevice.on('error', function(err) {
        console.log("trouble writing txtzyme to " + fn + ", err " + err);
        server.close();
        toDevice.end();
        return delay(function() {
          return startServer(params);
        });
      });
      rawDevice = fs.createReadStream(fn);
      rawDevice.on('error', function(err) {
        return console.log("trouble reading txtzyme from " + fn);
      });
      fromDevice = rawDevice.pipe(es.split());
      server = new WebSocketServer({
        server: params.server,
        path: '/plugin/txtzyme'
      });
      return server.on('connection', function(socket) {
        var downlink, uplink;
        console.log('connection established, listening');
        fromDevice.on('data', uplink = function(line) {
          return socket.send(line, function(err) {
            if (err) {
              return console.log('txtzyme send err', err);
            }
          });
        });
        socket.on('message', downlink = function(message) {
          return toDevice.write(message);
        });
        return socket.on('close', function(code, message) {
          console.log("txtzyme socket closed, " + code + " " + message);
          return fromDevice.removeListener('data', uplink);
        });
      });
    });
  };

  module.exports = {
    startServer: startServer
  };

}).call(this);
