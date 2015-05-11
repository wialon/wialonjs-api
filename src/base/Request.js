/**
 * W.Request - class performs remote requests
 */

W.Request = W.Class.extend({

    options: {},

    _id: 0,
    _url: '',
    _io: null,
    _counter: 0,
    _requests: [],
    _callbacks: [],
    _frameReady: false,

    /** Constructor
     */
    initialize: function (url, path, options) {
        options = W.setOptions(this, options);
        path = path || '/wialon/post.html';

        this._url = this._createFullUrl(url) + path;
        this._id = this._url;

        // create iframe
        this._io = document.createElement('iframe');
        this._io.style.display = 'none';
        this._io.setAttribute('src', this._url);

        // bind events
        this._io.onload = this._frameLoaded.bind(this);
        window.addEventListener('message', this._receiveMessage.bind(this), false);

        // append iframe to body
        document.body.appendChild(this._io);
    },

    /** Execute simple Remote API request
     */
    api: function (svc, params, callback) {
        this.send('/wialon/ajax.html?svc=' + svc, params, callback, callback);
    },

    /** Process request sending
     */
    send: function (url, params, success, error) {
        var data = {
            id: ++this._counter,
            url: url,
            params: this._urlEncodeData(params),
            source: this._id
        };

        var win = this._io.contentWindow;
        if (win) {
            var sdata = JSON.stringify(data);
            this._callbacks[this._counter] = [success, error, sdata, 0];

            if (this._frameReady) {
                win.postMessage(sdata, this._url);
            } else {
                this._requests.push(sdata);
            }
        } else {
            error();
        }
    },

    _createFullUrl: function(url) {
        if (!url) {
            var loc = document.location;
            url = loc.protocol + '//' + loc.hostname + (loc.port.length ? ':' + loc.port : '');
        }
        return url;
    },

    _receiveMessage: function(evt) {
        var data = {error: -1};
        try {
            data = JSON.parse(evt.data);
        } catch (e) {
            try {
                /* jshint evil: true */
                data = eval('(' + evt.data + ')');
            } catch (e) {
                W.logger('warn', 'Invalid JSON');
            }
        }

        if (data.source !== this._id) {
            return;
        }

        if (!data.id) {
            this._frameReady = true;
            this._frameLoaded();
        } else {
            var callback = this._callbacks[data.id];
            if (callback) {
                // resend request
                if (data && data.text && data.text.error && data.text.error === 1003 && callback[3] < 3) {
                    callback[3]++;
                    // restart timer
                    if (callback[4] && callback[5]) {
                        clearTimeout(callback[5]);
                        callback[5] = setTimeout(W.bind(this._timeout, this, this._counter), callback[4] * 1000);
                    }
                    // async call
                    if (this._io.contentWindow) {
                        setTimeout(W.bind(function(request) {
                            this._io.contentWindow.postMessage(request, this._url);
                        }, this, callback[2]), Math.random() * 1000);
                        return;
                    }
                }
                if (callback[data.error]) {
                    callback[data.error](data.text);
                }
                if (callback[4] && callback[5]) {
                    clearTimeout(callback[5]);
                }
                delete this._callbacks[data.id];
            }
        }
    },

    _frameLoaded: function () {
        if (!this._frameReady) {
            this._io.contentWindow.postMessage('{id: 0, source:"' + this._id + '"}', this._url);
        } else {
            while (this._requests.length) {
                this._io.contentWindow.postMessage(this._requests.pop(), this._url);
            }
        }
    },

    _timeout: function (id) {
        var callback = this._callbacks[id];
        if (callback) {
            if (callback[1]) {
                callback[1]();
            }
            delete this._callbacks[id];
        }
    },

    _urlEncodeData: function (data) {
        var arr = [];
        if (typeof data === 'object') {
            for (var n in data) {
                if (typeof data[n] === 'object') {
                    arr.push(n + '=' + encodeURIComponent(JSON.stringify(data[n])));
                } else {
                    arr.push(n + '=' + encodeURIComponent(data[n]));
                }
            }
            return arr.join('&');
        }
        return '';
    }
});

W.request = function (url, options) {
    return new W.Request(url, options);
};