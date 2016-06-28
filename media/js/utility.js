/* jshint bitwise: false */
_.namespace('mp.utility', function(exports) {
    /* global hex_md5, b64_md5  */
    'use strict';

    // Bind esc key press to a handler
    exports.bind_esc = function(namespace, handler, context) {
        if (context) {
            handler = _.bind(handler, context);
        }

        $('body').on('keydown.' + namespace, function(e) {
            if (e.which === 27) {
                handler(e);
                $('body').off('keydown.' + namespace);
            }
        });
    };

    exports.unbind_esc = function(namespace, handler) {
        if (handler) {
            $('body').off('keydown.' + namespace, handler);
        } else {
            $('body').off('keydown.' + namespace);
        }
    };

    // Bind an outside event that only calls the handler if the event doesn't occur
    // on jquery_obj or one of its children.
    //
    // NOTE: unbind_outside_event must be called to unbind the event; it will cause a
    // memory leak if it isn't
    exports.bind_outside_event = function(event_name, namespace, jquery_obj, handler, context) { // jshint ignore:line
        if (context) {
            handler = _.bind(handler, context);
        }

        $(document).on(event_name + '.' + namespace + '.' + 'OUTSIDE_EVENT', function(e) {
            if (jquery_obj.length && !$(jquery_obj).is(e.target) && !$.contains(jquery_obj[0], e.target) && $.contains(document, e.target)) {
                handler(e);
            }
        });
    };

    // Unbind an outside event
    exports.unbind_outside_event = function(event_name, namespace) {
       $(document).off(event_name + '.' + namespace + '.' + 'OUTSIDE_EVENT');
    };

    // parseUri 1.2.2
    // (c) Steven Levithan <stevenlevithan.com>
    // MIT License
    exports.parseUri = function(str) {
        var o = exports.parseUri.options,
            m = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str),
            uri = {},
            i = 14;

        while (i--) {
            uri[o.key[i]] = m[i] || '';
        }

        uri[o.q.name] = {};
        uri[o.key[12]].replace(o.q.parser, function($0, $1, $2) {
            if ($1) {
                uri[o.q.name][$1] = $2;
            }
        });

        return uri;
    };

    exports.parseUri.options = {
        strictMode: false,
        key: ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
        q: {
            name: 'queryKey',
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g
        },
        parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
    };

     var tld_regex = new RegExp('\\.(aero|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|' +
        'name|net|org|travel|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|az|' +
        'ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|' +
        'cg|ch|ci|ck|cl|cm|cn|co|cr|cs|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|ec|ee|' +
        'eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|' +
        'gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|' +
        'it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|' +
        'lt|lu|lv|ly|ma|mc|md|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|' +
        'my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|' +
        'pn|pr|ps|pt|pw|py|qa|re|ro|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|' +
        'sn|so|sr|st|su|sv|sy|sz|tc|td|tf|tg|th|tj|tk|tm|tn|to|tp|tr|tt|tv|tw|' +
        'tz|ua|ug|uk|um|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zr|' +
        'zw)\\b');
    exports.isURL = function(str) {
        if (typeof str !== 'string' || str.indexOf(' ') !== -1) { return false; }
        var has_httpish_protocol = /^https?:\/\//.test(str);
        var has_ftp_protocol = str.indexOf('ftp://') === 0;
        var maybe_email = !has_httpish_protocol && !has_ftp_protocol && str.indexOf('@') !== -1;
        var maybe_url = has_httpish_protocol || tld_regex.test(str);
        return maybe_url && !maybe_email && !has_ftp_protocol;
    };

    // In contrast with isURL, returns true only for strings beginning with an
    // http/https protocol.
    exports.is_http_uri = function(str) {
        return typeof str === 'string' && str.indexOf(' ') === -1 && /^https?:\/\//.test(str);
    };

    exports.sanitize = function(data) {
        if (typeof $ !== 'undefined') {
            return $('<div/>').text(data).html();
        } else {
            return data.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
        }
    };

    exports.percentify = function(val, total) {
        return total > 0 ? val / total * 100 : 0;
    };

    exports.percentage_to_int = function(percentage) {
        // given a percentage string (like css), return int

        var re = new RegExp('(\\d{0,3})\\s*%');
        var matches = re.exec(percentage);

        var num = matches[1];
        // first element is the full re match, first element is first group

        return parseInt(num, 10);
    };

    exports.px_to_int = function(pixels) {
        var  num = parseInt(pixels, 10);
        if (isNaN(num)) {
            num = 0;
        }
        return num;
    };

    exports.http_build_query = function(formdata, arg_separator) {
        var key, use_val, use_key, i = 0, tmp_arr = [];

        if (!arg_separator) {
            arg_separator = '&';
        }

        for (key in formdata) {
            if (key) {
                use_val = encodeURIComponent(formdata[key].toString());
                use_key = encodeURIComponent(key);
                tmp_arr[i++] = use_key + '=' + use_val;
            }
        }

        return tmp_arr.join(arg_separator);
    };

    // CAVEAT CALLOR-
    // 1) Have you tried styling the parent element with "text-overflow: ellipsis" ?
    // 2) Have you considered that the outgoing string may be three chars longer than len?
    exports.shorten_string = function(string, len) {
        if (!len) { len = 20; }
        if (string.length > len) {
            return string.substring(0, len) + '...';
        } else {
            return string;
        }
    };

    // truncates the string around the middle as opposed to lopping off
    // information at the end
    exports.truncate_middle = function(string, len) {
        if (string) {
            if (len <= 3) {
                return string.substr(0, len);
            } else if (string.length <= len) {
                return string;
            } else {
                var start = (len - 3) / 2;
                var del = (string.length - len) + 3; //delete this many characters
                return _.splice(string, start, del, '...');
            }
        }
        return string;
    };

    // trims the protocol, then truncates at the end if necessary
    exports.truncate_url = function(url, len) {
        var a = document.createElement('a');
        a.href = url;
        var trimmed = [a.host, a.pathname, a.search, a.hash].join('');
        if (trimmed.length > len) {
            trimmed = mp.utility.shorten_string(trimmed, len - 3);
        }
        return trimmed;
    };

    exports.commaize = function(number, no_conversion) {
        switch (typeof number) {
            case "number":
                if (_.isNaN(number)) { return number; }
                number = number.toString();
                break;
            case "string":
                number = number;
                break;
            default:
                return number;
        }

        var neg = false;
        if (number[0] === '-') {
            neg = true;
            number = number.slice(1);
        }

        // Parse main number
        var split = number.split('.');
        var commaized = no_conversion ? split[0] : parseInt(split[0] || 0, 10).toString();

        if (commaized.length) {
            commaized = commaized.split('').reverse().join('');
            commaized = commaized.match(/.{1,3}/g).join(',');
            commaized = commaized.split('').reverse().join('');
        }

        if (split[1]) {
            // Add decimals, if applicable
            commaized += '.' + split[1];
        }
        if (neg) {
            commaized = '-' + commaized;
        }
        return commaized;
    };

    exports.pluralize = function(singular, number, plural) {
        plural = plural || (singular + 's');
        return number === 0 || number > 1 ? plural : singular;
    };

    exports.pretty_number = function(n, precision) {
        n = parseFloat(n);
        precision = (precision === undefined) ? 1 : precision;
        var large_numbers = [
                [Math.pow(10, 15), 'Q'],
                [Math.pow(10, 12), 'T'],
                [Math.pow(10, 9), 'B'],
                [Math.pow(10, 6), 'M'],
                [Math.pow(10, 3), 'K']
            ],
            suffix = '';

        for (var i = 0; i < large_numbers.length; i++) {
            var bignum = large_numbers[i][0],
                letter = large_numbers[i][1];
            if (Math.abs(n) >= bignum) {
                n /= bignum;
                suffix = letter;
                break;
            }
        }
        return exports.pretty_number_raw(n, precision) + suffix;

    };

    exports.pretty_number_raw = function(n, precision) {
        n = parseFloat(n);
        precision = (precision === undefined) ? 1 : precision;
        var is_negative = n < 0,
            fixed = n.toFixed(precision).split('.'),
            formatted = exports.commaize(Math.abs(parseInt(fixed[0], 10)));
        if (fixed[1] && parseInt(fixed[1], 10) !== 0) {
            formatted += '.' + fixed[1];
        }
        return (is_negative ? '-' : '') + formatted;
    };

    exports.pretty_file_size = function(n) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        var n_sizes = sizes.length;
        if (n === 0) {
            return '0 Bytes';
        }
        var i = Math.floor(Math.log(n) / Math.log(1024));
        var suffix = i >= n_sizes ? sizes[n_sizes - 1] : sizes[i];
        return Math.round(n / Math.pow(1024, Math.min(i, n_sizes - 1))) + ' ' + suffix;
    };

    // takes a number and returns an ordinalized string:
    //
    // 1 -> "1st"
    // 45 -> "45th"
    exports.ordinalize = function(number) {
        var abs_number = Math.abs(number);
        if (_.include([11, 12, 13], abs_number % 100)) {
            return number + 'th';
        }

        switch (abs_number % 10) {
            case 1: return number + 'st';
            case 2: return number + 'nd';
            case 3: return number + 'rd';
            default: return number + 'th';
        }
    };

    exports.format_numeric_bucket = function(bucket) {
        var range = bucket.split(' - ');
        return exports.pretty_number(range[0]) + ' - ' + exports.pretty_number(range[1]);
    };

    exports.expand_num = function(num) {
        num = num.replace(/,/g, '');
        var n = num.slice(0, num.length - 1);
        if (/.*M$/.test(num)) {
            return parseFloat(n) * 1000000;
        } else if (/.*K$/.test(num)) {
            return parseFloat(n) * 1000;
        } else {
            return parseFloat(num);
        }
    };

    // This is not a true deep copy, it will not copy arrays or contents of arrays
    exports.deep_copy = function() {
        var result = {},
            i, p, properties = {}, objects;
        for (i = arguments.length - 1; i >= 0; i--) {
            if (typeof arguments[i] !== 'undefined') {
                if (arguments[i] !== null && typeof arguments[i] === 'object' && !_.isArray(arguments[i])) {
                    for (p in arguments[i]) {
                        if (arguments[i].hasOwnProperty(p)) {
                            properties[p] = true;
                        }
                    }
                } else {
                    return arguments[i];
                }
            }
        }
        for (p in properties) {
            if (properties.hasOwnProperty(p)) {
                objects = [];
                for (i = 0; i < arguments.length; i++) {
                    if (typeof arguments[i] !== 'undefined') {
                        objects.push(arguments[i][p]);
                    }
                }
                result[p] = exports.deep_copy.apply(this, objects);
            }
        }
        return result;
    };

    exports.floatformat = function(num, places) {
        // warning: using this + commaize does not do what you expect
        // when your numbers are in scientific notation
        if (typeof num === 'number') {
            var n = num.toFixed(places);
            var intn = parseInt(n, 10);
            if ((n - intn) === 0) {
                return intn;
            } else {
                return n;
            }
        } else {
            return num;
        }
    };

    exports.default_date_format = 'yyyy-MM-dd';

    exports.to_localized_date = function(date) {
        if (_.isNaN(mp.report.globals.utc_offset)) {
            throw 'utc_offset not set';
        }
        return (new Date(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds(),
            date.getUTCMilliseconds()
        )).addMinutes(mp.report.globals.utc_offset);
    };

    exports.to_localized_date_string = function(date) {
        return mp.utility.to_localized_date(date).toString(this.default_date_format);
    };

    // converts a string date of the form yyyy-mm-dd or yyyy-mm-dd hh:mm:ss to the ms epoch
    exports.date_to_ms_epoch = function(date_string) {
        var time_split;
        var split = date_string.split(' ');
        var date_split = split[0].split('-');
        if (split[1]) {
            time_split = split[1].split(':');
        }

        // Strip off leading 0 from the month, since this messes up the parseInt.
        if (date_split[1][0] === '0') {
            date_split[1] = date_split[1][1];
        }

        // Move one month back since js Date is 0-11, and returned date is 1-12
        if (time_split) {
            return new Date(date_split[0], parseInt(date_split[1], 10) - 1, date_split[2], time_split[0], time_split[1], time_split[2]).getTime();
        } else {
            return new Date(date_split[0], parseInt(date_split[1], 10) - 1, date_split[2]).getTime();
        }
    };

    exports.MP_ANYTHING_EVENT = '$mp_anything_event';

    exports.prepare_event_names_for_dropdown = function(events) {
        events = _(events).chain()
        .map(function(e) { return [e, mp.utility.rename_mp_event(e)]; })
        .sortBy(function(e) { return e[1].toLowerCase(); })
        .value();
        return events;
    };

    exports.rename_mp_event = function(event_name, invert) {
        var mapping = {
            '$campaign_delivery': 'Notification Sent',
            '$campaign_open': 'Notification Opened',
            '$campaign_bounced': 'Notification Bounced',
            '$campaign_marked_spam': 'Notification Marked Spam',
            '$experiment_started': 'Experiment Started',
            '$show_survey': 'Show Survey',
            '$top_events': 'Your Top Events'
        };
        if (invert) {
            mapping = _.invert(mapping);
        }
        return _.has(mapping, event_name) ? mapping[event_name] : event_name;
    };

    exports.mp_property_mapping = {
        '$answer_count': 'Answer Count',
        '$app_build_number': '$app_build_number',
        '$app_release': 'App Release',
        '$app_version': 'App Version',
        '$app_version_string': '$app_version_string',
        '$bluetooth_enabled': 'Bluetooth Enabled',
        '$bluetooth_version': 'Bluetooth Version',
        '$brand': 'Brand',
        '$browser': 'Browser',
        '$browser_version': 'Browser Version',
        '$carrier': 'Carrier',
        '$city': 'City',
        '$current_url': 'Current URL',
        '$experiments': 'Experiments',
        '$device': 'Device',
        '$duration': 'Duration',
        '$from_binding': 'From Binding',
        '$google_play_services': 'Google Play Services',
        '$has_nfc': 'Has NFC',
        '$has_telephone': 'Has Telephone',
        '$import': 'Import',
        '$initial_referrer': 'Initial Referrer',
        '$initial_referring_domain': 'Initial Referring Domain',
        '$ios_ifa': 'iOS IFA',
        '$lib_version': 'Library Version',
        '$manufacturer': 'Manufacturer',
        '$model': 'Model',
        '$os': 'Operating System',
        '$os_version': 'OS Version',
        '$radio': 'Radio',
        '$referrer': 'Referrer',
        '$referring_domain': 'Referring Domain',
        '$region': 'Region',
        '$screen_dpi': 'Screen DPI',
        '$screen_height': 'Screen Height',
        '$screen_width': 'Screen Width',
        '$search_engine': 'Search Engine',
        '$survey_shown': 'Survey Shown',
        '$watch_model': 'Watch Model',
        '$wifi': 'Wifi',
        'campaign_id': 'Campaign',
        'collection_id': 'Collection ID',
        'message_id': 'Message ID',
        'message_subtype': 'Message Subtype',
        'message_type': 'Message Type',
        'mp_country_code': 'Country',
        'mp_device_model': 'Device Model',
        'mp_keyword': 'Search Keyword',
        'mp_lib': 'Mixpanel Library',
        'survey_id': 'Survey ID',
        'utm_campaign': 'UTM Campaign',
        'utm_content': 'UTM Content',
        'utm_medium': 'UTM Medium',
        'utm_source': 'UTM Source',
        'utm_term': 'UTM Term',

        // the following are no longer used but
        // should be included for historical reasons
        'mp_browser': 'Browser',
        'mp_page': 'Page View',
        'mp_platform': 'Platform',
        'mp_referrer': 'Referrer'
    };


    exports.mp_property_inverse = _.invert(exports.mp_property_mapping);

    exports.rename_mp_property = function(property_name, event) {
        var mapping = exports.mp_property_mapping;

        if (mapping.hasOwnProperty(property_name)) {
            return mapping[property_name];
        }

        if (event && property_name === 'campaign_id' && exports.includes_campaign_event([event])) {
            return 'Campaign';
        }

        // default conversion for all properties starting with '$'
        if (property_name[0] === '$' && property_name.length > 1) {
            var parts = _.map(property_name.substr(1).split('_'), _.capitalize);
            return parts.join(' ');
        }

        return property_name;
    };

    exports.to_mp_property = function(property_name) {
        var mapping = exports.mp_property_inverse;
        if (mapping.hasOwnProperty(property_name)) {
            property_name = mapping[property_name];
        }
        return property_name;
    };

    exports.format_long_value = function(property_name, property_value) {
        var ret = property_value;
        var found = Date.parseExact(ret, 'yyyy-MM-ddTHH:mm:ss');
        if (found) {
            ret = found.toString('ddd, MMM d, hh:mm tt');
        }
        return _.trim(ret);
    };

    exports.make_tag =  function(name, attrs, text){
        return $('<'+name+'></'+name+'>', attrs).text(text);
    };

    exports.format_html_property_value = function(property_name, property_value, max_length) {
        var long_value;
        var ret_tag;

        if (_.isUndefined(property_value)) {
            ret_tag = $('<span>&nbsp;</span>');
        } else {
            if (_.isObject(property_value)) {
                property_value = JSON.stringify(property_value);
            }
            var prop_value = String(property_value);

            if (property_name && (property_name.match(/^\$?email$/i) || exports.is_valid_email(property_value))) {
                long_value = exports.format_long_value(property_name, property_value);
                ret_tag = exports.make_tag('a', {'class':"email_property_link", 'title':long_value, 'href': 'mailto:' + prop_value}, prop_value);
            } else if (exports.isURL(property_value)) {
                var shortened = max_length ? exports.truncate_middle(prop_value, max_length) : prop_value;
                var href_val = prop_value;
                if (href_val.indexOf("://") === -1) {
                    href_val = 'http://' + href_val;
                }
                ret_tag = exports.make_tag('a', {
                    'class':"url_property_link",
                    'target':"_blank",
                    'href':href_val,
                    'title':(shortened !== prop_value ? prop_value : undefined)
                }, shortened);
            } else {
                long_value = exports.format_long_value(property_name, property_value);
                var title = (long_value && max_length && long_value.length > max_length) ? long_value : undefined;
                ret_tag = exports.make_tag('div', {title: title}, prop_value);
            }
        }
        ret_tag.addClass('mp_tooltip_enabled');
        return ret_tag;
    };

    exports.includes_campaign_event = function(events) {
        var global_custom_events;
        try {
            global_custom_events = Backbone.data.custom_events;
        } catch (e) { }

        var self_or_non_custom_alternatives = function(name) {
            var alternatives;

            if (global_custom_events) {
                var custom_event = global_custom_events.get_by_name(name);
                if (custom_event) {
                    alternatives = custom_event.get_alternatives();
                }
            }

            return alternatives || name;
        };

        var name_starts_with_campaign = function(name) {
            return name && name.match(/^\$campaign_/);
        };

        return _.chain(events)
            .map(self_or_non_custom_alternatives)
            .flatten()
            .any(name_starts_with_campaign).value();
    };

    exports.get_campaign_name = function(campaign_id) {
        // find campaigns where first element of array matches id
        var campaign = _.findWhere(mp.report.globals.project_campaigns, {0:parseInt(campaign_id, 10)});
        return campaign ? campaign[1] : campaign_id.toString();
    };

    exports.get_country_name = function(country_code) {
        var cc = exports.country_codes,
            uc_code = country_code.toUpperCase();
        return cc.hasOwnProperty(uc_code) ? cc[uc_code] : country_code;
    };

    var HTTP_PROPS = [
      '$initial_referring_domain',
      '$referring_domain',
      'origin_domain',
      'initial domain'
    ];
    exports.human_name_for_segment_value = function(segment_value, segment_property, arb_event) {
        // handle both p+e properties and old-style properties
        var property = _.isObject(segment_property) ? segment_property.name : segment_property;

        if (property === 'mp_country_code') {
            segment_value = exports.get_country_name(segment_value);
        } else if (_.contains(HTTP_PROPS, segment_property)) {
            if (exports.isURL(segment_value) && !/^http:\/\//.test(segment_value)) {
                segment_value = "http://" + segment_value;
            }
        } else if (property === 'campaign_id' && exports.includes_campaign_event([arb_event])) {
            segment_value = exports.get_campaign_name(segment_value);
        }

        return segment_value;
    };


        exports.log = (mp.globals && mp.globals.debug && window.console && console.log && console.log.apply) ?
            _.bind(console.log, console) : function() {};
        exports.warn = (mp.globals && mp.globals.debug && window.console && console.warn && console.warn.apply) ?
            _.bind(console.warn, console) : function() {};
        exports.error = (mp.globals && mp.globals.debug && window.console && console.error && console.error.apply) ?
            _.bind(console.error, console) : function() {};

        exports.group = (mp.globals && mp.globals.debug && window.console && console.group && console.group.apply) ?
            _.bind(console.group, console) : exports.log;
        exports.groupCollapsed = (mp.globals && mp.globals.debug && window.console && console.groupCollapsed && console.groupCollapsed.apply) ?
            _.bind(console.groupCollapsed, console) : exports.log;
        exports.groupEnd = (mp.globals && mp.globals.debug && window.console && console.groupEnd && console.groupEnd.apply) ?
            _.bind(console.groupEnd, console) : function() {};

    exports.timer = {
        start_times: {},

        start: function(id) {
            id = id || Math.random();
            this.start_times[id] = new Date().getTime();
            return id;
        },

        stop: function(id) {
            var diff = new Date().getTime() - this.start_times[id];
            delete this.start_times[id];
            return diff;
        }
    };

    // RIPPED FROM streams.util
    exports.string_time = function(seconds) {
        var minutes = seconds / 60,
              hours = minutes / 60,
               days = hours / 24,
              weeks = days / 7;

        if (isNaN(seconds)) {
            return '?';
        } else if (seconds < 60) {
            return 'less than a minute';
        } else if (minutes < 90) {
            return minutes.toFixed(0) + ' min.';
        } else if (hours < 36) {
            return hours.toFixed(0) + ' hours';
        } else if (days < 11) {
            return days.toFixed(0) + ' days';
        } else {
            return weeks.toFixed(0) + ' weeks';
        }
    };

    exports.time_since_date = function(date) {
        var seconds = (new Date() - date) / 1000;
        return exports.string_time(seconds);
    };

    exports.inflect = function(noun, number) {
        if (typeof(number) === "string") {
            number = parseFloat(number);
        }
        var inflected = noun;
        if (number !== 1) {
            var replacements = [[/(s|ss|sh|ch|x|o)$/, "$1es"],
                                [/([^aeiou])y$/, "$1ies"],
                                [/$/, "s"]];
            for (var i = 0; i < replacements.length;i++) {
                if (inflected.match(replacements[i][0])) {
                    inflected = inflected.replace(replacements[i][0], replacements[i][1]);
                    break;
                }
            }
        }
        return inflected;
    };

    // Takes in an integer number of seconds and returns a human readable string for the duration
    // e.g. 43 seconds, 5 minutes, 2 hours, 3 days
    exports.format_duration = function(seconds) {
        var value;
        var suffix;

        if (seconds < 60) {
            value = seconds;
            suffix = ' second';
        } else if (seconds < 60 * 60) {
            value = Math.floor(seconds / 60);
            suffix = ' minute';
        } else if (seconds < 60 * 60 * 24) {
            value = (seconds / 60 / 60).toFixed(1);
            suffix = ' hour';
        } else {
            value = (seconds / 60 / 60 / 24).toFixed(1);
            suffix = ' day';
        }
        return value + mp.utility.inflect(suffix, value);
    };

    exports.set_flag = function(flag_name) {
        $.post('/set_flag/', {flag: flag_name});
        mp.report.globals.flags[flag_name] = 1;
    };

    exports.increment_flag = function(flag_name) {
        $.post('/increment_flag/', {flag: flag_name});
        mp.report.globals.flags[flag_name] = (mp.report.globals.flags[flag_name] || 0) + 1;
    };

    exports.throttle = function(func, wait, context) {
        // like _.debounce (with code stolen from the same), but fires off the first call immediately
        var timeout;
        return function() {
            var inner_context = context || this,
                args = arguments;
            var throttler = function() {
                clear();
                func.apply(inner_context, args);
            };
            var clear = function() {
                timeout = null;
            };
            clearTimeout(timeout);
            if (timeout) {
                timeout = setTimeout(throttler, wait);
            } else {
                func.apply(inner_context, args);
                timeout = setTimeout(clear, wait);
            }
        };
    };

    // compute_sig assumes that the values have already been $.toJSON-ed
    exports.compute_sig = function(params) {
        params.api_key = mp.report.globals.api_key;
        // the template variable utc_now was the time when the page loaded
        // we stored how wrong the clock was in local_offset and use it to compute expire
        var utc_now = new Date().getTime() + mp.report.globals.local_offset;
        params.expire = Math.ceil(utc_now / 1000) + 60 * 60; // 1 hour expiry
        var param_names = _.keys(params).sort();
        var sig_string = _.reduce(param_names, function(memo, key) {
            if (_.isUndefined(params[key])) {
                return memo;
            }
            return memo + key + '=' + params[key];
        }, '');
        sig_string += mp.report.globals.api_secret;
        params.sig = hex_md5(sig_string);
    };

    exports.property_values_limit = function() {
        return 255;
    };

    exports.is_valid_email = function(str) {
        var filter = /^[+a-zA-Z0-9_.-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z0-9]{2,}$/;
        return filter.test(str);
    };

    exports.strip_spaces_between_tags = function(html_str) {
        return html_str.replace(/>\s+</g, '><');
    };

    // Given a $('<table>') or a $('<tr>'), returns a
    // $('<tr>') that is one pixel tall and has
    // the same column widths as the argument.
    //
    // This is mostly useful for making tables that
    // have stationary headers and scrolling bodies, or vice versa.
    exports.spacer_row = function(table) {
        var ret = $('<tr class="spacer_row" style="height: 1px"></tr>');
        var master_row = $(table);
        if (! master_row.is('tr')) {
            master_row = table.find('tr').first();
        }
        var master_cells = master_row.find('th, td');
        master_cells.each(function(index, elem) {
            var width = $(elem).outerWidth();
            var span = $(elem).attr('colspan');

            var spacer_cell =
                $('<td></td>').html(
                    $('<div></div>').css('width', width + 'px')
                );

            if (span) {
                spacer_cell.attr('colspan', span);
            }

            ret.append(spacer_cell);
        });

        return ret;
    };

    // ARB HELPERS

    // converts a javascript string into a javascript string
    // representing an arb string
    //
    // \$user"name => "\\$user\"name"
    exports.arb_escape = function(str, no_quotes) {
        if (!_.isString(str)) { return JSON.stringify(str); }

        // arb only supports \" and \n, but we don't need to escape to \\n
        // \r can't be escaped, so we can't use JSON.stringify
        str = str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"');

        // only used in media/plugins/highcharts/chart.js
        if (no_quotes) { return str; }
        return _.sprintf('"%s"', str);
    };

    // MATH FUNCTIONS

    // rounds a number to a certain amount of decimal places
    exports.round = function(num, dec) {
        return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
    };

    var COLORS = [
        '#53a3eb',
        '#32bbbd',
        '#a28ccb',
        '#da7b80',
        '#2bb5e2',
        '#e8bc66',
        '#d390b6',
        '#a0a7d6',
        '#e8cc75',
        '#f3ba41',
        '#7d92cd',
        '#24be86'
    ];

    var VIBRANT_COLORS = [
        '#2ec6c8',
        '#a58bd6',
        '#c68185',
        '#5ab0ee',
        '#dcbd80',
        '#94C897',
        '#8E95F2',
        '#76B9ED',
        '#D39D23',
        '#AF85C9'
    ];

    var COLORBLIND_COLORS = [
        "#dc747a",
        "#3c9aef",
        "#f8970e"
    ];

    exports.nth_color = function(index, color_scheme) {
        var colors;
        if (color_scheme === 'vibrant') {
            colors = VIBRANT_COLORS;
        } else if (color_scheme === 'colorblind') {
            colors = COLORBLIND_COLORS;
        } else {
            colors = COLORS;
        }
        return colors[index % colors.length];
    };

    // same implementation as google closure
    exports.regex_escape = function(s) {
        return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
            replace(/\x08/g, '\\x08');
    };

    exports.base64_encode = function(data) {
        var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc="", tmp_arr = [];

        if (!data) {
            return data;
        }

        data = exports.utf8_encode(data);

        do { // pack three octets into four hexets
            o1 = data.charCodeAt(i++);
            o2 = data.charCodeAt(i++);
            o3 = data.charCodeAt(i++);

            bits = o1<<16 | o2<<8 | o3;

            h1 = bits>>18 & 0x3f;
            h2 = bits>>12 & 0x3f;
            h3 = bits>>6 & 0x3f;
            h4 = bits & 0x3f;

            // use hexets to index into b64, and append result to encoded string
            tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
        } while (i < data.length);

        enc = tmp_arr.join('');

        switch( data.length % 3 ){
            case 1:
                enc = enc.slice(0, -2) + '==';
                break;
            case 2:
                enc = enc.slice(0, -1) + '=';
                break;
        }

        return enc;
    };

    exports.utf8_encode = function(string) {
        string = (string+'').replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        var utftext = "",
            start,
            end;
        var stringl = 0,
            n;

        start = end = 0;
        stringl = string.length;

        for (n = 0; n < stringl; n++) {
            var c1 = string.charCodeAt(n);
            var enc = null;

            if (c1 < 128) {
                end++;
            } else if((c1 > 127) && (c1 < 2048)) {
                enc = String.fromCharCode((c1 >> 6) | 192, (c1 & 63) | 128);
            } else {
                enc = String.fromCharCode((c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128);
            }
            if (enc !== null) {
                if (end > start) {
                    utftext += string.substring(start, end);
                }
                utftext += enc;
                start = end = n+1;
            }
        }

        if (end > start) {
            utftext += string.substring(start, string.length);
        }

        return utftext;
    };

    exports.get_next_month = function(date) {
        var next_month = (date.getUTCMonth() + 1) % 12;
        var next_year = date.getUTCFullYear() + Math.floor((date.getUTCMonth() + 1) / 12);
        var new_date = new Date(next_year, next_month, 1);
        return new_date.addMinutes(-new_date.getTimezoneOffset());
    };

    exports.first_of_month = function(date) {
        var new_date = new Date(date.getUTCFullYear(), date.getUTCMonth(), 1);
        return new_date.addMinutes(-new_date.getTimezoneOffset());
    };

    exports.get_name_initials = function(name) {
        name = name.replace(/^\s+|\s+$/g,''); //remove leading and trailing spaces
        var name_initials = "";
        if (name) {
            name = name.split(' ');
            name_initials = name[0].charAt(0);
            if (name.length > 1) {
                name_initials += name[name.length - 1].charAt(0);
            }
        }
        return name_initials;
    };

    exports.get_color_class_for_string = function(str) {
        var letter = null;
        while(!letter) {
            str = b64_md5(str || '');
            letter = _.first(str.match(/[a-z]/i));
        }
        return 'color_' + letter.toUpperCase();
    };

    exports.stats = {
        stat: function(metric, value, tags) {
            tags = tags || {};
            return $.get('/stats/stat', {
                metric: metric,
                value: value,
                tags: JSON.stringify(tags)
            });
        }
    };

    exports.get_people_events_or_standard_property_filter_class = function () {
        if (mp.report.globals.is_people_events_active) {
            return mp.widgets.PeopleEventsPropertyFilter;
        } else {
            return mp.widgets.PropertyFilter;
        }
    };

    exports.get_people_events_or_standard_property_select_class = function () {
        if (mp.report.globals.is_people_events_active) {
            return Backbone.widgets.PeopleEventsPropertySelect;
        } else {
            return Backbone.widgets.PropertySelect;
        }
    };

    var HIDDEN_PEOPLE_PROPERTIES = [
        '$answers',
        '$campaigns',
        '$deliveries',
        '$experiments',
        '$events_distinct_id',
        '$notifications',
        '$predict_convert_event',
        '$predict_grade_last_updated'
    ];

    exports.get_global_hidden_people_properties = function() {
        return _.clone(HIDDEN_PEOPLE_PROPERTIES);
    };

    exports.CSS_TRANSITION_END_EVENTS = "transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd";

    // Selectors can either be a string or an object containing
    // the keys selector, behaviors.  This method returns an object
    // with a selector key and a behavior key if available in original.
    exports.parse_selector = function(selector) {
        var to = {};
        if (_.isObject(selector)) {
            if (!_.isEmpty(selector.behaviors)) {
                to.behaviors = selector.behaviors;
            }
            if (selector.selector) {
                to.selector = selector.selector;
            }
        } else {
            to.selector = selector;
        }

        return to;
    };

    // Returns a string or an object based on existence of behaviors
    exports.build_selector = function(selector, behaviors) {
        var ret;
        if (!_.isEmpty(behaviors)) {
            ret = {
                selector: selector,
                behaviors: behaviors
            };
        } else {
            ret = selector;
        }
        return ret;
    };
});
