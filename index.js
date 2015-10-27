// 参考 https://github.com/imagemin/imagemin-jpegtran/blob/master/index.js
var isJpg = require('is-jpg');
var spawn = require('child_process').spawn;

var pkg = require('./package.json');

module.exports = function(options, callback) {
  var context = this;
  var contents = context.contents;

  if (!isJpg(contents)) {
    return callback();
  }

  var args = ['-copy', 'none', '-optimize'];
  var ret = [];
  var len = 0;
  var err = '';

  if (options.progressive) {
    args.push('-progressive');
  }

  if (options.arithmetic) {
    args.push('-arithmetic');
  }

  var cp = spawn('jpegtran', args);

  cp.stderr.setEncoding('utf8');
  cp.stderr.on('data', function(data) {
    err += data;
  });

  cp.stdout.on('data', function(data) {
    ret.push(data);
    len += data.length;
  });

  cp.on('error', function(err) {
    return callback(err);
  }.bind(this));

  cp.on('close', function() {
    if (err) {
      return callback(err);
    }

    if (len < contents.length) {
      context.contents = Buffer.concat(ret, len);
    }

    callback();
  }.bind(this));

  cp.stdin.on('error', function(stdinErr) {
    if (!err) {
      err = stdinErr;
    }
  });

  cp.stdin.end(contents);
};

module.exports.toString = function() {
  return [pkg.name, pkg.version].join('@');
};
