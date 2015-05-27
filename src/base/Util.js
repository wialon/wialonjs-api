/**
 * W.Util contains various utility functions
 */

var Time = function() {

    this.dstFlags = {
        // timezone disable DST bit
        TZ_DISABLE_DST_BIT              : 0x00000001,
        // timezone type mask
        TZ_TYPE_MASK                    : 0x0C000000,
        // timezone has an information about its DST
        TZ_TYPE_WITH_DST                : 0x08000000,
        // timezone DST mask
        TZ_DST_TYPE_MASK                : 0x03000000,
        // no DST required
        TZ_DST_TYPE_NONE                : 0x00000000,
        // use server DST setting
        TZ_DST_TYPE_SERVER              : 0x01000000,
        // use custom DST setting
        TZ_DST_TYPE_CUSTOM              : 0x02000000,
        // custom DST setting mask
        TZ_CUSTOM_DST_MASK              : 0x00FF0000,
        // use custom DST setting(UTC time)
        TZ_DST_TYPE_CUSTOM_UTC          : 0x03000000,
        // timezone offset
        TZ_OFFSET_MASK                  : 0xFFFFFFFE
    };

    this.dstRules = {
        // Northern hemisphere
        // From second march sunday to first november sunday
        DST_MAR2SUN2AM_NOV1SUN2AM       : 0x00010000,
        // From last march sunday to last october sunday
        DST_MAR6SUN_OCT6SUN             : 0x00020000,
        // From last march sunday at 1am to last october sunday at 1am
        DST_MAR6SUN1AM_OCT6SUN1AM       : 0x00030000,
        // From last march thursday to last september friday
        DST_MAR6THU_SEP6FRI             : 0x00040000,
        // From last march sunday at 2am to last october sunday at 2am
        DST_MAR6SUN2AM_OCT6SUN2AM       : 0x00050000,
        // From march 30 to september 21
        DST_MAR30_SEP21                 : 0x00060000,
        // From first april sunday to last october sunday
        DST_APR1SUN2AM_OCT6SUN2AM       : 0x00070000,
        // From first april to last october sunday
        DST_APR1_OCT6SUN                : 0x00080000,
        // From last april thursday to last september thursday
        DST_APR6THU_SEP6THU             : 0x00090000,
        // From last april friday(before april 2nd) to UNKONOWN
        DST_APR6THU_UNKNOWN             : 0x000A0000,
        // From april 1st to october 1st
        DST_APR1_OCT1                   : 0x000B0000,
        // From  march 22th to september 21th (21 march to 20 september from leap year)
        DST_MAR21_22SUN_SEP20_21SUN     : 0x000C0000,
        // Used to distinguish DST`s
        DST_SOUTHERN_SEMISPHERE         : 0x00200000,
        // Southern hemisphere DST
        // From first september sunday(after september 7th) to first april sunday(after april 5th)
        DST_SEP1SUNAFTER7_APR1SUNAFTER5 : 0x00200000,
        // From first september sunday to first april sunday
        DST_SEP1SUN_APR1SUN             : 0x00210000,
        // From september last sunday to april first sunday
        DST_SEP6SUN_APR1SUN             : 0x00220000,
        // From second october sunday to second march sunday
        DST_OCT2SUN_MAR2SUN             : 0x00230000,
        // From first october sunday to thrid february sunday
        DST_OCT1SUN_FEB3SUN             : 0x00240000,
        // From third october sunday to second march sunday
        DST_OCT3SUN_MAR2SUN             : 0x00250000,
        // From first october sunday to second march sunday
        DST_OCT1SUN_MAR2SUN             : 0x00260000,
        // From october first sunday to april first sunday
        DST_OCT1SUN_APR1SUN             : 0x00270000,
        // From october first sunday to march last sunday
        DST_OCT1SUN_MAR6SUN             : 0x00280000,
        // From october last sunday to january last sunday
        DST_OCT6SUN_JAN6SUN             : 0x00290000
    };

    /* DST cache - pairs of start:end times
     */
    this._dstCache = {
        // DST start year and time
        from : {},
        // DST end year and time
        to : {}
    },

    /* Return local timezone offset, in seconds
     */
    this.getTimeZoneOffset = function() {
        var _tt = new Date(),
            _jan1 = new Date(_tt.getFullYear(), 0, 1, 0, 0, 0, 0),
            _june1 = new Date(_tt.getFullYear(), 6, 1, 0, 0, 0, 0),
            _temp = _jan1.toGMTString(),
            _jan2 = new Date(_temp.substring(0, _temp.lastIndexOf(' ') - 1));
        _temp = _june1.toGMTString();
        var _june2 = new Date(_temp.substring(0, _temp.lastIndexOf(' ') - 1)),
            _std_time_offset = ((_jan1 - _jan2) / (1000 * 60 * 60)),
            _daylight_time_offset = ((_june1 - _june2) / (1000 * 60 * 60));
        if (_std_time_offset - _daylight_time_offset) {
            _std_time_offset = _daylight_time_offset;
        }
        return Math.floor(_std_time_offset * 3600);
    };

    /* Check year for leap
     */
    this.isLeapYear = function(year) {
        if (year % 4 === 0 && ((year % 100 !== 0) || (year % 100 === 0 && year % 400 === 0))) {
            return true;
        }
        return false;
    };

    /** Get UTC time for some week day
     */
    this.getWdayTime = function(year, month, weeks, weekDay, monthDay, hours, minutes, seconds) {
        // get month UTC time
        var _td = new Date();
        _td.setUTCFullYear(year);
        _td.setUTCMonth(month);
        _td.setUTCDate(1);
        _td.setUTCHours(0);
        _td.setUTCMilliseconds(0);
        _td.setUTCMinutes(0);
        _td.setUTCSeconds(0);
        var _mDay = 0;
        // fixed date - like semptember 5th
        if (weekDay === -1) {
            _mDay = monthDay;
        } else {
            // get first month day for required weekday
            if (_td.getUTCDay() <= weekDay) {
                _mDay = (weekDay - _td.getUTCDay()) + 1;
            } else {
                _mDay = 8 - (_td.getUTCDay() - weekDay);
            }
            // weekdays
            if (weeks < 6) {
                // first weekday after fixed date
                if (monthDay) {
                    while (_mDay <= monthDay) {
                        _mDay += 7;
                    }
                } else if (weeks) {
                    // simple week count
                    _mDay += 7 * (weeks - 1);
                }
            } else {
                // get year type - leap or regular
                var _mDays = this.getMonthDays(month, year);
                if (_mDay + 4 * 7 <= _mDays) {
                    _mDay += 4 * 7;
                } else {
                    _mDay += 3 * 7;
                }
            }
        }
        _td.setUTCDate(_mDay);
        if (hours) {
            _td.setUTCHours(hours);
        }
        if (minutes) {
            _td.setUTCMinutes(minutes);
        }
        if (seconds) {
            _td.setUTCSeconds(seconds);
        }
        return parseInt(_td.getTime() / 1000);
    };

    /** Get number of days in month
     */
    this.getMonthDays = function(month, year) {
        if (month < 0 || !year) {
            return 0;
        }
        var _arr = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (month >= _arr.length) {
            return 0;
        }
        if (month === 1 && this.getYearDays(year) === 365) {
            return 29;
        }
        return _arr[month];
    },

    /** Get number of days in year
     */
    this.getYearDays = function(year) {
        if (!year) {
            return 0;
        }
        return this.isLeapYear() ? 365 : 364;
    };
};

