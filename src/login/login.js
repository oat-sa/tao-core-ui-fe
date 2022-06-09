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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 */

/**
 * @author Ilya Yarkavets <ilya.yarkavets@1pt.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import component from 'ui/component';
import feedback from 'ui/feedback';
import urlUtil from 'util/url';
import loginTpl from 'ui/login/tpl/login';
import fakeFormTpl from 'ui/login/tpl/fakeForm';
import pwdRevealTpl from 'ui/login/tpl/passwordReveal';

var _defaultConfig = {
    disableAutocomplete: false,
    enablePasswordReveal: false,
    disableAutofocus: false,
    message: {
        error: '',
        info: null
    },
    fieldMessages: {},
    name: 'loginForm',
    url: urlUtil.route('login', 'Main', 'tao')
};

/**
 * The factory that creates a login component
 *
 * @param {jQueryElement} $container - where to append the component
 * @param {Object} config - the component config
 * @param {Object} [config.disableAutocomplete] - depending on this setting autocomplete would be disabled or enabled (and fakeForm rendered)
 * @param {Object} [config.enablePasswordReveal] - depending on this setting password reveal would be disabled or enabled for the password field
 * @param {Object} [config.disableAutofocus] - depending on this setting autofocus attribute will be added to login filed
 * @param {Object} [config.fieldMessages] - field validation messages
 * @param {String} [config.name] - the component name (used by the element)
 * @param {String} [config.url] - the url to send login form to.
 * @param {String} [config.message] - the form wide error|info messages
 * @returns {loginComponent} the component
 */
