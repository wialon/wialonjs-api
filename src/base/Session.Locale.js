/** Locale service mixin
 */

W.Session.include({
    /** Get current server time
     */
    getCurrentTime: function() {
        return this._serverTime;
    },

    /** Return server timezone
     */
    getTimeZone: function() {
        var _tz = -(new Date()).getTimezoneOffset() * 60;
        if (!this._currentUser || !('tz' in this._currentUser.prp)) {
            return _tz;
        }
        return parseInt(this._currentUser.prp.tz) >>> 0;
    },

    /** Return server timezone offset, in seconds
     */
    getTimeZoneOffset: function(tz) {
        tz = tz || this.getTimeZone();
        if ((tz & W.Util.time.dstFlags.TZ_TYPE_MASK) !== W.Util.time.dstFlags.TZ_TYPE_WITH_DST) {
            return tz & W.Util.time.dstFlags.TZ_OFFSET_MASK;
        }
        return parseInt(tz & 0x80000000 ? ((tz & 0xFFFF) | 0xFFFF0000) : (tz & 0xFFFF));
    },

    /** Return DST offset for specified timezone, in seconds
     */
    getDSTOffset: function(absVal) {
        if (!absVal) {
            return 0;
        }
        var _tz = this.getTimeZone(),
            _tzType = _tz & W.Util.time.dstFlags.TZ_TYPE_MASK,
            _tzOffset = this.getTimeZoneOffset(_tz);
        // DST is always 0
        if ((_tzType === W.Util.time.dstFlags.TZ_TYPE_WITH_DST &&
                (_tz & W.Util.time.dstFlags.TZ_DST_TYPE_MASK) === W.Util.time.dstFlags.TZ_DST_TYPE_NONE) ||
            (_tzType !== W.Util.time.dstFlags.TZ_TYPE_WITH_DST &&
                (_tz & W.Util.time.dstFlags.TZ_DISABLE_DST_BIT))) {
            return 0;
        }
        // get server DST
        if ((_tzType === W.Util.time.dstFlags.TZ_TYPE_WITH_DST &&
                (_tz & W.Util.time.dstFlags.TZ_DST_TYPE_MASK) === W.Util.time.dstFlags.TZ_DST_TYPE_SERVER) ||
             _tzType !== W.Util.time.dstFlags.TZ_TYPE_WITH_DST) {
            // check DST
            var _tm_loc = new Date();
            _tm_loc.setTime(absVal * 1000);
            var _tm_1 = new Date();
            _tm_1.setTime((absVal - 90 * 86400) * 1000);
            var _tm_2 = new Date();
            _tm_2.setTime((absVal + 150 * 86400) * 1000);
            if (_tm_loc.getTimezoneOffset() < _tm_1.getTimezoneOffset() ||
                _tm_loc.getTimezoneOffset() < _tm_2.getTimezoneOffset()) {
                return 3600;
            }
            return 0;
        }
        // extract tz info
        var _dst = _tz & W.Util.time.dstFlags.TZ_CUSTOM_DST_MASK,
            // get UTC time
            _td = new Date((absVal + _tzOffset) * 1000),
            _dst_from = 0,
            _dst_to = 0,
            _year = _td.getUTCFullYear(),
            _dst_or_year = _dst | _year;
        if (typeof W.Util.time._dstCache.from[_dst_or_year] === 'undefined' ||
            typeof W.Util.time._dstCache.to[_dst_or_year] === 'undefined') {
            // check different types of DST offsets
            switch (_dst) {
                case W.Util.time.dstRules.DST_MAR2SUN2AM_NOV1SUN2AM:
                    _dst_from = W.Util.time.getWdayTime(_year, 2, 2, 0, 0, 2);
                    _dst_to = W.Util.time.getWdayTime(_year, 10, 1, 0, 0, 2);
                break;
                case W.Util.time.dstRules.DST_MAR6SUN_OCT6SUN:
                    _dst_from = W.Util.time.getWdayTime(_year, 2, 6, 0);
                    _dst_to = W.Util.time.getWdayTime(_year, 9, 6, 0);
                break;
                case W.Util.time.dstRules.DST_MAR6SUN1AM_OCT6SUN1AM:
                    _dst_from = W.Util.time.getWdayTime(_year, 2, 6, 0, 0, 1);
                    _dst_to = W.Util.time.getWdayTime(_year, 9, 6, 0, 2);
                break;
                case W.Util.time.dstRules.DST_MAR6THU_SEP6FRI:
                    _dst_from = W.Util.time.getWdayTime(_year, 2, 6, 4);
                    _dst_to = W.Util.time.getWdayTime(_year, 8, 6, 5);
                break;
                case W.Util.time.dstRules.DST_MAR6SUN2AM_OCT6SUN2AM:
                    _dst_from = W.Util.time.getWdayTime(_year, 2, 6, 0, 0, 2);
                    _dst_to = W.Util.time.getWdayTime(_year, 9, 6, 0, 0, 2);
                    // 26 october 2014
                    if (absVal > 1414281600) {
                        return 0;
                    }
                    return 3600;
                case W.Util.time.dstRules.DST_MAR30_SEP21:
                    _dst_from = W.Util.time.getWdayTime(_year, 2, 0, -1, 30);
                    _dst_to = W.Util.time.getWdayTime(_year, 8, 0, -1, 21);
                break;
                case W.Util.time.dstRules.DST_APR1SUN2AM_OCT6SUN2AM:
                    _dst_from = W.Util.time.getWdayTime(_year, 3, 1, 0, 0, 2);
                    _dst_to = W.Util.time.getWdayTime(_year, 9, 6, 0, 0, 2);
                break;
                case W.Util.time.dstRules.DST_APR1_OCT6SUN:
                    _dst_from = W.Util.time.getWdayTime(_year, 3, 0, -1, 1);
                    _dst_to = W.Util.time.getWdayTime(_year, 9, 6, 0);
                break;
                case W.Util.time.dstRules.DST_APR6THU_SEP6THU:
                    _dst_from = W.Util.time.getWdayTime(_year, 3, 6, 4);
                    _dst_to = W.Util.time.getWdayTime(_year, 8, 6, 4);
                break;
                case W.Util.time.dstRules.DST_APR1_OCT1:
                    _dst_from = W.Util.time.getWdayTime(_year, 3, 0, -1, 1);
                    _dst_to = W.Util.time.getWdayTime(_year, 9, 0, -1, 1);
                break;
                case W.Util.time.dstRules.DST_MAR21_22SUN_SEP20_21SUN:
                    var _isLeapYear = W.Util.time.isLeapYear(_year);
                    _dst_from = W.Util.time.getWdayTime(_year, 2, 0, -1, _isLeapYear ? 21 : 22);
                    _dst_to = W.Util.time.getWdayTime(_year, 8, 0, -1, _isLeapYear ? 20 : 21, 23, 0, 0);
                break;
                case W.Util.time.dstRules.DST_SEP1SUNAFTER7_APR1SUNAFTER5:
                    _dst_from = W.Util.time.getWdayTime(_year, 8, 1, 0, 7);
                    _dst_to = W.Util.time.getWdayTime(_year, 3, 1, 0, 5);
                break;
                case W.Util.time.dstRules.DST_SEP1SUN_APR1SUN:
                    _dst_from = W.Util.time.getWdayTime(_year, 8, 1, 0);
                    _dst_to = W.Util.time.getWdayTime(_year, 3, 1, 0);
                break;
                case W.Util.time.dstRules.DST_SEP6SUN_APR1SUN:
                    _dst_from = W.Util.time.getWdayTime(_year, 8, 6, 0);
                    _dst_to = W.Util.time.getWdayTime(_year, 3, 1, 0);
                break;
                case W.Util.time.dstRules.DST_OCT2SUN_MAR2SUN:
                    _dst_from = W.Util.time.getWdayTime(_year, 9, 2, 0);
                    _dst_to = W.Util.time.getWdayTime(_year, 2, 2, 0);
                break;
                case W.Util.time.dstRules.DST_OCT1SUN_FEB3SUN:
                    _dst_from = W.Util.time.getWdayTime(_year, 9, 3, 0);
                    _dst_to = W.Util.time.getWdayTime(_year, 1, 3, 0);
                break;
                case W.Util.time.dstRules.DST_OCT3SUN_MAR2SUN:
                    _dst_from = W.Util.time.getWdayTime(_year, 9, 3, 0);
                    _dst_to = W.Util.time.getWdayTime(_year, 2, 2, 0);
                break;
                case W.Util.time.dstRules.DST_OCT1SUN_MAR2SUN:
                    _dst_from = W.Util.time.getWdayTime(_year, 9, 1, 0);
                    _dst_to = W.Util.time.getWdayTime(_year, 2, 2, 0);
                break;
                case W.Util.time.dstRules.DST_OCT1SUN_APR1SUN:
                    _dst_from = W.Util.time.getWdayTime(_year, 9, 1, 0);
                    _dst_to = W.Util.time.getWdayTime(_year, 3, 1, 0);
                break;
                case W.Util.time.dstRules.DST_OCT1SUN_MAR6SUN:
                    _dst_from = W.Util.time.getWdayTime(_year, 9, 1, 0);
                    _dst_to = W.Util.time.getWdayTime(_year, 2, 6, 0);
                break;
                case W.Util.time.dstRules.DST_OCT6SUN_JAN6SUN:
                    _dst_from = W.Util.time.getWdayTime(_year, 9, 6, 0);
                    _dst_to = W.Util.time.getWdayTime(_year, 0, 6, 0);
                break;
                default:
                    return 0;
            }
            // store for latest requests
            W.Util.time._dstCache.from[_dst_or_year] = _dst_from;
            if (_dst_to % 2 === 0) {
                _dst_to--;
            }
            W.Util.time._dstCache.to[_dst_or_year] = _dst_to;
        } else {
            _dst_from = W.Util.time._dstCache.from[_dst_or_year];
            _dst_to = W.Util.time._dstCache.to[_dst_or_year];
        }
        var _dst_from_loc = (_tz & W.Util.time.dstFlags.TZ_DST_TYPE_MASK) ===
            W.Util.time.dstFlags.TZ_DST_TYPE_CUSTOM_UTC ?
                _dst_from :
                _dst_from - _tzOffset,
            _dst_to_loc = (_tz & W.Util.time.dstFlags.TZ_DST_TYPE_MASK) ===
            W.Util.time.dstFlags.TZ_DST_TYPE_CUSTOM_UTC ?
                _dst_to :
                _dst_to - _tzOffset;
        // invert DST for southern DST
        if (_dst >= W.Util.time.dstRules.DST_SOUTHERN_SEMISPHERE) {
            return (absVal <= _dst_from_loc && absVal >= _dst_to_loc) ? 0 : 3600;
        }
        return (absVal >= _dst_from_loc && absVal <= _dst_to_loc) ? 3600 : 0;
    },

    /** Convert absolute time to user time - used in format and print methods
     */
    getUserTime: function(absVal, localTimeZone) {
        localTimeZone = localTimeZone !== null ? localTimeZone : true;
        absVal += this.getDSTOffset(absVal) + this.getTimeZoneOffset();
        return absVal - (!localTimeZone ? W.Util.time.getTimeZoneOffset() : 0);
    },

    /** Get localization settings
     */
    getLocale: function(callback, force) {
        if (!this._currentUser) {
            return callback({error: 6});
        }
        if (!force && ('user/get_locale' in this._cache)) {
            var _cache = this._cache['user/get_locale'];
            return callback.apply(_cache[0], _cache[1]);
        }
        var _self = this,
            _params = {params: {
                userId: this._currentUser.id
            }};
        this.execute('user/get_locale', _params, function() {
            _self._cache['user/get_locale'] = [this, arguments];
            callback.apply(this, arguments);
        });
    },

    /** Update this user localization settings
     */
    updateLocale: function(params, callback) {
        if (!this._currentUser) {
            return callback({error: 4});
        }
        params = {params: W.extend({
            userId: this._currentUser.id
        }, params)};
        this.execute('user/update_locale', params, callback);
    }
});