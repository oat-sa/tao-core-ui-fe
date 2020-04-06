/**
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
 * Copyright (c) 2015-2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * Create a modal dialog component
 *
 *
 * TODO move to ui/component
 * TODO use core/eventifier
 *
 *
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import bodyTpl from 'ui/dialog/tpl/body';
import buttonsTpl from 'ui/dialog/tpl/buttons';
import keyNavigator from 'ui/keyNavigation/navigator';
import navigableDomElement from 'ui/keyNavigation/navigableDomElement';
import shortcutRegistry from 'util/shortcut/registry';
import 'ui/modal';

/**
 * The scope of events names
 * @type {string}
 */
var _scope = '.modal';

/**
 * A list of predefined buttons
 * @type {Object}
 */
var _definedButtons = {
    ok: {
        id: 'ok',
        type: 'info',
        label: __('Ok'),
        close: true
    },

    cancel: {
        id: 'cancel',
        type: 'regular',
        label: __('Cancel'),
        close: true
    },

    yes: {
        id: 'yes',
        type: 'info',
        label: __('Yes'),
        close: true
    },

    no: {
        id: 'no',
        type: 'regular',
        label: __('No'),
        close: true
    }
};

/**
 * The defaults fields values
 * @type {Object}
 */
var _defaults = {
    message: '',
    content: '',
    width: 500,
    animate: false,
    autoRender: false,
    autoDestroy: false,
    renderTo: 'body',
    buttons: 'cancel,ok'
};

/**
 * Define a dialog box
 * @type {Object}
 */