W.Util = {
    /** Extend an object with properties of one or more other objects
     */
    extend: function (dest) {
        var i, j, len, src;

        for (j = 1, len = arguments.length; j < len; j++) {
            src = arguments[j];
            for (i in src) {
                dest[i] = src[i];
            }
        }
        return dest;
    },

    /** Create an object from a given prototype
     */
    create: Object.create || (function () {
        function F() {}
        return function (proto) {
            F.prototype = proto;
            return new F();
        };
    })(),

    /** Return unique ID of an object
     */
    stamp: function (obj) {
        obj._id = obj._id || ++W.Util.lastId;
        return obj._id;
    },

    lastId: 0,

    /** Do nothing (used as a noop throughout the code)
     */
    falseFn: function () { return false; },

    /** Round a given number to a given precision
     */
    formatNum: function (num, digits) {
        var pow = Math.pow(10, digits || 5);
        return Math.round(num * pow) / pow;
    },

    /** Trim whitespace from both sides of a string
     */
    trim: function (str) {
        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
    },

    /** Split a string into words
     */
    splitWords: function (str) {
        return W.Util.trim(str).split(/\s+/);
    },

    /** Set options to an object, inheriting parent's options as well
     */
    setOptions: function (obj, options) {
        if (!obj.hasOwnProperty('options')) {
            obj.options = obj.options ? W.Util.create(obj.options) : {};
        }
        for (var i in options) {
            obj.options[i] = options[i];
        }
        return obj.options;
    },

    /** Make a URL with GET parameters out of a set of properties/values
     */
    getParamString: function (obj, existingUrl, uppercase) {
        var params = [];
        for (var i in obj) {
            params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
        }
        return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
    },

    isArray: Array.isArray || function (obj) {
        return (Object.prototype.toString.call(obj) === '[object Array]');
    },

    /** Logger
     */
    write: function() {
        if (!W.debug || !arguments.length) {
            return;
        }

        var
            // Get method
            method = arguments[0],
            console = window.console;
        // Check browser support
        if (!console[method]) {
            console[method] = function() {};
        }
        // If there are only 1 argument - use console.log
        if (arguments.length === 1) {
            return console.log(arguments[0]);
        }
        // Check our own method "stringify"
        if (method === 'stringify') {
            var
                data = arguments[1];
            // Check if it is object
            if (data === Object(data) && JSON) {
                try {
                    data = JSON.stringify(data);
                } catch (e) {}
            }
            return console.log(data);
        }
        return console[method].apply(console, Array.prototype.slice.call(arguments, 1));
    },

    /** Helper for Date
     */
    time: new Time()
};

// shortcuts for most used utility functions
W.extend = W.Util.extend;
W.stamp = W.Util.stamp;
W.setOptions = W.Util.setOptions;
W.logger = W.Util.write;