# wialonjs-api
Lightweight and flexible wrapper for Wialon Remote API

`wialonjs-api` helps you to work with Wialon Hosting and Wialon Local
throught [Remote API](http://sdk.wialon.com/wiki/en/sidebar/remoteapi/apiref/apiref)

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
In progress..

## Contribution
Feel free to pull request

### Build
We use [Jake](http://jakejs.com/) for building
```
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
