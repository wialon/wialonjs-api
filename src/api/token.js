/** Remote Api 'token' service methods
 */

W.Session.prototype.api.token = {
    login: function(params, callback) {
        // Call request
        this._request.api('token/login',
            {params: params},
            this._loginCallback.bind(this, callback)
        );
    }
};