_.namespace('mp.engage.property_formatter', function(ns) {
    "use strict";

    var format_country = function(value) {
        return mp.utility.get_country_name(value) || 'Unknown';
    };

    var format_date = function(value) {
        var ret = value;
        var found = Date.parseExact(value, 'yyyy-MM-ddTHH:mm:ss');
        if (found) {
            if (found.getFullYear() == Date.today().getFullYear()) {
                ret = found.toString('MMM d, h:mm tt');
            } else {
                ret = found.toString('MMM d, yyyy');
            }
        }
        return ret;
    };

    var format_transactions = function(transactions) {
        // turns a list of transactions into a single "total revenue" value
        return _.reduce(transactions, function(memo, transaction) {
            if (_.has(transaction, '$amount') && _.isNumber(transaction['$amount'])) {
                return memo + transaction['$amount'];
            }
            return memo;
        }, 0);
    };


    //////////////////////////////////

    var value_exists = function(value) {
        // NOT null, undefined, "", or NaN
        // BUT false and 0 are totally legit
        return (value || (false === value) || (0 === value));
    };

    // Returns a single HTML tag, wrapping the result of the property_value,
    // suitable for the common case of displaying the property.

    // Should handle null/undefined property_names gracefully.
    ns.format_html_property_value = function(property_name, property_value, no_icon) {
        if (! value_exists(property_value)) {
            return $("<span>&nbsp;</span>");
        } else if (property_name === '$transactions') {
            return $(_.sprintf(
                "<span>$%s</span>",
                _.numberFormat(format_transactions(property_value), 2)
            ));
        }
        // ELSE
        var ret_string = String(property_value);

        var is_country_field = (property_name === '$country_code');

        ret_string = format_date(ret_string);
        ret_string = is_country_field ? format_country(ret_string) : ret_string;

        var ret_tag;
        if (property_name && property_name.match(/^\$?email$/i)) {
            var long_value = mp.utility.format_long_value(property_name, property_value);
            ret_tag = $('<a class="email_property_link"></a>').text(ret_string);
            ret_tag.attr("title", long_value);
            ret_tag.attr("href", "mailto:" + property_value);
        } else if (mp.utility.isURL(property_value)) {
            var shortened = mp.utility.truncate_middle(property_value, 36);
            ret_tag = $('<a class="url_property_link"></a>').
                attr("title", property_value).
                attr("href", property_value).
                text(shortened);
        } else {
            var long_value = mp.utility.format_long_value(property_name, property_value);
            ret_tag = $("<div></div>").text(ret_string);

            if (long_value) {
                ret_tag.attr('title', long_value);
            }

            if (property_name == '$last_seen') {
                // Prepend last_seen tooltip with "Last seen"
                ret_tag.attr('title', 'Last seen ' + ret_tag.attr('title'));
            }
        }

        return ret_tag;
    };

    ns.format_property_name = function(property_name) {
        switch (property_name) {
        case '$campaigns':
            return 'Notifications Sent';
        case '$country_code':
            return 'Country';
        case '$surveys':
            return 'Surveys Received';
        case '$transactions':
            return 'Total Revenue';
        case '$os':
            return 'Operating System';
        }

        if (property_name[0] === '$') {
            var un_dollared = property_name.substr(1);
            var parts = _.map(un_dollared.split('_'), function(word) {
                if (word === 'ios') {
                    return 'iOS';
                }
                if (word.length) {
                    return word[0].toUpperCase() + word.substr(1);
                }
                return word;
            });
            return parts.join(' ');
        }
        return property_name;
    };

    // As a text string!
    ns.extract_user_name = function(user_properties) {
        var ret = user_properties['$name'] || user_properties['name'] || false;
        if (!ret) {
            var first = user_properties['$first_name'] || user_properties['first_name'] || "";
            var last = user_properties['$last_name'] || user_properties['last_name'] || "";
            ret = $.trim(first + ' ' + last);
        }
        return ret;
    };
});
