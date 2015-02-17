/*
 * W.Session is the central class of the API
 */

W.Session = W.Evented.extend({

  options: {
    eventsTimeout: 10,
  },

  _sid: null,
  _request: null,
  _serverTime: 0,
  _eventsInterval: 0,

  _classes: {},
  _items: {},


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
        this._loginCallback.bind(this, callback),
        this._loginCallback.bind(this, callback)
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
      this._classes = data._classes;

      // start eventss timer
      if (this.options.eventsTimeout) {
        this._eventsInterval = setInterval(
          this.getEvents.bind(this),
          this.options.eventsTimeout * 1000
        );
      }
    }

    // return data in callback
    callback && callback(data);
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
    if (data.events.length > 0) {
      debugger;
    }
  },

  updateDataFlags: function (spec, callback) {
    if (this._sid) {
      var params = {
        spec: spec
      };

      this._request.send("/wialon/ajax.html?svc=core/update_data_flags",
        {params: params, sid: this._sid},
        this._updateDataFlagsCallback.bind(this, callback),
        this._updateDataFlagsCallback.bind(this, callback)
      );
    }
  },

  _updateDataFlagsCallback: function (callback, items) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].d) {
        this._items[items[i].i] = items[i].d;
      } else if (items[i].i in this._items) {
        this._items[items[i].i] = null;
        delete this._items[items[i].i];
      }
      // ToDo: generate arrays by type?...
    }
    callback && callback(items);
  }

});

W.session = function (url, options) {
  return new W.Session(url, options);
};