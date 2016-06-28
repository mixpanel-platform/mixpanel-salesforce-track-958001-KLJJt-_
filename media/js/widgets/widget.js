var WidgetCSS = {
    // insert key when we insert that widget's style
    already_inserted: {},
    gradient:  function(css, from_color, to_color, image) {
        /*  Generate CSS rules that work for most browsers for vertical gradient.
         *  Also add background image if necessary.
         */
        css.background = [];
        if (image !== undefined) {
            css.background.push(image);
        }
        css.background = css.background.concat([
                (image ? image + ',' : '') + '-webkit-gradient(linear, left top, left bottom, from(' + from_color + '), to(' + to_color + '))',
                (image ? image + ',' : '') + '-moz-linear-gradient(top, ' + from_color + ', ' + to_color + ')'
            ]);
        css.filter = 'progid:DXImageTransform.Microsoft.gradient(startColorstr="' + from_color + '", endColorstr="' + to_color + '")';
        return css;
    },
    gradient_horizontal:  function(css, from_color, to_color, image) {
        // Slight tweaks to make this work for horizontal gradients.
        css.background = [];
        if (image !== undefined) {
            css.background.push(image);
        }
        css.background = css.background.concat([
                (image ? image + ',' : '') + '-webkit-gradient(linear, left top, right top, from(' + from_color + '), to(' + to_color + '))',
                (image ? image + ',' : '') + '-moz-linear-gradient(left, ' + from_color + ', ' + to_color + ')'
            ]);
        css.filter = 'progid:DXImageTransform.Microsoft.gradient(startColorstr="' + from_color + '", endColorstr="' + to_color + '", GradientType=1)';
        return css;
    },
    xbrowser: function(css, rulename, rule) {
        /*  take a basic CSS3 rule and add the individual browser equivalents.
         *  Useful for things like border-radius and box-shadow that have
         *  the same interface, just require prefixes.
         */
        _.each(['', '-moz-', '-webkit-', '-khtml-', '-o-'], function(x) {
            css[x + rulename] = rule;
        });
    },
    custom_button: function(css) {
        _.each({
            'cursor': 'pointer',
            'line-height': 'normal !important',
            'border': '0',
            'outline': '0',
            'background-color': 'transparent'
        }, function(v, k) {
            if (!(k in css)) {
                css[k] = v;
            }
        });
    },
    rounded: function(css, corner_values) {
        var names = ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
            values = corner_values.split(' ');

        while (values.length < 4) {
            values.push('0px');
        }

        _.each(_.zip(names, values), function(z) {
            WidgetCSS.xbrowser(css, z[0], z[1]);
        });
    },
    generate: function(rules, context, style_id) {
        /*  Insert widget styles into the global widget
         *  styelsheet, only if it has not yet been inserted.
         */
        var s_list = [], GLOBAL_STYLE_ID='widget_css';

        if (!$('#' + GLOBAL_STYLE_ID).length) {
            $('head').append('<style type="text/css" id="' + GLOBAL_STYLE_ID + '"></style>');
        }

        if (!(style_id in WidgetCSS.already_inserted)) {
            _.each(rules, function(css, selector) {
                var s;
                if (selector === '_container') {
                    selector = '';
                }
                if (selector == context.class_name) {
                    s = '.' + selector;
                } else if (selector.length && selector[0] == '^') {
                    // '^.additionalclass' will become .myclass.additionalclass
                    s = '.' + context.class_name + selector.slice(1);
                } else {
                    s = '.' + context.class_name + ' ' + selector;
                }
                s += ' {';
                _.each(css, function(val, op) {
                    if (_.isArray(val)) {
                        _.each(val, function(v) {
                            s += op + ': ' + v + ';\n';
                        });
                    } else {
                        s += op + ': ' + val + ';\n';
                    }
                });
                s += '}';

                s_list.push(s);
            });
            $("#" + GLOBAL_STYLE_ID).append(s_list.join('\n'));
            WidgetCSS.already_inserted[style_id] = true;
        }//if style_id
    }
};

function JSWidget(div) {
    this.class_name = 'js_widget';
    this.defer_style = false;
}

JSWidget.prototype.create = function(div) {
    if (div) {
        this.container = $(div);
    } else {
        this.container = $('<div>');
    }
    if (this.container.attr('id')) {
        this.id = this.container.attr('id');
    } else {
        this.id = 'jswidget_' + Math.floor(Math.random() * 1000000000);
        this.container.attr('id', this.id);
    }
    this.container.addClass(this.class_name);
    if (!this.defer_style) {
        this.style();
    }
    return this;
};

JSWidget.prototype.remove = function() {
    this.container.trigger('remove_item', [this]);
    this.container.remove();
};

JSWidget.prototype.val = function() {
    // want to provide a slightly similar interface
    // to jquery objects, particularly for form elements.
    if (this.value !== undefined) {
        return this.value;
    } else if (this.container.attr('val') !== undefined) {
        return this.container.attr('val');
    } else {
        return null;
    }
};

