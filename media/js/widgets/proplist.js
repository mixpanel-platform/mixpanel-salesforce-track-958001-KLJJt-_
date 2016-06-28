/**
 * Editable list of key-value pairs.
 *
 * Provides:
 *  mp.engage.widgets.PropertyList
 *
 * Note: Despite being called PropertyList, an HTML table is used as
 * the basis of the widget rather than a ul or ol element
 */

/* global JSWidgetList: */
_.namespace('mp.engage.widgets', function(ns) {
    "use strict";

    var PropertyList = function() {
        this.class_name = "mp_editable_property_list";
    };
    _.inherit(PropertyList, JSWidgetList);

    // options = {
    //   initial_values : an object with initial key-value pairs
    //   editable_names : boolean (default false) - if true, allow existing prop names to be edited.
    //   hidden_properties : list of properties to not show,
    //   editable: allow inline editing of properties
    // }
    PropertyList.prototype.create = function(container, options) {
        PropertyList.superclass.create.call(this, container);
        this.container.empty();
        this.delete_callbacks = [];
        this.update_callbacks = [];
        this.cancelled_callbacks = [];
        this.unchanged_callbacks = [];
        this.hidden_properties = mp.utility.get_global_hidden_people_properties();
        options = options || {};

        if (options.initial_values) {
            this.add_all_properties(options.initial_values);
        }
        if (options.hidden_properties) {
            this.hidden_properties = options.hidden_properties;
        }

        this.editable = options.editable ? true : false;
        this.editable_names = options.editable_names ? true : false;

        this.bindings();
        return this;
    };

    PropertyList.prototype.remove = function() {
        mp.utility.unbind_outside_event('click', 'property_list');
        PropertyList.superclass.remove.call(this);
    };

    PropertyList.prototype.add_all_properties = function(dictionary) {
        var pairs = [];
        _.each(dictionary, function(val, name) {
            var displayname = mp.engage.property_formatter.format_property_name(name);
            pairs.push([ displayname.toLowerCase(), name, val ]);
        }, this);

        pairs.sort();

        _.each(pairs, function(name_val) {
            this.add_property(name_val[1], name_val[2]);
        }, this);
    };

    PropertyList.prototype.add_property = function(name, val, position) {
        if (this.hidden_properties && $.inArray(name, this.hidden_properties) >= 0) {
            return;
        }
        var prop = new Property();
        prop.set_editable_name(this.editable_names);
        if (this.format_name) {
            prop.format_name = _.bind(this.format_name, this); // as a result we cannot save formatted names
        }

        if (this.format_value) {
            prop.format_value = _.bind(this.format_value, this); // again, with values instead
        }

        prop.create(this, name, val, this.editable);

        if (_.isUndefined(position)) {
            this.append(prop);
        }
        else {
            this.insert(prop, position);
        }

        return prop;
    };

    PropertyList.prototype.remove_property = function(prop) {
        this.remove_item(prop);
    };

    PropertyList.prototype.get_values = function() {
        var vals = {};
        this.each(function(prop) {
            vals[prop.name] = prop.value;
        });
        return vals;
    };

    PropertyList.prototype.get_by_name = function(name) {
        return this.find(function(prop) {
            return name === prop.name;
        });
    };

    PropertyList.prototype.get_format_names = function() {
        var retvals = [];
        this.each(function(prop){
            retvals.push(prop.appearence_name());
        });
        return retvals;
    };

    PropertyList.prototype.has_changes = function() {
        return !_.isEqual(this.get_values(), this.initial_values);
    };

    PropertyList.prototype.on_property_updated = function(callback) {
       this.update_callbacks.push(callback);
    };

    PropertyList.prototype.on_property_deleted = function(callback) {
        this.delete_callbacks.push(callback);
    };

    // The user clicked the red X button, cancelling their attempt to edit
    PropertyList.prototype.on_property_edit_cancelled = function(callback) {
        this.cancelled_callbacks.push(callback);
    };

    // An attempt was made to edit, but the attempt didn't change the property,
    // either because the user attempted to set empty values, or just didn't bother
    // to change the values before clicking 'ok'
    PropertyList.prototype.on_property_edit_unchanged = function(callback) {
        this.unchanged_callbacks.push(callback);
    };

    PropertyList.prototype.property_updated = function(name, value) {
        _.each(this.update_callbacks, function(c) {
            c(name, value);
        });
    };

    PropertyList.prototype.property_deleted = function(name) {
        _.each(this.delete_callbacks, function(c) {
            c(name);
        });
    };

    PropertyList.prototype.property_cancelled = function(prop) {
        _.each(this.cancelled_callbacks, function(c) {
            c(prop);
        });
    };

    PropertyList.prototype.property_unchanged = function(prop, name, value) {
        _.each(this.unchanged_callbacks, function(c) {
            c(prop, name, value);
        });
    };

    PropertyList.prototype.bindings = function() {
        PropertyList.superclass.bindings.call(this);
        mp.utility.bind_outside_event('click', 'property_list', this.container, this.cancel_all_edits, this);
    };

    PropertyList.prototype._tabbed_to_next_property = function(prop) {
        var next_prop = this.widgets[this.indexOf(prop) + 1];
        if (next_prop) {
            next_prop.edit();
            if (this.editable_names) {
                next_prop.focus_name_input();
            }
            else {
                next_prop.focus_value_input();
            }
        }
    };

    PropertyList.prototype._tabbed_to_prev_property = function(prop) {
        var prev_prop = this.widgets[this.indexOf(prop) - 1];
        if (prev_prop) {
            prev_prop.edit();
            prev_prop.focus_value_input();
        }
    };
    PropertyList.prototype.cancel_all_edits = function(){
        _.each(this.widgets, function(a){
            a.save_if_valid();
        });
    };
    /////////////////////////////////////////
    // closely coupled to parent to validate
    var Property = function() {
        this.class_name = "mp_editable_property";
    };
    _.inherit(Property, JSWidget);

    Property.prototype.create = function(parent, name, value, editable) {
        PropertyList.superclass.create.call(this, $('<tr>'));

        this.parent = parent;
        this.editable = editable;
        this.editable_name = false;
        this.name = name;
        this.value = value;
        this._editing = false;
        this.fixname = name || value;

        this._$name_cell = $('<td>').addClass('name');
        this._$name = $('<div>').addClass('name_contents');
        this._$name_cell.append(this._$name);

        this._$value_cell = $('<td>').addClass('value');
        this._$value = $('<div>').addClass('value_contents');
        this._$value_cell.append(this._$value);

        if (editable) {
            this._$controls = $('<td>').addClass('controls');
            this.container.append(this._$name_cell, this._$value_cell, this._$controls);
            this.editable_bindings();
        } else {
            this.container.append(this._$name_cell, this._$value_cell);
        }

        this._render_not_editing_state();

        return this;
    };

    Property.prototype.editable_bindings = function() {
        this.container.on('click', '.name,.value,.edit', _.bind(this.edit, this));
        this.container.on('click', '.delete', _.bind(this._delete, this));
        this.container.on('click', '.cancel', _.bind(this._cancel, this));
        this.container.on('click', '.ok', _.bind(this._ok, this));
        this.container.on('keydown', 'input', _.bind(this._keydown, this));
    };

    Property.prototype.is_empty = function() {
        return !(this.name || this.value);
    };

    Property.prototype.appearence_name = function (){
        return $(this.container).find(".name span").text();
    };

    Property.prototype.edit = function(event) {
        if (this._editing || _.isArray(this.value)) {
            return false;
        }
        this.parent.cancel_all_edits();
        this._editing = true;
        this.container.addClass('editing');

        var namefield =
            $('<input type="text" placeholder="Add name" />').attr('value', this.name);

        if (! this._is_name_editable()) {
            namefield.attr('disabled', 'disabled');
        } else {
            this.container.addClass('name_editable');
        }
        this._$name.html(namefield);

        this._$value.html($('<input type="text" placeholder="Add property value" />').attr('value', this.value));
        this._$controls.html(
            $('<div class="space_wrapper"></div>').
                append(this._control_button("Cancel", "cancel")).
                append(this._control_button("Save", "ok"))
        );

        if (event) {
            // if the edit was prompted by a click on name or value, focus that
            // field, otherwise focus the value field
            if ($(event.target).is(this._$name) && this._is_name_editable()) {
                this.focus_name_input();
            } else {
                this.focus_value_input();
            }
        }

        return false;
    };

    Property.prototype.focus_name_input = function() {
        if (!this._editing) {
            return;
        }
        this._$name.children('input').focus();
    };

    Property.prototype.focus_value_input = function() {
        if (!this._editing) {
            return;
        }
        this._$value.children('input').focus();
    };

    Property.prototype.format_name = function(prop_name) {
        return $("<span></span>").text(
            mp.engage.property_formatter.format_property_name(prop_name)
        ).attr('title', prop_name);
    };

    Property.prototype.format_value = function(prop_name, prop_value) {
        return mp.engage.property_formatter.format_html_property_value(prop_name, prop_value);
    };

    Property.prototype.set_editable_name = function(editable_if_true) {
        this.editable_name = editable_if_true ? true : false;
    };

    Property.prototype._cancel = function() {
        if (!this._editing) {
            return false;
        }
        this._render_not_editing_state();
        this.parent.property_cancelled(this);
        return false;
    };

    Property.prototype._name_unused = function(name) {
        var valmap = this.parent.get_values();
        return (! _.include(_.keys(valmap), name) && (! _.include(this.parent.get_format_names(), name)));
    };

    Property.prototype._parse_value = function(value_string) {
        var ret = value_string;
        try {
            // We support JSON:
            // string, number, boolean, null
            //
            // BUT NOT objects or arrays (yet)
            var parsed = JSON.parse(value_string);
            if (_.isString(parsed) ||
                (_.isNumber(parsed) && parsed.toString() === value_string) || // Make sure value doesn't lose precision when converted to a number
                _.isBoolean(parsed) ||
                _.isNull(parsed)) {
                ret = parsed;
            }
        } catch(e) {
            ret = value_string;
        }

        return ret;
    };

    Property.prototype.save_if_valid = function() {
        return this._ok();
    };

    Property.prototype._ok = function() {
        if (!this._editing) {
            return false;
        }
        var new_name = this._$name.children('input').val();
        var new_value_string = this._$value.children('input').val();
        var new_value = this._parse_value(new_value_string);

        if (new_name && new_name !== this.name && !this._name_unused(new_name)) {
            var peer = this.parent.get_by_name(new_name);
            this.parent.remove_property(peer);
        }

        if (new_name) {
            this.fixname = true;
            this.parent.property_updated(new_name, new_value);
            this.name = new_name;
            this.value = new_value;
            this._clear_error_state();
            this._render_not_editing_state();
        } else if (!new_name && new_value) { // names cannot be blank, and since there is a value we
            // don't want to destory the edit.
            this.value = new_value; //values can be blank
            this._render_error_state_name(new_name);
        } else if (!new_name) {
            this.name = '';
            this.value = '';
            this.parent.property_unchanged(this, '', '');
        } else {
            //the user has not edited
            this.parent.property_unchanged(this, new_name, new_value);
            this._clear_error_state();
            this._render_not_editing_state();
        }
        return false;
    };

    Property.prototype._delete = function(event) {
        this.parent.property_deleted(this.name);
        this.parent.remove_property(this);
    };

    Property.prototype._keydown = function(event) {
        // tab
        if (event.which === 9) {

            // shift tab
            var td;
            if (event.shiftKey) {
                td = $(event.target).parents('td');
                if (td.hasClass('value') && this._is_name_editable()) {
                    this.focus_name_input();
                } else {
                    this._ok();
                    this.parent._tabbed_to_prev_property(this);
                }

            // normal tab
            } else {
                td = $(event.target).parents('td');
                if (td.hasClass('name')) {
                    this.focus_value_input();
                } else {
                    this._ok();
                    this.parent._tabbed_to_next_property(this);
                }
            }
            return false;

        // enter
        } else if (event.which === 13) {
            return this._ok();
        }
    };

    Property.prototype._is_name_editable = function() {
        // NOTICE SPECIAL CASE- we allow editing if name is unset, or if fixname is not set
        // Fixname is set when the first valid edit happens, or if we are created with a name
        // or value.
        return (this.editable_name || (!this.name) || ! this.fixname);
    };

    Property.prototype._render_not_editing_state = function() {
        var formatted_name = this.format_name(this.name);
        var formatted_value = this.format_value(this.name, this.value);

        this._$name.html(formatted_name);
        this._$value.html(formatted_value);

        if (this.editable) {
            var control_wrapper = $('<div class="space_wrapper"></div>');
            control_wrapper.append(this._control_button("Delete", "delete"));
            if (! _.isArray(this.value)) {
                control_wrapper.append(this._control_button("Edit", "edit"));
            }
            this._$controls.html(control_wrapper);
            this.container.removeClass('editing name_editable');
            this._editing = false;
        }
    };

    Property.prototype._render_error_state_name = function (new_name) {
        this._$name.addClass('error');
        this._$name.html(this.format_name(new_name));
        this._render_not_editing_state();
    };

    Property.prototype._render_error_state_value = function(new_name, new_value) {
        this._$value_cell.addClass('error');
        this._$controls.addClass('error');
        this._$value.html(this.format_value(new_name, new_value));
        this._render_not_editing_state();
    };

    Property.prototype._clear_error_state = function() {
        this._$name.removeClass('error');
        this._$value_cell.removeClass('error');
        this._$controls.removeClass('error');
    };

    Property.prototype._control_button = function(english_name, class_name) {
        var ret = $('<a href="javascript:void(0);">' +
                        '<div class="tooltip">' +
                            '<div class="pointer"></div>' +
                            '<div class="body"></div>' +
                        '</div>' +
                    '</a>');

        ret.addClass(class_name);
        ret.find(".body").text(english_name);
        return ret;
    };


    ns.PropertyList = PropertyList;
    ns.PropertyList.Property = Property;

});
