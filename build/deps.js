var deps = {
  Core: {
    src: ['Wialon.js',
          'base/Util.js',
          'base/Class.js',
          'base/Events.js',
          'base/Request.js',
          'base/Session.js',
          'base/Session.Gis.js',
          'base/Session.Locale.js',
          'api/core.js',
          'api/token.js'
          ],
    desc: 'The core of the library, including OOP, events, basic units.'
  }
};

if (typeof exports !== 'undefined') {
  exports.deps = deps;
}