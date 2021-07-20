/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 * @requires jquery
 * @requires core/pluginifier
 */
import $ from 'jquery';
import _ from 'lodash';
import Pluginifier from 'core/pluginifier';
import gamp from 'lib/gamp/gamp';

var ns = 'incrementer';
var dataNs = 'ui.' + ns;

var defaults = {
    disableClass: 'disabled',
    step: 1,
    min: null,
    max: null,
    zero: false,
    incrementerClass: 'incrementer',
    incrementerCtrlClass: 'incrementer-ctrl',
    incrementerWrapperClass: 'incrementer-ctrl-wrapper',
    decimal: 0
};

const getNormalValues = function (element, selector) {
    return element.parent().parent().find(`[name='${ selector }']`).attr('value');
}

const setNormalValues = function (options, elt, setup, positive = true) {
    if (setup) {
        options.min = parseFloat(elt.parent().parent().find("[name='normalMinimum']").attr('value'));
        options.max = parseFloat(elt.parent().parent().find("[name='normalMaximum']").attr('value'));
    } else {
        const name = elt[0].getAttribute('name');
        const sign = positive ? '+' : '-';
        if (name === 'normalMaximum') {
            options.max = +`${ parseFloat(elt.parent().parent().find("[name='normalMaximum']").attr('value')) } ${ sign } 1`;
            options.min = parseFloat(elt.parent().parent().find("[name='normalMinimum']").attr('value'));
        } else {
            options.max = parseFloat(elt.parent().parent().find("[name='normalMaximum']").attr('value'));
            options.min = +`${ parseFloat(elt.parent().parent().find("[name='normalMinimum']").attr('value')) } ${ sign } 1`;
        }
    }
    return options;
}

const setBothValues = function (elt, value) {
    elt.val(value);
    elt[0].setAttribute('value', value);
}

/**
 * The Incrementer component, it transforms a text input in an number input, the data-attr way
 * (has the HTML5 number input type is not yet very well supported, we don't use polyfill to have a consistent UI)
 * @exports ui/incrementer
 */