var dialog = {
    /**
     * Initialise the dialog box.
     * @param {Object} options - A list of options.
     * @param {String} options.heading - An optional heading to display.
     * @param {String} options.message - The message to display.
     * @param {String} options.content - An optional content to display under the displayed message.
     * @param {String} options.class - Space-separated string of classes to add to the root HTML element
     * @param {Array|Object|String} options.buttons - A list of buttons to display (default: 'cancel,ok'). Can be:
     * - a string: the button names separated by commas
     * - an array: an array of button names or an array of button definitions
     * - an object: a unique button definition, containing:
     *     - id: The button's id
     *     - type: A display type (regular, info, warning, error)
     *     - label: The button's caption
     *     - icon: An optional icon
     *     - close: A boolean value telling if the dialog must be closed after the button has been activated
     * @param {String|jQuery|HTMLElement} options.renderTo - A container in which renders the dialog (default: 'body').
     * @param {Boolean} options.autoRender - Allow the dialog to be immediately rendered after initialise.
     * @param {Boolean} options.autoDestroy - Allow the dialog to be immediately destroyed when closing.
     * @param {Boolean} [options.disableClosing = false] - to disable the default closers
     * @param {Boolean} [options.disableEscape = false] - to disable the ability to escape close the dialog
     * @param {Number} options.width - The dialog box width in pixels (default: 500).
     * @param {Number|Boolean} options.animate - The dialog box animate duration (default: false).
     * @param {Function} options.onXYZbtn - An event handler assigned to a particular button (XYZ).
     * @returns {dialog}
     */
    init: function init(options) {
        // split options to events
        var self = this;
        var events = {};
        var initOptions = _.omit(options || {}, function(value, key) {
            var omit = false;
            if (key.length > 2 && 'on' === key.substr(0, 2)) {
                events[key.substr(2)] = value;
                omit = true;
            }
            return omit;
        });

        // assign default values and options
        _.defaults(this, initOptions, _defaults);

        // pre-render the dialog box
        this.$html = $(bodyTpl(this));
        this.$buttons = this.$html.find('.buttons');
        this.rendered = false;
        this.destroyed = false;

        // install the buttons and bind the actions
        this.$buttons.on('click' + _scope, 'button', this._onButtonClick.bind(this));
        this.setButtons(this.buttons);

        // install the events extracted from the options
        _.forEach(events, function(callback, eventName) {
            if (eventName.indexOf('.') < 0) {
                eventName += _scope;
            }
            self.on(eventName.toLowerCase(), callback);
        });

        if (this.autoRender) {
            this.render();
        }

        return this;
    },

    /**
     * Destroys the dialog box
     * @returns {dialog}
     * @fires dialog#destroy.modal
     */
    destroy: function destroy() {
        if (!this.destroyed) {
            this._destroy();

            // reset the context
            this.rendered = false;
            this.destroyed = true;

            this.trigger('destroy' + _scope);

            // disable events and remove DOM
            this.$buttons.off(_scope);
            this.$html.off(_scope).remove();
            this.$html = null;
            this.$buttons = null;
        }

        return this;
    },

    /**
     * Set the action buttons
     * @param {Object|Array|String} buttons
     * @returns {dialog}
     */
    setButtons: function setButtons(buttons) {
        var self = this;

        if (!this.destroyed) {
            if (!buttons) {
                buttons = _defaults.buttons;
            }

            if (!_.isArray(buttons)) {
                // buttons can be set as a list of names
                if (_.isString(buttons)) {
                    buttons = buttons.split(',');
                }
            }

            // bind the buttons with
            this.buttons = {};
            _.forEach(buttons, function(btn) {
                if (_.isString(btn)) {
                    btn = btn.trim();
                    btn = _definedButtons[btn] || {
                        id: btn,
                        type: 'info',
                        label: btn
                    };
                }
                if (!btn.type) {
                    btn.type = 'regular';
                }
                self.buttons[btn.id] = btn;
            });

            this.$buttons.html(buttonsTpl(this));
        }

        return this;
    },

    /**
     * Renders and shows the dialog box
     * @param {String|HTMLElement|jQuery} [to]
     * @returns {dialog}
     * @fires modal#create.modal
     */
    render: function render(to) {
        if (!this.destroyed) {
            $(to || this.renderTo).append(this.$html);
            this._install();
            this.rendered = true;
        }
        return this;
    },

    /**
     * Shows the dialog box. Also renders if needed.
     * @returns {dialog}
     * @fires modal#opened.modal
     */
    show: function show() {
        if (!this.destroyed) {
            if (!this.rendered) {
                this.render();
            } else {
                this._open();
            }
        }
        return this;
    },

    /**
     * Hides the dialog box. Does nothing if the dialog box has not been rendered.
     * @returns {dialog}
     * @fires modal#closed.modal
     */
    hide: function hide() {
        if (!this.destroyed && this.rendered) {
            this._close();

            if (this.autoDestroy) {
                this.destroy();
            }
        }
        return this;
    },

    /**
     * Install an event handler on the underlying DOM element
     * @param {String} eventName
     * @returns {dialog}
     */
    on: function on(eventName) {
        var dom = this.$html;
        if (dom) {
            dom.on.apply(dom, arguments);
        }

        return this;
    },

    /**
     * Uninstall an event handler from the underlying DOM element
     * @param {String} eventName
     * @returns {dialog}
     */
    off: function off(eventName) {
        var dom = this.$html;
        if (dom) {
            dom.off.apply(dom, arguments);
        }

        return this;
    },

    /**
     * Triggers an event on the underlying DOM element
     * @param {String} eventName
     * @param {Array|Object} extraParameters
     * @returns {dialog}
     */
    trigger: function trigger(eventName, extraParameters) {
        var dom = this.$html;

        if (dom) {
            if (undefined === extraParameters) {
                extraParameters = [];
            }
            if (!_.isArray(extraParameters)) {
                extraParameters = [extraParameters];
            }

            extraParameters = Array.prototype.slice.call(extraParameters);
            extraParameters.push(this);

            dom.trigger(eventName, extraParameters);
        }

        return this;
    },

    /**
     * Gets the underlying DOM element
     * @returns {jQuery}
     */
    getDom: function getDom() {
        return this.$html;
    },

    /**
     * Called when button is clicked.
     * Executes a button related action
     * @param {Event} event
     * @private
     */
    _onButtonClick: function _onButtonClick(event) {
        var $btn = $(event.target).closest('button');
        var id = $btn.data('control');
        var btn = this.buttons[id];

        if (btn) {
            this._execute(btn);
        }
    },

    /**
     * Execute a button related action
     * @param {Object} btn
     * @private
     * @fires dialog#[button.id]btn.modal
     */
    _execute: function _execute(btn) {
        // call the optional callback
        if (btn.action) {
            btn.action.apply(this, [btn, this]);
        }

        /**
         * Fires the event based on the button name
         * @event dialog#[button.id]btn.modal
         * @param {Object} btn - The related button
         */
        this.trigger(btn.id + 'btn' + _scope, [btn]);

        // auto close the dialog box if the button allows it
        if (btn.close) {
            this.hide();
        }
    },

    /**
     * Set focus on the dialog
     * @param {String} [button] - The identifier of the button to focus. If none is provided, the focus will be put
     *                            on the first navigable element.
     */
    focus: function focus(button) {
        var focusPosition = -1;
        if (button) {
            focusPosition = _.findIndex(this.navigator.getNavigableElements(), function(navigable) {
                return navigable.getElement().is('[data-control="' + button + '"]');
            });
        }
        if (focusPosition >= 0) {
            this.navigator.focusPosition(focusPosition);
        } else {
            this.navigator.focus();
        }
    },

    /**
     * Installs the dialog box
     * @private
     * #fires dialog#create.dialog
     */
    _install: function _install() {
        var self = this,
            $buttons,
            closeButton;

        if (!this.destroyed) {
            this.$html
                .modal({
                    width: this.width,
                    animate: this.animate,
                    disableClosing: this.disableClosing,
                    disableEscape: this.disableEscape
                })
                .on('closed' + _scope, function() {
                    if (self.autoDestroy) {
                        self.destroy();
                    }
                });
            $buttons = this.$buttons.find('button');
            closeButton = $(_scope).find('#modal-close-btn')[0];

            if (closeButton) {
                $buttons.push(closeButton);
            }

            //creates the navigator to manage the key navigation
            this.navigator = keyNavigator({
                elements: navigableDomElement.createFromDoms($buttons)
            })
                .on('right down', function() {
                    this.next();
                })
                .on('left up', function() {
                    this.previous();
                })
                .on('tab', function() {
                    if (this.getCursor().position === $buttons.length - 1) {
                        this.first();
                    } else {
                        this.next();
                    }
                })
                .on('shift+tab', function() {
                    if (this.getCursor().position === 0) {
                        this.last();
                    } else {
                        this.previous();
                    }
                })
                .on('activate', function(cursor) {
                    cursor.navigable.getElement().click();
                });
            self.navigator.last();
            //added a global shortcut to enable setting focus on tab
            this.globalShortcut = shortcutRegistry($('body')).add('tab shift+tab', function() {
                if (!self.navigator.isFocused()) {
                    self.navigator.focus();
                }
            });

            self.trigger('create.dialog');
        }
    },

    /**
     * Opens the dialog box
     * @private
     */
    _open: function _open() {
        this.$html.modal('open');
    },

    /**
     * Closes the dialog box
     * @private
     */
    _close: function _close() {
        this.$html.modal('close');
    },

    /**
     * Destroys the dialog box
     * @private
     */
    _destroy: function _destroy() {
        this.$html.modal('destroy');
        if (this.navigator) {
            this.navigator.destroy();
        }
        if (this.globalShortcut) {
            this.globalShortcut.clear();
        }
    }
};

/**
 * Builds a dialog box instance
 * @param {Object} options
 * @returns {dialog}
 */
var dialogFactory = function dialogFactory(options) {
    var instance = _.clone(dialog, true);
    instance.init(options);
    return instance;
};

export default dialogFactory;
