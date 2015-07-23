// 参考 https://github.com/imagemin/imagemin-jpegtran/blob/master/index.js
var isJpg = require('is-jpg');
var jpegtran = require('jpegtran-bin');
var mutil = require('miaow-util');
var spawn = require('child_process').spawn;

var pkg = require('./package.json');

function minify(option, cb) {

  // 如果有缓存就用缓存内容
  var cachedContents = this.getCachedContentsSync();
  if (cachedContents) {
    this.destContents = cachedContents;
    return cb();
  }

  if (!isJpg(this.contents)) {
    return cb();
  }

  var args = ['-copy', 'none', '-optimize'];
  var ret = [];
  var len = 0;
  var err = '';

  if (option.progressive) {
    args.push('-progressive');
  }

  if (option.arithmetic) {
    args.push('-arithmetic');
  }

  var cp = spawn(jpegtran, args);

  cp.stderr.setEncoding('utf8');
  cp.stderr.on('data', function (data) {
    err += data;
  });

  cp.stdout.on('data', function (data) {
    ret.push(data);
    len += data.length;
  });

  cp.on('error', function (err) {
    return cb(new mutil.PluginError(pkg.name, err, {
      fileName: this.srcPath
    }));
  }.bind(this));

  cp.on('close', function () {
    if (err) {
      return cb(new mutil.PluginError(pkg.name, err, {
        fileName: this.srcPath
      }));
    }

    if (len < this.contents.length) {
      this.contents = Buffer.concat(ret, len);
    }

    cb();
  }.bind(this));

  cp.stdin.on('error', function (stdinErr) {
    if (!err) {
      err = stdinErr;
    }
  });

  cp.stdin.end(this.contents);
}

module.exports = mutil.plugin(pkg.name, pkg.version, minify);
