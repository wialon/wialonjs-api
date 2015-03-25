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

    use_auth_hash: function(params, callback) {
        // Call request
        this._request.api('core/use_auth_hash',
            {params: params},
            this._loginCallback.bind(this, callback)
        );
    },

    duplicate: function(params, callback) {
        // Call request
        this._request.api('core/duplicate',
            {params: params},
            this._loginCallback.bind(this, callback)
        );
    }
};