var Incrementer = {
    /**
     * Initialize the plugin.
     *
     * Called the jQuery way once registered by the Pluginifier.
     * @example $('selector').incrementer({step : 1, min : 0, max : 12 });
     * @public
     *
     * @constructor
     * @param {Object} [options] - the plugin options
     * @param {Number} [options.step = 1] - the increment step
     * @param {Number} [options.min] - the minimum value
     * @param {Number} [options.max] - the maximum value
     * @param {Number} [options.zero] - whether input can take zero value even in min value more than zero
     * @returns {jQueryElement} for chaining
     */
    init: function(options) {
        var self = Incrementer;

        //get options using default
        options = _.defaults(options || {}, defaults);

        return this.each(function() {
            var $elt = $(this);
            var wrapper = $('<span>', { class: options.incrementerWrapperClass });
            var $ctrl, currentValue;

            if (!$elt.data(dataNs)) {
                //basic type checking
                if (!$elt.is('input[type="text"]')) {
                    $.error('The incrementer plugin applies only on input element of the type text');
                } else {
                    currentValue = parseFloat($elt.val()).toFixed(options.decimal);
                    $elt.wrap(wrapper);
                    $elt.data(dataNs, options) //add data to the element
                        .addClass(options.incrementerClass) //add the css class
                        .after(
                            //set up controls
                            '<span class="ctrl ' +
                                options.incrementerCtrlClass +
                                '">' +
                                '<a href="#" class="inc" title="+' +
                                options.step +
                                '" tabindex="-1"></a>' +
                                '<a href="#" class="dec" title="-' +
                                options.step +
                                '" tabindex="-1"></a>' +
                                '</span>'
                        )
                        .on('keydown', function(e) {
                            if (e.which === 38) {
                                //up
                                self._inc($elt);
                                this.select();
                            } else if (e.which === 40) {
                                //down
                                self._dec($elt);
                                this.select();
                            }
                        })
                        //debounce the keyup callback to give the user a chance to complete an invalid state
                        //(for instance, while taping an negative value)
                        .on(
                            'keyup',
                            _.debounce(function() {
                                var value = $elt.val(),
                                    negative = value.charAt(0) === '-',
                                    options = $elt.data(dataNs);

                                //sanitize the string by removing all invalid characters (only allow digit and dot)
                                value = parseFloat(value.replace(/[^\d\.]/g, '')).toFixed(0);

                                if (isNaN(value)) {
                                    //allow empty input
                                    $elt.val('');
                                } else {
                                    //allow negative values
                                    value = negative ? -value : value; //check if the min and max are respected:

                                    options = setNormalValues(options, $elt, true);

                                    if ($elt[0].getAttribute('name') === 'normalMaximum' && value < options.min) {
                                        setBothValues($elt, options.min);
                                    } else if ($elt[0].getAttribute('name') === 'normalMinimum' && options.max < value) {
                                        setBothValues($elt, options.max);
                                    } else {
                                        setBothValues($elt, value);
                                    }
                                }

                                //trigger change again after the input has been corrected
                                $elt.trigger('change');
                            }, 600)
                        )
                        .on('focus', function() {
                            this.select();
                        })
                        .on('disable.incrementer', function() {
                            $elt.prop('disabled', true).addClass('disabled');
                            $ctrl
                                .find('.inc,.dec')
                                .prop('disabled', true)
                                .addClass('disabled');
                        })
                        .on('enable.incrementer', function() {
                            $elt.prop('disabled', false).removeClass('disabled');
                            $ctrl
                                .find('.inc,.dec')
                                .removeProp('disabled')
                                .removeClass('disabled');
                        });

                    //set up the default value if needed
                    if (
                        _.isNaN(currentValue) ||
                        (options.min !== null && currentValue < options.min) ||
                        (options.max !== null && currentValue > options.max)
                    ) {
                        $elt.val(options.min || 0);
                    }

                    $ctrl = $elt.next('.' + options.incrementerCtrlClass);

                    $ctrl.find('.inc').click(function(e) {
                        e.preventDefault();
                        if (!$(this).prop('disabled')) {
                            self._inc($elt);
                        }
                    });
                    $ctrl.find('.dec').click(function(e) {
                        e.preventDefault();
                        if (!$(this).prop('disabled')) {
                            self._dec($elt);
                        }
                    });

                    /**
                     * The plugin have been created.
                     * @event Incrementer#create.incrementer
                     */
                    $elt.trigger('create.' + ns);
                }
            }
        });
    },

    _toFixedDown: function(number, precision) {
        var m = Math.pow(10, precision || 0);
        return Math.floor(number * m) / m;
    },

    _decimalPlaces: function(number) {
        var match = ('' + number).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
        if (!match) {
            return 0;
        }
        return Math.max(0, (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0));
    },

    /**
     * Increment value
     *
     * @private
     * @param {jQueryElement} $elt - plugin's element
     * @fires Incrementer#plus.incrementer
     */
    _inc: function _inc($elt) {
        let options = $elt.data(dataNs);
        const current = parseFloat($elt.val() || 0);
        let value = gamp.add(current, options.step);

        options = setNormalValues(options, $elt, false, true);

        if (options.max < options.min) {
            return;
        }

        if (_.isNumber(options.min) && value < options.min) {
            value = options.min;
        }

        if (options.max === null || _.isNumber(options.max) && value <= options.max) {
            $elt.val(value);
            $elt[0].setAttribute('value', value);

            /**
             * The target has been toggled.
             * @event Incrementer#increment.incrementer
             */

            $elt.trigger('increment.' + ns, [value]).trigger('change');
        }
    },
    /**
     * Decrement value
     *
     * @private
     * @param {jQueryElement} $elt - plugin's element
     * @fires Incrementer#minus.incrementer
     */
    _dec: function _dec($elt) {
        let options = $elt.data(dataNs);
        const current = parseFloat($elt.val() || 0);
        let value = gamp.sub(current, options.step);

        options = setNormalValues(options, $elt, false, false);

        if (options.max < options.min) {
            return;
        }

        if (options.zero === true && _.isNumber(options.min) && value < options.min) {
            value = 0;
        }

        if (options.min === null || _.isNumber(options.min) && value >= options.min || options.zero === true && value === 0) {
            $elt.val(value);
            $elt[0].setAttribute('value', value);
            /**
             * The target has been toggled.
             * @event Incrementer#decrement.incrementer
             */

            $elt.trigger('decrement.' + ns, [value]).trigger('change');
        }
    },
    /**
     * Destroy completely the plugin.
     *
     * Called the jQuery way once registered by the Pluginifier.
     * @example $('selector').incrementer('destroy');
     * @public
     */
    destroy: function() {
        this.each(function() {
            var $elt = $(this);
            var options = $elt.data(dataNs);
            $elt.off('keyup keydown')
                .siblings('.' + options.incrementerCtrlClass)
                .remove();

            /**
             * The plugin have been destroyed.
             * @event Incrementer#destroy.incrementer
             */
            $elt.trigger('destroy.' + ns);
        });
    }
};

//Register the incrementer to behave as a jQuery plugin.
Pluginifier.register(ns, Incrementer);

/**
 * The only exposed function is used to start listening on data-attr
 *
 * @public
 * @example define(['ui/incrementer'], function(incrementer){ incrementer($('rootContainer')); });
 * @param {jQueryElement} $container - the root context to listen in
 */
export default function listenDataAttr($container) {
    $container.find('[data-increment]').each(function() {
        var $elt = $(this);
        var decimal = Incrementer._decimalPlaces($elt.attr('data-increment'));
        var step = parseFloat($elt.attr('data-increment'));
        var zero = !!$elt.data('zero');
        var min, max;

        var options = {};
        options.zero = zero;
        if (!_.isNaN(step)) {
            options.step = step;
        }
        if (!_.isNaN(decimal)) {
            options.decimal = decimal;
        }
        if ($elt.attr('data-min')) {
            min = parseFloat($elt.attr('data-min'));
            if (!_.isNaN(min)) {
                options.min = min;
            }
        }
        if ($elt.attr('data-max')) {
            max = parseFloat($elt.attr('data-max'));
            if (!_.isNaN(max)) {
                options.max = max;
            }
        }
        $elt.incrementer(options);
    });
}
