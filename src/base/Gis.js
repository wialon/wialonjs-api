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
                if (gisType === 'render') {
                    return arr[0] + '//render-maps.wialon.com/' + arr[1];
                } else if (gisType === 'search') {
                    return arr[0] + '//search-maps.wialon.com/' + arr[1];
                } else if (gisType === 'geocode') {
                    return arr[0] + '//geocode-maps.wialon.com/' + arr[1];
                } else if (gisType === 'routing') {
                    return arr[0] + '//routing-maps.wialon.com/' + arr[1];
                }
            }
        }
        return this._url;
    },

    /** Detect location for text for coordinates
    */
    getLocations: function(params, callback) {
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
        // Check if geocode request is initialized
        if (!(this._gis.geocode instanceof W.Request)) {
            var _path = this.getBaseGisUrl('geocode') !== '' ? '/gis_post?2' : '/wialon/post.html?2';
            this._gis.geocode = new W.Request(_url, _path);
        }
        // Try to get ID from current user
        if ((this._currentUser === Object(this._currentUser)) && ('id' in this._currentUser)) {
            params.uid = this._currentUser.id;
        }
        this._gis.geocode.send(_url + '/gis_geocode', params, callback, callback);
    }
});

W.Session.mergeOptions({
    internalGis: false
});