JSWidget.prototype.styles = function() {
    /* Fill out if your widget needs styling.
     * For inherited widgets, should be able to just
     * call the superclass and extend your style object.
     *
     * If this doesn't return an object, the style() function
     * won't do anything.
     *
     * spec:
     *  selectors:
     *      '_container': apply styles to the container
     *      '^.classname': apply styles to container.classname
     *      '^:verb': apply styles to container:verb
     *
     *  css:
     *      { 'background': '#fff', ... } - very simple
     *      [ 'background': ['#fff', '#yyy'], ...} - apply both;
     *          primarily used when different browsers use the same css operator
     *          for different things (e.g. background gradients)
     *
     *  example:
     *      return {
     *          '_container': {
     *              'background-color': '#fff'
     *          },
     *          '^:hover': {
     *              'font-weight': 'bold',
     *              'color': 'blue'
     *          },
     *          '.inner': {
     *              'margin': '10px'
     *          }
     *      }
     *
     */
};

JSWidget.prototype.style = function() {
    if (window.DISABLE_JSWIDGET_STYLES) { return; }

    // apply styles from prototype.styles
    var style_id = this.class_name + '_style';
    var rules = this.styles();
    if (rules) {
        WidgetCSS.generate(rules, this, style_id);
    }
};

JSWidget.prototype.init = function() {};

/* A container for a list of JSWidget objects.
 * This will automatically handle dom manipulation
 * for adding/removing objects from the list.
 */
var JSWidgetList = function(div) {
    this.class_name = 'js_widget_list';
};
_.inherit(JSWidgetList, JSWidget);

JSWidgetList.prototype.create = function(div) {
    JSWidgetList.superclass.create.call(this, div);
    this.widgets = [];
    return this;
};

JSWidgetList.prototype.append = function(widget, append_to, container) {
    this.widgets.push(widget);
    if (container !== undefined) {
        container.html(widget.container);
    } else {
        container = widget.container;
    }
    (append_to || this.appendTo || this.container).append(container);
};

JSWidgetList.prototype.replace = function(w1, w2) {
    var i = _.indexOf(this.widgets, w1);
    if (i > -1) {
        w2.container.insertBefore(w1.container);
        w1.container.remove();
        this.widgets[i] = w2;
    }
    return i > -1;
};

JSWidgetList.prototype.clear = function() {
    (this.appendTo || this.container).html('');
    this.widgets = [];
}

JSWidgetList.prototype.remove_item = function(widget) {
    var idx = _.indexOf(this.widgets, widget);
    if (idx > -1) {
        this.widgets.splice(idx, 1)[0].container.remove();
    }
    return idx > -1;
};

JSWidgetList.prototype.sort = function(key_fn, reversed) {
    this.widgets = this.widgets.sort(function(a, b) {
        a = key_fn(a);
        b = key_fn(b);

        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            return 0;
        }
    });

    if (reversed) {
        this.widgets = this.widgets.reverse();
    }
    _.each(this.widgets, function(w) {
        this.appendTo.append(w.container);
    }, this);
};

JSWidgetList.prototype.at = function(index) {
    return this.widgets[index];
}

JSWidgetList.prototype.each = function(f, context) {
    _.each(this.widgets, f, context);
}

JSWidgetList.prototype.map = function(f, context) {
    return _.map(this.widgets, f, context);
}

JSWidgetList.prototype.find = function(f, context) {
    return _.find(this.widgets, f, context);
}

JSWidgetList.prototype.filter = function(f, context) {
    return _.filter(this.widgets, f, context);
}

JSWidgetList.prototype.count = function() {
    return this.widgets.length;
}

JSWidgetList.prototype.insert = function(widget, position) {
    /*  Insert a widget at the specified position in the list.
     *
     *  Example usage:
     *
     *  var Query = new FunnelQuery().create();
     *  Query.insert(new Row().create(), 2);
     */
    if (_.isUndefined(position)) {
        throw "position is a required argument";
    }
    if (position > this.widgets.length || position < 0) {
        throw "invalid position: " + position;
    }

    if (position === 0) {
        if (this.widgets.length === 0) {
            this.append(widget);
        } else {
            widget.container.insertBefore(this.widgets[0].container);
            this.widgets = [widget].concat(this.widgets);
        }
    } else {
        var prev = this.widgets[position - 1];
        widget.container.insertAfter(prev.container);
        this.widgets.splice(position, 0, widget);
    }
};

JSWidgetList.prototype.indexOf = function(widget) {
    return _.indexOf(this.widgets, widget);
};

JSWidgetList.prototype.bindings = function() {
    var _this = this;
    this.container.bind('remove_item', function(e, item) {
        e.stopPropagation();
        _this.remove_item(item);
    });
};
