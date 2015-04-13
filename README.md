# wialonjs-api
Lightweight and flexible wrapper for Wialon Remote API

`wialonjs-api` helps you to work with Wialon Hosting and Wialon Local
throught [Remote API](http://sdk.wialon.com/wiki/en/sidebar/remoteapi/apiref/apiref)

## Installation
Using [Bower](http://bower.io/)
```bash
bower install wialonjs-api
```
Using [npm](https://www.npmjs.com/)
```bash
npm install wialonjs-api
```

## Usage sample
```html
<script scr='dist/wialon-src.js'></script>
<script>
    // create Wialon session instance
    var sess = new W.Session('https://hst-api.wialon.com', {
        eventsTimeout: 5
    });

    // set Remote API 'svc' param
    var svc = 'core/login';
    // set Remote API 'params' param
    var params = {
        user: 'wialon_test',
        password: 'test'
    };
    // Execute request
    sess.execute(svc, params, function(data) {
        // callback
        console.log('login succeed');
    });
</script>
```

## Demo
* Pure JS login [demo](examples/simple)
* Pure JS locator [demo](examples/locator)
* [Polymer](https://www.polymer-project.org) [demo](examples/polymer)

## API
Library all library classes use `W` namespace.

### W.Session
The central class of the API. Store all information about session, SID,
cache results, can execute `avl_event` automatically, etc.

#### Usage sample
```javascript
    // Wialon server url
    var url = 'https://hst-api.wialon.com';
    // internal session options
    var options = {
        eventsTimeout: 5
    };
    // create Session instance
    var sess = new W.Session(url, options);

    // login
    sess.execute('core/login', {user: 'wialon_test', password: 'test'}, function (data) {
        // login callback
        // sid automatically saved, you can exec next request
    });
```

#### Options
* `eventsTimeout` Timeout for auto executing `avl_evts` request. Set `0` to prevent `avl_evts` request sending. Default: 10 (sec).

#### Methods
* `checkFeature` Check if billing service is avaible for given session
* `execute` Execute Remote API request
* `getBaseUrl` Return session base url (e.g. https://hst-api.wialon.com)
* `getCurrentUser` Return currently logged in user
* `getEvents` Get events from server (execute 'avl_evts' request). Run automaticaly if `options.eventsTimeout` != 0.
* `getFeatures` Return avaible billing services for given session
* `getItem` Return item loaded in session by id. Execute `core/update_data_flag` before use this method.
* `getItems` Return items loaded in session filtered by type. Execute `core/update_data_flag` before use this method.
* `getSid` Return session id or null if not logged in

#### Events
`W.Session` fires following events
* `itemChanged` item changed (renamed, flags changed etc.)
* `itemDeleted` item deleted from Wialon
* `positionChanged` item position changed
* `featuresChanged` billing services avaible for current session changed
* `lastMessageChanged` item's last message changed (new message obtained)
* `messageParamsChanged` item's messages params changed

### W.Request
Helps to performs remote requests

#### Usage sample
```javascript
    // create Request instance
    var req = new W.Request('https://hst-api.wialon.com');

    // execute 'core/login' request with 'api' method
    req.api(
        'core/login',
        {user: 'wialon_test', password: 'test'},
        function() {
            // callback
        }
    );

    // execute 'core/login' request with 'send' method
    req.send(
        '/wialon/ajax.html?svc=core/login',
        {user: 'wialon_test', password: 'test'},
        function success() {
            // success callback
        },
        function error() {
            // error callback
        }
    );
```

#### Methods
* `api` Execute simple Remote API request
* `send` Process request sending

### W.Class
Powers the OOP facilities and is used to create library classes.

#### Usage sample
```javascript
var MyClass = W.Class.extend({
    initialize: function (greeter) {
        this.greeter = greeter;
        // class constructor
    },

    greet: function (name) {
        alert(this.greeter + ', ' + name)
    }
});

// create instance of MyClass, passing "Hello" to the constructor
var a = new MyClass("Hello");

// call greet method, alerting "Hello, World"
a.greet("World");
```

### W.Util
Various utility functions, used internally.

## Contribution
Feel free to pull request into `dev` branch

### Build
We use [Jake](http://jakejs.com/) for building
```bash
# global jake install
npm install -g jake
# install dependencies
npm install
# build project
jake
```

### Code Conventions
We use [JSHint](http://jshint.com/) and [JSCS](http://jscs.info/) to validate code.
Run `jake jshint` and `jake jscs` to check

## License
[The MIT License](LICENSE-MIT)
