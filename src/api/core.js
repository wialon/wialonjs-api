/** Remote API 'core' service methods
 *  Specific methods for pre- and post-processing Remote API request
 */

W.Session.prototype.api.core = {
    update_data_flags: function (params, callback) {
        // Call request
        this._request.api('core/update_data_flags',
            {params: params, sid: this._sid},
            this._updateDataFlagsCallback.bind(this, callback)
        );
    },

    login: function (params, callback) {
        W.extend({
            user: null,
            password: null,
            operateAs: ''
        }, params);
        // Call request
        this._request.api('core/login',
            {params: params},
            this._loginCallback.bind(this, callback)
        );
    },

    logout: function (callback) {
        // Call request
        this._request.api('core/logout',
            {params: {}, sid: this._sid},
            this._logoutCallback.bind(this, callback)
        );
    },

    use_auth_hash: function(params, callback) {
        // Call request
        this._request.api('core/use_auth_hash',
            {params: params},
            this._loginCallback.bind(this, callback)
        );
    },

    duplicate: function(params, callback) {
        if (!params['sid']) {
            callback && callback({error: 1});
        }
        var sid = params.sid;
        delete params.sid;
        // Call request
        this._request.api('core/duplicate',
            {params: params, sid: sid},
            this._loginCallback.bind(this, callback)
        );
    }
};