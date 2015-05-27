/* jshint -W079 */
/* global define */

var W = {
    version: '0.0.4',
    debug: false
};

function expose() {
    var oldW = window.W;

    W.noConflict = function () {
        window.W = oldW;
        return this;
    };

    window.W = W;
}


// define Wialon for Node module pattern loaders, including Browserify
if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = W;
// define Wialon as an AMD module
} else if (typeof define === 'function' && define.amd) {
    define(W);
}
// define Wialon as a global W variable, saving the original W to restore later if needed
if (typeof window !== 'undefined') {
    expose();
}