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
* [AngularJS](https://www.angularjs.org) [demo](examples/angular)

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
<table>
<tr>
    <td>eventsTimeout</td>
    <td>Timeout for auto executing `avl_evts` request. Set `0` to prevent `avl_evts` request sending. Default: 10 (sec).</td>
</tr>
<tr>
    <td>internalGis</td>
    <td>Boolean flag to allow to use intertnal GIS service. Default: false.</td>
</tr>
</table>

#### Methods
<table>
<tr>
    <th>Name</th>
    <th>Description</th>
</tr>
<tr>
    <td><i>checkFeature</i></td>
    <td>Check if billing service is avaible for given session</td>
</tr>
<tr>
    <td><i>execute</i></td>
    <td>Execute Remote API request</td>
</tr>
<tr>
    <td><i>getBaseUrl</i></td>
    <td>Return session base url (e.g. https://hst-api.wialon.com)</td>
</tr>
<tr>
    <td><i>getCurrentUser</i></td>
    <td>Return currently logged in user</td>
</tr>
<tr>
    <td><i>getEvents</i></td>
    <td>Get events from server (execute 'avl_evts' request). Run automaticaly if `options.eventsTimeout` != 0.</td>
</tr>
<tr>
    <td><i>getFeatures</i></td>
    <td>Return avaible billing services for given session</td>
</tr>
<tr>
    <td><i>getItem</i></td>
    <td>Return item loaded in session by id. Execute `core/update_data_flag` before use this method.</td>
</tr>
<tr>
    <td><i>getItems</i></td>
    <td>Return items loaded in session filtered by type. Execute `core/update_data_flag` before use this method.</td>
</tr>
<tr>
    <td><i>getSid</i></td>
    <td>Return session id or null if not logged in</td>
</tr>
<tr>
    <td><i>getBaseGisUrl</i></td>
    <td>Return GIS service url (e.g. https://render-maps.wialon.com/hst-api.wialon.com)</td>
</tr>
<tr>
    <td><i>getLocations</i></td>
    <td>Detect location for provided coordinates</td>
</tr>
<tr>
    <td><i>getCurrentTime</i></td>
    <td>Return current server time</td>
</tr>
<tr>
    <td><i>getTimeZone</i></td>
    <td>Return server timezone</td>
</tr>
<tr>
    <td><i>getTimeZoneOffset</i></td>
    <td>Return server timezone offset, in seconds</td>
</tr>
<tr>
    <td><i>getDSTOffset</i></td>
    <td>Return DST offset for specified timezone, in seconds</td>
</tr>
<tr>
    <td><i>getUserTime</i></td>
    <td>Convert absolute time to user time</td>
</tr>
<tr>
    <td><i>getLocale</i></td>
    <td>Return user localization settings</td>
</tr>
<tr>
    <td><i>updateLocale</i></td>
    <td>Update user localization settings</td>
</tr>
</table>

#### Events
`W.Session` fires following events
<table>
<tr>
    <th>Name</th>
    <th>Description</th>
</tr>
<tr>
    <td><i>itemChanged</i></td>
    <td>item changed (renamed, flags changed etc.)</td>
</tr>
<tr>
    <td><i>itemDeleted</i></td>
    <td>item deleted from Wialon</td>
</tr>
<tr>
    <td><i>positionChanged</i></td>
    <td>item position changed</td>
</tr>
<tr>
    <td><i>featuresChanged</i></td>
    <td>billing services avaible for current session changed</td>
</tr>
<tr>
    <td><i>lastMessageChanged</i></td>
    <td>item's last message changed (new message obtained)</td>
</tr>
<tr>
    <td><i>messageParamsChanged</i></td>
    <td>item's messages params changed</td>
</tr>
</table>

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
<table>
<tr>
    <th>Name</th>
    <th>Description</th>
</tr>
<tr>
    <td><i>api</i></td>
    <td>Execute simple Remote API request</td>
</tr>
<tr>
    <td><i>send</i></td>
    <td>Process request sending</td>
</tr>
</table>

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
