_.namespace("mp.engage.widgets", function() {
    "use strict";

    var _EVENT_COLORS = ['light_blue', 'orange', 'teal', 'purple', 'gray'];
    var _event_counter = 0;

    function UserStream(item) {
        this.class_name = "user_stream";
    }
    _.inherit(UserStream, JSWidget);

    UserStream.prototype.create = function(container) {
        UserStream.superclass.create.call(this, container);
        this.main_body = $('<div class="main_body">');

        this.container.append(this.main_body);
        this.show_more_button = $('<div id="show_more_button">').text('Show More');
        this.show_more_button.click(_.bind(function() {
            this.show_more_button.hide();
            this.ajax_loader.css('display', 'block');

            if (this.events_list.length < 100) {
                this._query_more();
            } else {
                this.ajax_loader.hide();
                this._render_events();
            }
        }, this));
        this.container.append(this.show_more_button);

        this.ajax_loader = $('<img src="media/img/ajax-loader-big.gif" class="loader">');
        this.container.append(this.ajax_loader);

        this.length_determiner = $('#text_length_determiner');
        if (this.length_determiner.length === 0) {
            $('body').append('<div id="text_length_determiner"></div>');
            this.length_determiner = $('#text_length_determiner');
            this.length_determiner.css({
                position: 'absolute',
                height: 'auto',
                width: 'auto',
                'white-space': 'nowrap',
                'visibility': 'hidden'
            });
        }// Create length-determiner

        this.events_list = []; // Buffer of events -- we query by week, but only render 100 events at a time.
        this.last_event_date = undefined; // Keep track of when we need to draw a new date header
        this.has_events = false;

        return this;
    };

    // Takes an array since we may have a engage distinct id and a events distinct_id
    // and we have to merge the results
    UserStream.prototype.set_distinct_ids = function(distinct_ids) {
        if (!_.isNull(distinct_ids)) {
            this.to_date = mp.utility.to_localized_date(new Date());
            this.main_body.empty();
            this.distinct_ids = distinct_ids;
            this.events_to_colors = {};
            this.events_list = [];
            this.earliest_time = null;
            this.has_events = false;
            this.last_event_date = undefined;

            this.show_more_button.hide();
            this.ajax_loader.css('display', 'block');

            this._query_more();
        }
    };

    UserStream.prototype._query_more = function() {
        var from_date = this.to_date.clone().add(-90).days();
        var limit = 1000;
        var params = {
            'to_date': this.to_date.toString('yyyy-MM-dd'),
            'from_date': from_date.toString('yyyy-MM-dd'),
            'distinct_ids': this.distinct_ids,
            'limit': limit
        };
        this.to_date.add(-1).days();

        MP.api.query("api/2.0/stream/query", params)
        .done(_.bind(function(result) {
            console.log(result);
            this.ajax_loader.hide();

            if (result.status !== 'ok') {
                this.main_body.append('Error retrieving event data.');
                return;
            }
            if (result.results.events.length === 0 && !this.has_events) {
                $('#stream_container').hide();
                $('#no_data_container').show();
            } else {
                this.has_events = true;
                $('#stream_container').show();
                $('#no_integrated_container, #no_data_container').hide();
            }

            var events = result.results.events,
                index = 0;

            // find where the events from the server overlap the events we
            // have cached.
            if (this.earliest_time) {
                _.each(events, function (event) {
                    if (event.properties.time <= this.earliest_time) {
                        index++;
                    }
                }, this);
            } else {
                index = events.length;
            }

            this.events_list = events.slice(0, index).concat(this.events_list);
            if (this.events_list.length > 0) {
                this.earliest_time = this.events_list[0].properties.time;
                if (events.length >= limit) {
                    this.to_date = this._date_for_event(this.events_list[0]);
                } else {
                    this.to_date = from_date;
                }
                this._render_events();
            }
        }, this));
    };

    UserStream.prototype._render_property = function(row, property, property_value, raw_event_name) {
        if (property === 'mp_country_code' || property === '$country_code') {
            property_value = mp.utility.get_country_name(property_value);
        }
        if (property === 'campaign_id' && mp.utility.includes_campaign_event([raw_event_name])) {
            property_value = mp.utility.get_campaign_name(property_value);
        }

        var property_div = $('<div class="property_cell">').html(
            '<div class="property_content">' +
                '<span class="property_name"></span><span class="property_value"></span>' +
            '</div>'
        );

        if (_.isObject(property_value)) {
            property_value = JSON.stringify(property_value);
        }

        property_div.find('.property_name').text(mp.utility.rename_mp_property(property, raw_event_name)+": ");
        property_div.find('.property_value').text(property_value);

        var displayed_string = mp.utility.rename_mp_property(property, raw_event_name) + ': ' + property_value;
        var text_width = this.length_determiner.text(displayed_string).width();
        if (text_width > this.cell_tooltip_threshold) {
            var tooltip = $('<div class="tooltip">').text(property_value);
            property_div.append(tooltip);
        }

        row.append(property_div);
    };

    UserStream.prototype._render_event_group = function(event_group) {
        var event_name = mp.utility.rename_mp_event(event_group[0].event);
        var event_group_container = $('<div class="event_group">').addClass(this._color_for_event(event_name));

        _.each(event_group, function(event_info) {
            var event_info_container = $('<div class="event_info">');
            var cur_date = new Date(event_info.properties.time * 1000); // JS is ms epoch
            // The result is returned to us in UTC time, but the browser always displays by the local
            // timezone, so we modify the time to compensate for this
            cur_date.addMinutes(cur_date.getTimezoneOffset() + mp.report.globals.utc_offset);

            event_group_container.append(
                event_info_container.append(
                    $('<span>').addClass('time').text(cur_date.toString('h:mm tt ')),
                    $('<div>').addClass('color_circle').append($('<div class="inner_circle">')),
                    $('<span>').addClass('event_name').text(event_name),
                    $('<div>').addClass('properties_arrow')
                )
            );

            var properties = _.without(_.keys(event_info.properties), 'distinct_id', 'time', 'sampling_factor').sort();
            if (properties.length > 0) {
                event_info_container.addClass('has_properties');
                event_info_container.click(_.bind(function() {
                    if (!event_info_container.next().hasClass('properties_bg')) {
                        var properties_container = $('<div class="properties_container">');
                        for (var i = 0;i < properties.length;i += 2) {
                            var row = $('<div class="property_row">');
                            this._render_property(row, properties[i], event_info.properties[properties[i]], event_info.event);

                            if (!_.isUndefined(properties[i+1])) {
                                this._render_property(row, properties[i+1], event_info.properties[properties[i+1]], event_info.event);
                            } else {
                                row.append($('<div>'));
                            }
                            properties_container.append(row);
                        }

                        var properties_bg = $('<div class="properties_bg">');
                        properties_bg.append(properties_container);
                        event_info_container.after(properties_bg);
                    }

                    event_info_container.next().toggle();
                    event_info_container.toggleClass('active');
                }, this));
            }
        }, this);

        if (event_group.length > 1) {
            var event_group_header = $('<div class="event_info group_title">');
            var event_info = event_group[0];
            var cur_date = new Date(event_info.properties.time * 1000); // JS is ms epoch
            cur_date.addMinutes(cur_date.getTimezoneOffset() + mp.report.globals.utc_offset);

            event_group_header.append(
                $('<span>').addClass('time').text(cur_date.toString('h:mm tt')),
                $('<div>').addClass('color_circle').append($('<div class="inner_circle">')),
                $('<span>').addClass('event_name').text(event_name),
                $('<div>').addClass('number').text(event_group.length)
            );
            event_group_header.click(function() {
                event_group_container.toggleClass('expanded');
                if (!event_group_container.hasClass('expanded')) {
                    event_group_container.find('.properties_bg').hide();
                }
            });
            event_group_container.prepend($('<div class="arrow">'));
            event_group_container.prepend(event_group_header);
        }

        this.main_body.append(event_group_container);
    };

    UserStream.prototype._render_events = function() {
        this.cell_tooltip_threshold = (this.container.width() / 2) - 48;
        var events_to_render = Math.min(this.events_list.length, 100);

        var i = 0;
        while (i < events_to_render) {
            var events_group = [this.events_list.pop()]; // list of events to group together, newest to oldest
            i++;

            var cur_date_without_time = this._date_for_event(events_group[0]);

            if (_.isUndefined(this.last_event_date) || this.last_event_date.isAfter(cur_date_without_time)) {
                this.last_event_date = cur_date_without_time;
                if (cur_date_without_time.compareTo(mp.utility.to_localized_date(new Date()).clearTime()) === 0) {
                    this.main_body.append(
                        $('<div class="day_header">').text('Today, ' + cur_date_without_time.toString('MMMM d, yyyy'))
                    );
                } else {
                    this.main_body.append(
                        $('<div class="day_header">').text(cur_date_without_time.toString('dddd, MMMM d, yyyy'))
                    );
                }
            }

            // Consume all events that are the same event in the same day
            while (i < events_to_render &&
                   this.events_list[this.events_list.length - 1].event === events_group[0].event &&
                   this._date_for_event(this.events_list[this.events_list.length - 1]).compareTo(this._date_for_event(events_group[0])) === 0) {
                events_group.push(this.events_list.pop());
                i++;
            }

            this._render_event_group(events_group);
        }
        this.show_more_button.show();
    };

    UserStream.prototype._date_for_event = function(event) {
        return mp.utility.to_localized_date(new Date(event.properties.time * 1000)).clearTime();
    };

    UserStream.prototype._color_for_event = function(event) {
        var color = this.events_to_colors[event];
        if (_.isUndefined(color)) {
            color = _EVENT_COLORS[_event_counter];
            this.events_to_colors[event] = color;
            _event_counter = (_event_counter + 1) % _EVENT_COLORS.length;
        }
        return color;
    };

    return {
        UserStream: UserStream
    };
});
