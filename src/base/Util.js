/**
 * W.Util contains various utility functions
 */

W.Util = {
    /** Extend an object with properties of one or more other objects
     */
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

    /** Create an object from a given prototype
     */
    create: Object.create || (function () {
        function F() {}
        return function (proto) {
            F.prototype = proto;
            return new F();
        };
    })(),

    /** Return unique ID of an object
     */
    stamp: function (obj) {
        obj._id = obj._id || ++W.Util.lastId;
        return obj._id;
    },

    lastId: 0,

    /** Do nothing (used as a noop throughout the code)
     */
    falseFn: function () { return false; },

    /** Round a given number to a given precision
     */
    formatNum: function (num, digits) {
        var pow = Math.pow(10, digits || 5);
        return Math.round(num * pow) / pow;
    },

    /** Trim whitespace from both sides of a string
     */
    trim: function (str) {
        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
    },

    /** Split a string into words
     */
    splitWords: function (str) {
        return W.Util.trim(str).split(/\s+/);
    },

    /** Set options to an object, inheriting parent's options as well
     */
    setOptions: function (obj, options) {
        if (!obj.hasOwnProperty('options')) {
            obj.options = obj.options ? W.Util.create(obj.options) : {};
        }
        for (var i in options) {
            obj.options[i] = options[i];
        }
        return obj.options;
    },

    /** Make a URL with GET parameters out of a set of properties/values
     */
    getParamString: function (obj, existingUrl, uppercase) {
        var params = [];
        for (var i in obj) {
            params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
        }
        return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
    },

    isArray: Array.isArray || function (obj) {
        return (Object.prototype.toString.call(obj) === '[object Array]');
    },

    /** Logger
     */
    write: function() {
        if (!W.debug || !arguments.length) {
            return;
        }

        var
            // Get method
            method = arguments[0],
            console = window.console;
        // Check browser support
        if (!console[method]) {
            console[method] = function() {};
        }
        // If there are only 1 argument - use console.log
        if (arguments.length === 1) {
            return console.log(arguments[0]);
        }
        // Check our own method "stringify"
        if (method === 'stringify') {
            var
                data = arguments[1];
            // Check if it is object
            if (data === Object(data) && JSON) {
                try {
                    data = JSON.stringify(data);
                } catch (e) {}
            }
            return console.log(data);
        }
        return console[method].apply(console, Array.prototype.slice.call(arguments, 1));
    }
};

// shortcuts for most used utility functions
W.extend = W.Util.extend;
W.stamp = W.Util.stamp;
W.setOptions = W.Util.setOptions;
W.logger = W.Util.write;