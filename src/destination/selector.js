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
 * Copyright (c) 2018-2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * Let's you select a destination class in a move or a copy
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import component from 'ui/component';
import confirmDialog from 'ui/dialog/confirm';
import resourceSelectorFactory from 'ui/resource/selector';
import loadingButtonFactory from 'ui/loadingButton/loadingButton';
import taskCreationButtonFactory from 'ui/taskQueueButton/standardButton';
import selectorTpl from 'ui/destination/tpl/selector';
import 'ui/destination/css/selector.css';

var defaultConfig = {
    title: __('Copy to'),
    description: __('Select a destination'),
    actionName: __('Copy'),
    icon: 'copy',
    showACL: false,
    aclTransferMode: null
};

/**
 * Creates the selector component
 * @param {jQueryElement} $container - where the component is rendered
 * @param {Object} [config] - the configuration
 * @param {String} [config.classUri] - the root classUri
 * @param {String} [config.title] - header
 * @param {String} [config.description] - a description sentence
 * @param {String} [config.confirm] - when defined, confirmation message that will be displayed before triggering the action
 * @param {String} [config.actionName] - the action button text
 * @param {String} [config.icon] - the action button icon
 * @param {Object} [config.taskQueue] - define the taskQueue model to be used (only useful if the triggered action uses the task queue)
 * @param {String} [config.taskCreationUrl] - the task creation endpoint (only required if the option taskQueue is defined)
 * @param {Object} [config.taskCreationData] - optionally define the data that will be sent to the task creation endpoint
 * @param {Boolean} [config.showACL] - optionally define if ACL controls shall appear on the interface
 * @param {String} [config.aclTransferMode] - define ACL default behavior on the interface
 * @param {Function} [config.preventSelection] - prevent selection callback (@see ui/resource/selectable)
 * @returns {destinationSelector} the component itself
 */
export default function destinationSelectorFactory($container, config) {
    /**
     * @typedef {destinationSelector} the component
     */
    var destinationSelector = component(
        {
            /**
             * Forwards data update to it's resource selector
             * @see ui/resource/selector#update
             */
            update: function udpate(results, params) {
                if (this.resourceSelector) {
                    this.resourceSelector.update(results, params);
                }
            },

            /**
             * Updates the url on taskCreationButton
             * @param {String} url - url of the task creation
             */
            updateTaskCreationUrl: function updateTaskCreationUrl(url) {
                if (this.config && this.taskCreationButton && this.taskCreationButton.config) {
                    this.taskCreationButton.config.taskCreationUrl = url;
                    this.config.taskCreationUrl = url;
                }
            }
        },
        defaultConfig
    )
        .setTemplate(selectorTpl)
        .on('init', function() {
            this.render($container);
        })
        .on('render', function() {
            var self = this;
            var $component = this.getElement();

            /**
             * Get the current selected class uri
             * @returns {String} the selected uri
             */
            var getSelectedUri = function getSelectedUri() {
                var select = self.resourceSelector.getSelection();
                var uris;
                //validate the selection
                if (_.isPlainObject(select)) {
                    uris = _.pluck(select, 'uri');
                    if (uris.length) {
                        return uris[0];
                    }
                }
            };

            var getSelectedACLTransferMode = function getSelectedACLTransferMode() {
                return $('input[name="acl-mode"]:checked').val();
            };

            if (this.config.taskQueue) {
                this.taskCreationButton = taskCreationButtonFactory({
                    type: 'info',
                    icon: this.config.icon,
                    label: this.config.actionName,
                    terminatedLabel: 'Interrupted',
                    taskQueue: this.config.taskQueue,
                    taskCreationData: this.config.taskCreationData || {},
                    taskCreationUrl: this.config.taskCreationUrl,
                    taskReportContainer: $container
                })
                    .on('finished', function(result) {
                        self.trigger('finished', result, self.taskCreationButton);
                        this.reset(); //reset the button
                    })
                    .on('continue', function() {
                        self.trigger('continue');
                    });
            } else {
                this.taskCreationButton = loadingButtonFactory({
                    type: 'info',
                    icon: this.config.icon,
                    label: this.config.actionName,
                    terminatedLabel: 'Interrupted'
                });
            }

            this.taskCreationButton
                .on('started', function() {
                    function triggerAction() {
                        /**
                         * @event destinationSelector#select
                         * @param {String} classUri - the destination class
                         */
                        self.trigger('select', getSelectedUri(), getSelectedACLTransferMode());
                    }

                    if (self.config.confirm) {
                        confirmDialog(self.config.confirm, triggerAction, function() {
                            self.taskCreationButton.terminate().reset();
                        });
                    } else {
                        triggerAction();
                    }
                })
                .on('error', function(err) {
                    self.trigger('error', err);
                })
                .render($component.find('.actions'))
                .disable();

            //set up the inner resource selector
            this.resourceSelector = resourceSelectorFactory($('.selector-container', $component), {
                selectionMode: 'single',
                selectClass: true,
                classUri: this.config.classUri,
                showContext: false,
                showSelection: false,
                preventSelection: this.config.preventSelection
            });

            //spread the events
            this.resourceSelector.spread(this, ['query', 'error', 'update']);

            //enable disable the action button
            this.resourceSelector.on('change', function(selected) {
                if (selected && _.size(selected) > 0) {
                    self.taskCreationButton.enable();

                    //append the selected class URI to the task creation data
                    if (_.isPlainObject(self.taskCreationButton.config.taskCreationData)) {
                        self.taskCreationButton.config.taskCreationData.classUri = getSelectedUri();
                    }
                } else {
                    self.taskCreationButton.disable();
                }
            });
        });

    _.defer(function() {
        destinationSelector.init(config);
    });

    return destinationSelector;
}
