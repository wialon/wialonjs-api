/*
Wialon building scripts.

To use, install Node, then run the following commands in the project root:

    npm install -g jake
    npm install

*/

var build = require('./build/build.js'),
    version = require('./src/Wialon.js').version;

desc('Combine and compress Wialon source files');
task('build', {async: true}, function (compsBase32, buildName) {
	var v;

	jake.exec('git log -1 --pretty=format:"%h"', {breakOnError: false}, function () {
		build.build(complete, v, compsBase32, buildName);

	}).on('stdout', function (data) {
		v = version + ' (' + data.toString() + ')';
	}).on('error', function () {
		v = version;
	});
});

desc('Watch source changes files');
watchTask(['build'], function () {
  this.watchFiles.include();
});


task('default', ['build']);

jake.addListener('complete', function () {
  //process.exit();
});