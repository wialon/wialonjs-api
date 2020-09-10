/** GIS service mixin
 */

W.Session.include({
    _gis: {
        render: null,
        search: null,
        geocode: null,
        routing: null
    },
    /** Get base URL for GIS service
     */
    getBaseGisUrl: function(gisType) {
        if (!this.options.internalGis && this._url !== '') {
            // extract DNS of Wialon server
            // from base URL (e.g. http://hst-api.wialon.com)
            var arr = this._url.split('//');
            if (arr.length >= 2) {
                var endpoint = {
                    render: this._gisRenderUrl,
                    search: this._gisSearchUrl,
                    geocode: this._gisGeocodeUrl,
                    routing: this._gisRoutingUrl
                }[gisType];

                if (endpoint) {
                    return endpoint + '/' + arr[1];
                }
            }
        }
        return this._url;
    },

    /** Detect location for coordinates
     */
    getLocations: function(params, force, callback) {
        // Get correct path
        var _url = this.getBaseGisUrl('geocode');
        // Geocoding (getLocations) params, SAG
        params = W.extend({
            coords: null,
            // Geocoding flags, SAG
            flags: 0,
            // Geocoding min radius for city, SAG
            city_radius: 0,
            // Geocoding distance from unit, SAG
            dist_from_unit: 0,
            // Geocoding text distance, SAG
            txt_dist: '',
            // Geocoding house detect radius
            house_detect_radius: 0
        }, params);
        try {
            params.coords = JSON.stringify(params.coords);
        } catch (e) {
            callback(2);
            return;
        }
        if (!force && ((_url + '/gis_geocode') in this._cache)) {
            var _cache = this._cache[_url + '/gis_geocode'];
            return callback.apply(_cache[0], _cache[1]);
        }
        // Check if geocode request is initialized
        if (!(this._gis.geocode instanceof W.Request)) {
            var _path = this.getBaseGisUrl('geocode') !== '' ? '/gis_post?2' : '/wialon/post.html?2';
            this._gis.geocode = new W.Request(_url, _path);
        }
        // Try to get ID from current user
        if ((this._currentUser === Object(this._currentUser)) && ('id' in this._currentUser)) {
            params.uid = this._currentUser.id;
        }
        var _self = this;
        this._gis.geocode.send(_url + '/gis_geocode', params, function() {
            _self._cache[_url + '/gis_geocode'] = [this, arguments];
            callback.apply(this, arguments);
        }, callback);
    }
});

W.Session.mergeOptions({
    internalGis: false
});