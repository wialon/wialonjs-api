/*
Wialon building scripts.

To use, install Node, then run the following commands in the project root:

    npm install -g jake
    npm install

*/

var fs = require('fs'),
    build = require('./build/build.js'),
    jshint = require('jshint').JSHINT,
    version = require('./src/Wialon.js').version;

desc('Combine and compress Wialon source files');
task('build', {async: true}, function (compsBase32, buildName) {
    var v;

    jake.exec('git log -1 --pretty=format:"%h"', {breakOnError: false}, function () {
        build.build(complete, v, compsBase32, buildName);
    }).on('stdout', function () {
        v = version;
    }).on('error', function () {
        v = version;
    });
});

desc('Watch source changes files');
watchTask(['build'], function () {
    this.watchFiles.include();
});

desc('Check code with jshint');
task('jshint', function () {
    // lint file
    function lintFile(filename, options, globals) {
        var source = fs.readFileSync(filename, 'utf8');
        var pass = jshint(source, options, globals);
        if (pass === true) {
            console.log('\t', filename, 'ok');
        }
        else {
            console.log('\t', filename, 'failed');
            for (var i = 0; i < jshint.errors.length; i++) {
                var error = jshint.errors[i];
                if (!error) continue;

                if (error.evidence) console.log('\t', error.line + ': ' + error.evidence.trim());
                console.log('\t\t' + error.reason);
            }
        }
        return pass;
    }
    // lint list of files
    function lintFiles(files, options, globals) {
        var allPass = true;
        files.forEach(function(filename) {
            var pass = lintFile(filename, options, globals);
            allPass = allPass && pass;
        });
        return allPass;
    }
    // construct files list
    var files = new jake.FileList();
    files.include('src/**/*.js');
    // get lint options
    var options = JSON.parse(fs.readFileSync('.jshintrc'));
    // run lint
    console.log('Jshint ' + files.toArray().length + ' files...');
    lintFiles(files, options, options.predef || []);
});

desc('Run JS Code Style checking');
task('jscs', {async: true}, function () {
    console.log('Start JS Code Style checking...');
    jake.exec('./node_modules/.bin/jscs src/**/*.js', {breakOnError: false}, function () {
        complete();
    }).on('stdout', function (data) {
        console.log('\t', data.toString());
    });
});

task('default', ['jshint', 'jscs', 'build']);

jake.addListener('complete', function () {
  //process.exit();
});