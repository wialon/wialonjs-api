/*
 * W.Session is the central class of the API
 */

W.Session = W.Evented.extend({

  options: {
    eventsTimeout: 10,
  },

  _request: null,

  _sid: null,

  _serverTime: 0,

  initialize: function (url, options) {
    options = W.setOptions(this, options);

    this._request = new W.Request(url);

  },

  login: function (user, password, operateAs, callback) {

    if (!this._sid) {
      var params = {
        user: user,
        password: password,
        operateAs: operateAs || ""
      };

      this._request.send("/wialon/ajax.html?svc=core/login",
        {params: params},
        W.bind(this._loginCallback, this, callback),
        W.bind(this._loginCallback, this, callback)
      );
    }

  },

  _loginCallback: function (callback, data) {
    // ToDo: validate data before callback
    if (data.error) {
      console.warn('Login error');
    } else {
      this._sid = data.eid;
      this._serverTime = data.tm;

      // ToDo: start event timer
      if (this.options.eventsTimeout) {
        setInterval(
          W.bind(this.getEvents, this),
          this.options.eventsTimeout * 1000
        );
      }


    }

    // return data in callback
    callback(data);
  },

  getEvents: function () {
    if (this._sid !== null) {
      this._request.send("/avl_evts",
        {sid: this._sid},
        this._getEventsCallback,
        this._getEventsCallback
      );

    }
  },

  _getEventsCallback: function (data) {
    this._serverTime = data.tm;
  }

});

W.session = function (url, options) {
  return new W.Session(url, options);
};