export default function loginFactory($container, config) {
    /**
     * The component API
     */
    var api = {
        /**
         * Returns whether autocomplete is disabled or not
         * @returns {boolean}
         */
        isAutocompleteDisabled: function isAutocompleteDisabled() {
            return this.config.disableAutocomplete;
        },

        /**
         * Returns whether password reveal is enabled or not
         * @returns {boolean}
         */
        isPasswordRevealEnabled: function isPasswordRevealEnabled() {
            return this.config.enablePasswordReveal;
        },

        /**
         * Get messages from config
         * @returns {Object} Object containing passed messages
         */
        getMessages: function getMessages() {
            return this.config.message;
        },

        /**
         * Returns form fields validation messages, if any
         * @returns {Object} fieldMessages
         */
        getFieldMessages: function getFieldMessages() {
            return this.config.fieldMessages;
        },

        /**
         * Creates fakeForm from the real form
         * @returns {jQuery} jQuery element
         */
        createFakeForm: function createFakeForm() {
            const $element = this.getElement()
            const $fakeFormDom = $element.clone();

            $element.find('label').remove();

            return $fakeFormDom.html(fakeFormTpl({ form: $fakeFormDom.find('form').html() }));
        },

        /**
         * Gets real form jQuery element
         * @returns {jQuery} jQuery element
         */
        getRealForm: function getRealForm() {
            return this.getElement().find('form');
        },

        /**
         * Gets fake form jQuery element
         * @returns {jQuery} jQuery element
         */
        getFakeForm: function getFakeForm() {
            return this.getContainer().find('div.fakeForm');
        },

        /**
         * Gets real or fake form jQuery element, depending on the disableAutocomplete setting
         * @returns {jQuery} jQuery element
         */
        getForm: function getForm() {
            return this.isAutocompleteDisabled() ? this.getFakeForm() : this.getRealForm();
        },

        /**
         * Manipulates form dom (adds password reveal elements)
         */
        manipulateFormDom: function manipulateFormDom() {
            var $form, $pwdInput, $pwdLabel;

            $form = this.getForm();

            $pwdInput = $form.find('input[type=password]');
            $pwdLabel = $form.find('label[for=' + $pwdInput.attr('name') + ']');

            $pwdInput.replaceWith(pwdRevealTpl({ elements: $pwdLabel[0].outerHTML + $pwdInput[0].outerHTML }));

            $pwdLabel.remove();
        },

        /**
         * Attaches events to password reveal options
         */
        attachPasswordRevealEvents: function attachPasswordRevealEvents() {
            var $form, $pwdInput, $inputToggle, $viewIcon, $hideIcon;

            const self = this;

            const autoHide = function autoHide(event) {
                if (
                    !event.target.isSameNode($pwdInput) &&
                    !event.target.isSameNode($hideIcon[0]) &&
                    !event.target.isSameNode($inputToggle[0])
                ) {
                    hide();
                }
            };

            const show = function show() {
                $viewIcon.hide();
                $hideIcon.show();

                $pwdInput.type = 'text';
                $pwdInput.autocomplete = 'off';

                window.addEventListener('mousedown', autoHide);

                $pwdInput.focus();
            };

            const hide = function hide(moveFocus) {
                $hideIcon.hide();
                $viewIcon.show();

                $pwdInput.type = 'password';
                $pwdInput.autocomplete = self.isAutocompleteDisabled() ? 'off' : 'on';

                window.removeEventListener('mousedown', autoHide);

                if (moveFocus) {
                    $pwdInput.focus();
                }
            };

            const togglePassword = function togglePassword() {
                if ($pwdInput.type === 'password') {
                    show();
                } else {
                    hide(true);
                }
            };

            $form = this.getForm();

            $pwdInput = $form.find('input[type=password]')[0];
            $inputToggle = $form.find('.viewable-hiddenbox-toggle');
            $viewIcon = $form.find('span.icon-preview');
            $hideIcon = $form.find('span.icon-eye-slash');

            hide();

            $inputToggle.on('keyup', function (e) {
                if (e.key === ' ') {
                    togglePassword();
                }
            });

            $inputToggle.on('keypress', function (e) {
                if (e.key === 'Enter') {
                    togglePassword();
                    e.stopPropagation();
                }
            });

            $inputToggle.on('click', togglePassword);
        },

        /**
         * Displays the error/info messages
         */
        displayMessages: function displayMessages(messages) {
            var $fields = this.getForm().find(':input');

            if (!messages.error && this.getForm().find('.form-error').length) {
                messages.error = __('All fields are required');
            }

            _.forEach(messages, function(message, level) {
                if (message) {
                    feedback()
                        .message(level, message)
                        .open();
                    $fields.addClass(level);
                }
            });
        }
    };

    var loginComponent = component(api, _defaultConfig)
        .setTemplate(loginTpl)
        .on('init', function() {
            this.render($container);
        })
        .on('render', function() {
            var $fakeForm, $loginBtn;
            var $loginForm = this.getRealForm();
            var self = this;

            /**
             * Submits the form after a copy of all the inputs the user has made in the fake form
             * @fires submit event when real form gots submitted
             */
            var submitForm = function submitForm() {
                // if the fake form exists, copy all fields values into the real form
                $fakeForm.find(':input').each(function() {
                    var $field = $(this);
                    $loginForm.find('input[name="' + $field.attr('name') + '"]').val($field.val());
                });

                // just submit the real form as if the user did it
                self.trigger('submit');
                $loginForm.submit();
            };

            /**
             * Create fake form and attach event handlers if autocomplete is disabled
             */
            if (this.isAutocompleteDisabled()) {
                $fakeForm = this.createFakeForm();

                this.hide();
                this.getElement()
                    .find('form')
                    .attr('id', 'loginForm')
                    .attr('aria-hidden', 'true');
                this.getContainer().prepend($fakeForm);

                // submit the form when the user hit the submit button inside the fake form
                $fakeForm
                    .find('input[type="submit"], button[type="submit"]')
                    .off('click')
                    .on('click', function(e) {
                        e.preventDefault();
                        submitForm();
                    });

                // submit the form when the user hit the ENTER key inside the fake form
                $fakeForm.on('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        submitForm();
                    }
                });
            }

            /**
             * Attach elements for password revealing and attach event handlers
             */
            if (this.isPasswordRevealEnabled()) {
                this.manipulateFormDom();
                this.attachPasswordRevealEvents();
            }

            $loginBtn = this.getForm().find('[name=connect]');
            $loginBtn.removeAttr('disabled').removeClass('disabled');

            this.displayMessages(this.getMessages());
        });

    _.defer(function() {
        loginComponent.init(config);
    });
    return loginComponent;
}
