var fs = require('fs'),
    UglifyJS = require('uglify-js'),
    zlib = require('zlib'),

    deps = require('./deps.js').deps;

function getFiles(compsBase32) {
  var memo = {},
      comps;

  if (compsBase32) {
    comps = parseInt(compsBase32, 32).toString(2).split('');
    console.log('Managing dependencies...');
  }

  function addFiles(srcs) {
    for (var j = 0, len = srcs.length; j < len; j++) {
      memo[srcs[j]] = true;
    }
  }

  for (var i in deps) {
    if (comps) {
      if (parseInt(comps.pop(), 2) === 1) {
        console.log(' * ' + i);
        addFiles(deps[i].src);
      } else {
        console.log('   ' + i);
      }
    } else {
      addFiles(deps[i].src);
    }
  }

  console.log('');

  var files = [];

  for (var src in memo) {
    files.push('src/' + src);
  }

  return files;
}

exports.getFiles = getFiles;

function getSizeDelta(newContent, oldContent, fixCRLF) {
  if (!oldContent) {
    return ' (new)';
  }
  if (newContent === oldContent) {
    return ' (unchanged)';
  }
  if (fixCRLF) {
    newContent = newContent.replace(/\r\n?/g, '\n');
    oldContent = oldContent.replace(/\r\n?/g, '\n');
  }
  var delta = newContent.length - oldContent.length;

  return delta === 0 ? '' : ' (' + (delta > 0 ? '+' : '') + delta + ' bytes)';
}

function loadSilently(path) {
  try {
    return fs.readFileSync(path, 'utf8');
  } catch (e) {
    return null;
  }
}

function combineFiles(files) {
  var content = '';
  for (var i = 0, len = files.length; i < len; i++) {
    content += fs.readFileSync(files[i], 'utf8') + '\n\n';
  }
  return content;
}

function bytesToKB(bytes) {
    return (bytes / 1024).toFixed(2) + ' KB';
};

exports.build = function (callback, version, compsBase32, buildName) {

  var files = getFiles(compsBase32);

  console.log('Concatenating and compressing ' + files.length + ' files...');

  var copy = fs.readFileSync('src/copyright.js', 'utf8').replace('{VERSION}', version),
      intro = '(function (window) {',
      outro = '}(window));',
      newSrc = copy + intro + combineFiles(files) + outro,

      pathPart = 'dist/wialon' + (buildName ? '-' + buildName : ''),
      srcPath = pathPart + '-src.js',

      oldSrc = loadSilently(srcPath),
      srcDelta = getSizeDelta(newSrc, oldSrc, true);

  console.log('\tUncompressed: ' + bytesToKB(newSrc.length) + srcDelta);

  if (newSrc !== oldSrc) {
    fs.writeFileSync(srcPath, newSrc);
    console.log('\tSaved to ' + srcPath);
  }

  var path = pathPart + '.js',
      oldCompressed = loadSilently(path),
      newCompressed = copy + UglifyJS.minify(newSrc, {
          warnings: true,
          fromString: true
      }).code,
      delta = getSizeDelta(newCompressed, oldCompressed);

  console.log('\tCompressed: ' + bytesToKB(newCompressed.length) + delta);

  var newGzipped,
      gzippedDelta = '';

  function done() {
    if (newCompressed !== oldCompressed) {
      fs.writeFileSync(path, newCompressed);
      console.log('\tSaved to ' + path);
    }
    console.log('\tGzipped: ' + bytesToKB(newGzipped.length) + gzippedDelta);
    callback();
  }

  zlib.gzip(newCompressed, function (err, gzipped) {
    if (err) { return; }
    newGzipped = gzipped;
    if (oldCompressed && (oldCompressed !== newCompressed)) {
      zlib.gzip(oldCompressed, function (err, oldGzipped) {
        if (err) { return; }
        gzippedDelta = getSizeDelta(gzipped, oldGzipped);
        done();
      });
    } else {
      done();
    }
  });
};

