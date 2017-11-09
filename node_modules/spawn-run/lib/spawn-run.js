var util = require('util');
var spawn = require('child_process').spawn;
var npmPath = require('npm-path');

module.exports = function (command, options) {
  var file, args, newPath, env;
  
  options = options || {};
  newPath = npmPath.getSync(options);
  env = Object.create(options.env);
  env[npmPath.PATH] = newPath;
  options.env = env;

  if (process.platform === 'win32') {
    file = 'cmd.exe';
    args = ['/s', '/c', '"' + command + '"'];
    options = util._extend({}, options);
    options.windowsVerbatimArguments = true;
  }
  else {
    file = '/bin/sh';
    args = ['-c', command];
  }
  return spawn(file, args, options);
};
