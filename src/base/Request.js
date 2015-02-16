/*
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

  initialize: function (url, options) { // (HTMLElement or String, Object)
    options = W.setOptions(this, options);
    
    this._url = this._createFullUrl(url) + '/wialon/post.html';
    this._id = this._url;

    // create iframe
    this._io = document.createElement('iframe');
    this._io.style.display = 'none';
    if (window.attachEvent) {
      this._io.attachEvent('onload', W.bind(this._frameLoaded, this));
    } else {
      this._io.addEventListener("load", W.bind(this._frameLoaded, this), false);
    }
    this._io.setAttribute("src", this._url);
    document.body.appendChild(this._io);

    if (window.addEventListener) {
      window.addEventListener("message", W.bind(this._recieveMessage, this), false);
    } else {
      window.attachEvent("onmessage", W.bind(this._recieveMessage, this));
    }
  },

  send: function (url, params, success, error, timeout) {
    var data = {id: ++this._counter, url: url, params: this._urlEncodeData(params), source: this._id};
    var win = this._io.contentWindow;
    if (win) {
      var sdata = JSON.stringify(data);
      this._callbacks[this._counter] = [success, error, sdata, 0, timeout];
      
      if (timeout) {
        this._callbacks[this._counter].push(setTimeout(W.bind(this._timeout, this, this._counter), timeout * 1000));
      }
      
      if (this._frameReady){
        win.postMessage(sdata, this._url);
      } else {
        this._requests.push(sdata)
      }
    }
  },

  _createFullUrl: function(url) {
    if (document && !url) {
      var loc = document.location;
      url = loc.protocol + "//" + loc.hostname + (loc.port.length ? ":" + loc.port : "");
    }
    return url;
  },

  _recieveMessage: function() {
    var data = {error: -1};
    try {
      data = JSON.parse(event.data);
    } catch(e) {
      try {
        data = eval('('+event.data+')');
      } catch(e) {
        console.warn('Invalid JSON');
      }
    }
    
    if (data.source != this._id) {
        return;
    }
    
    if (!data.id) {
      this._frameReady = true;
      this._frameLoaded();
    } else {
      var callback = this._callbacks[data.id];
      if (callback) {
        // resend request
        if (data && data.text && data.text.error && data.text.error == 1003 && callback[3] < 3) {
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
      this._io.contentWindow.postMessage("{id: 0, source:'" + this._id + "'}", this._url);
      return;
    }
    for (var i = 0; i < this._requests.length; i++) {
      this._io.contentWindow.postMessage(this._requests[i], this._url);
    }
    this._requests = [];
  },

  _timeout: function (id) {
    var callback = this._callbacks[id];
    if (callback) {
      if (callback[1])
        callback[1]();
      delete this._callbacks[id];
    }
  },

  _urlEncodeData: function (data) {
    var arr = [];
    var sid = false;
    if (typeof data == "object") {
      for (var n in data) {
        if (typeof data[n] == "object") {
          arr.push(n + "=" + encodeURIComponent(JSON.stringify(data[n])));
        } else {
          arr.push(n + "=" + encodeURIComponent(data[n]));
        }
        if (n == "sid") {
          sid = true;
        }
      }
      return arr.join("&") + (sid ? "&sid=" + sid : "");
    }
    return sid ? "&sid=" + sid : "";
  }
});

W.request = function (url, options) {
  return new W.Request(url, options);
};