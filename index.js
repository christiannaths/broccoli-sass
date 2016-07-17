var sass = require('node-sass')
var Plugin = require('broccoli-plugin');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var mkdirp = require('mkdirp');

SassCompiler.prototype = Object.create(Plugin.prototype);
SassCompiler.prototype.constructor = SassCompiler;
function SassCompiler(inputNode, options) {
  options = options || {};

  if( !options.inputFile ) {
    throw new Error(`You must specify an input file`)
  }

  var fileName = path.parse(options.inputFile).name;
  if( !options.inputFile ) options.outputFile = fileName + '.html';


  if (!(this instanceof SassCompiler)) {
    return new SassCompiler(inputNode, options)
  }

  if (!!Array.isArray(inputNode)) {
    throw new Error(
      `Unexpected array for first argument
        - did you mean 'node' instead of ['node']?
      `
    )
  }

  var fileName = path.parse(options.inputFile).name;
  if( !options.inputFile ) options.outputFile = fileName + '.html';


  if (!(this instanceof SassCompiler)) {
    return new SassCompiler(inputNode, options)
  }

  Plugin.call(this, [inputNode], {
    annotation: options.annotation
  });

  this.inputNode = inputNode
  this.inputFile = options.inputFile
  this.outputFile = options.outputFile || fileName + '.css'
  this.options = options
}

var customImporter = function(url, prev, done) {

  if(!glob.hasMagic(url)) return ({file: url});

  // search for scss | sass files if no extension provided

  // url is a glob, like foo/*.sass, resolve to importing all matching files, so
  // if there is foo/1.sass and foo/2.sass, it will import both of those files
  var cwd = path.dirname(prev);
  var files = glob.sync(url, { cwd: cwd});
  var ret = { contents: "\n" };

  // import all the matched files, passing through the current file. this is
  // because if you didn't, the path will resolve relative to foo/*.sass,
  // which will fail since that is not an actual path.
  files.forEach(function(file) {

    var ext = path.extname(file)
    var abspath = path.resolve(cwd, file)

    if(/^\.s[ac]ss$/.test(ext) && prev !== abspath) {
      ret.contents += '@import "' + file + "\";\n"
    }
  })

  return (ret);

};

SassCompiler.prototype.build = function() {
  var destFile = path.join(this.outputPath, this.outputFile)
  mkdirp.sync(path.dirname(destFile))

  var sassOptions = {
    file: path.join(this.inputPaths[0], this.inputFile),
    includePaths: this.inputPaths,
    importer: customImporter,
    imagePath: this.options.imagePath,
    outputStyle: this.options.outputStyle,
    precision: this.options.precision,
    sourceComments: this.options.sourceComments,
  }

  result = sass.renderSync(sassOptions)
  fs.writeFileSync(destFile, result.css)
};

module.exports = SassCompiler;
