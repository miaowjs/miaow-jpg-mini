var assert = require('assert');
var fs = require('fs-extra');
var miaow = require('miaow');
var path = require('path');

var parse = require('../index');
describe('miaow-jpg-mini', function () {
  this.timeout(10e3);

  var log;

  var cwd = path.resolve(__dirname, './fixtures');
  var output = path.resolve(__dirname, './output');

  function doCompile(cb) {
    miaow.compile({
      cwd: cwd,
      output: output,
      pack: false,
      module: {
        tasks: [
          {
            test: /\.jpg$/,
            plugins: [{
              plugin: parse,
              option: {
                progressive: true
              }
            }]
          }
        ]
      }
    }, function (err) {
      if (err) {
        console.error(err.toString());
        throw err;
      }

      log = JSON.parse(fs.readFileSync(path.join(output, 'miaow.log.json')));
      cb();
    });
  }

  before(function (done) {
    fs.emptyDirSync(output);
    doCompile(done);
  });

  it('接口是否存在', function () {
    assert(!!parse);
  });

  it('压缩', function () {
    assert.equal(log.modules['baz.jpg'].hash, 'f1dcf9bb914a76177bc42387a0e9ddeb');
  });

  it('缓存', function (done) {
    var filePath = path.join(output, 'baz.jpg');
    fs.writeFileSync(filePath, '/* load cache */');

    doCompile(function () {
      assert.equal(fs.readFileSync(filePath, {encoding: 'utf8'}), '/* load cache */');
      done();
    });
  });
});
