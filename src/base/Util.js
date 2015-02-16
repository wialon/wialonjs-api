/*
 * W.Util contains various utility functions
 */

W.Util = {
  // extend an object with properties of one or more other objects
  extend: function (dest) {
    var i, j, len, src;

    for (j = 1, len = arguments.length; j < len; j++) {
      src = arguments[j];
      for (i in src) {
        dest[i] = src[i];
      }
    }
    return dest;
  },

  // create an object from a given prototype
  create: Object.create || (function () {
    function F() {}
    return function (proto) {
      F.prototype = proto;
      return new F();
    };
  })(),

  // bind a function to be called with a given context
  bind: function (fn, obj) {
    var slice = Array.prototype.slice;

    if (fn.bind) {
      return fn.bind.apply(fn, slice.call(arguments, 1));
    }

    var args = slice.call(arguments, 2);

    return function () {
      return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
    };
  },

// return unique ID of an object
  stamp: function (obj) {
    obj._id = obj._id || ++W.Util.lastId;
    return obj._id;
  },

  lastId: 0,

  // do nothing (used as a noop throughout the code)
  falseFn: function () { return false; },

  // round a given number to a given precision
  formatNum: function (num, digits) {
    var pow = Math.pow(10, digits || 5);
    return Math.round(num * pow) / pow;
  },

  // trim whitespace from both sides of a string
  trim: function (str) {
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
  },

  // split a string into words
  splitWords: function (str) {
    return W.Util.trim(str).split(/\s+/);
  },

  // set options to an object, inheriting parent's options as well
  setOptions: function (obj, options) {
    if (!obj.hasOwnProperty('options')) {
      obj.options = obj.options ? W.Util.create(obj.options) : {};
    }
    for (var i in options) {
      obj.options[i] = options[i];
    }
    return obj.options;
  },

  // make a URL with GET parameters out of a set of properties/values
  getParamString: function (obj, existingUrl, uppercase) {
    var params = [];
    for (var i in obj) {
      params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
    }
    return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
  },

  isArray: Array.isArray || function (obj) {
    return (Object.prototype.toString.call(obj) === '[object Array]');
  }
};

// shortcuts for most used utility functions
W.extend = W.Util.extend;
W.stamp = W.Util.stamp;
W.bind = W.Util.bind;
W.setOptions = W.Util.setOptions;
