/*
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2016-2019 (original work) Open Assessment Technologies SA;
 *
 */

/**
 * Enables you register validators and provide most common validators.
 *
 * @author Sam <sam@taotesting.com>
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import urlUtil from 'util/url';
import UrlParser from 'util/urlParser';

/**
 * Defines the validation callback
 * @callback IsValidCallback
 * @param {Boolean} isValid - whether the value is valid or not
 */

/**
 * The function called by a validator to validate a value
 * @callback Validate
 * @param {String|Boolean|Number} value - the value to validate
 * @param {IsValidCallback} callback - called with the validation result
 * @param {Object} [options] - additional options
 */

/**
 * Validate with a regex pattern
 * @private
 * @param {String|Boolean|Number} value - the value to validate
 * @param {IsValidCallback} callback - called with the validation result
 * @param {Object} [options] - additional options
 * @param {String} [options.modifier] - pattern modifier
 * @param {String} [options.pattern] - the pattern itself
 */
var _validatePattern = function _validatePattern(value, callback, options) {
    var regex = new RegExp(options.pattern, options.modifier || ''),
        match = value.match(regex),
        r = match !== null;

    if (typeof callback === 'function') {
        callback.call(null, r);
    }
    return r;
};

/**
 * The current validators
 */
var validators = {
    numeric: {
        name: 'numeric',
        message: __('The value of this field must be numeric'),
        options: {},
        validate: function (value, callback) {
            var parsedValue = parseFloat(value),
                r = parsedValue.toString() === value.toString() && _.isNumber(parsedValue) && !_.isNaN(parsedValue);

            if (typeof callback === 'function') {
                callback.call(null, r);
            }
        }
    },
    notEmpty: {
        name: 'notEmpty',
        message: __('this is required'),
        options: {},
        validate: function (value, callback) {
            var r;
            if (_.isNumber(value)) {
                r = true;
            } else {
                r = !_.isEmpty(value); //works for array/object/string
            }
            if (typeof callback === 'function') {
                callback.call(null, r);
            }
        }
    },
    pattern: {
        name: 'pattern',
        message: __('does not match'),
        options: { pattern: '', modifier: 'igm' },
        validate: _validatePattern
    },
    length: {
        name: 'length',
        message: __('required length'),
        options: { min: 0, max: 0 },
        validate: function (value, callback, options) {
            var r = false;
            if (value.length >= options.min) {
                if (options.max) {
                    r = value.length <= options.max;
                } else {
                    r = true;
                }
            }
            if (typeof callback === 'function') {
                callback.call(null, r);
            }
        }
    },
    fileExists: {
        name: 'fileExists',
        message: __('no file not found in this location'),
        options: { baseUrl: '' },
        validate: (function () {
            return function (value, callback, options) {
                if (!value) {
                    callback(false);
                    return;
                }

                const parser = new UrlParser(value);
                const protocol = parser.get('protocol');
                const isHttp = protocol === 'http:' || protocol === 'https:';

                if (!(urlUtil.isAbsolute(value) && isHttp) && !urlUtil.isBase64(value)) {
                    //request HEAD only for bandwidth saving
                    $.ajax({
                        type: 'HEAD',
                        //FIXME change this to use an URL without transfomations. the validator should be called with the right URL,
                        //here it works only for the getFile service...
                        url: options.baseUrl + encodeURIComponent(value),
                        success: function () {
                            callback(true);
                        },
                        error: () => callback(false)
                    });
                } else {
                    callback(true);
                }
            };
        })()
    },
    validRegex: {
        name: 'validRegex',
        message: __('invalid regular expression'),
        options: {},
        validate: function (value, callback) {
            if (typeof callback === 'function') {
                let valid = false;
                if (value !== '') {
                    try {
                        new RegExp('^' + value + '$');
                        valid = true;
                    } catch (e) {
                        valid = false;
                    }
                } else {
                    valid = true;
                }
                callback(valid);
            }
        }
    }
};

/**
 * Register a new validator
 * @param {String} [name] - the validator name
 * @param {Object} validator - the validator
 * @param {String} [validator.name] - the name if not used in first parameter
 * @param {String} validator.message - the failure message
 * @param {Function} validator.validate - the validator
 * @param {Boolean} [force = false] - force to register the validator even if it is always registered
 */
var register = function registerValidator(name, validator, force) {
    if (_.isPlainObject(name) && name.name && !validator) {
        validator = name;
        name = validator.name;
    }

    if (!_.isString(name) || _.isEmpty(name)) {
        throw new Error('Please name your validator');
    }

    if (!_.isObject(validator) || !_.isString(validator.message) || !_.isFunction(validator.validate)) {
        throw new Error(
            `A validator must be an object with a message and a validate method, but given : ${JSON.stringify(validator)}`
        );
    }

    //do not override
    if (!validators[name] || !!force) {
        validators[name] = validator;
    }
};

/**
 * Gives access to the validator and enable to register new validators
 * @exports validator/validators
 */
export default {
    validators: validators,
    register: register
};
