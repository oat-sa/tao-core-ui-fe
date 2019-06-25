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
 * Copyright (c) 2017-2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * A filter form to select the properties you want to filter
 *
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */

import _ from 'lodash';
import __ from 'i18n';
import component from 'ui/component';
import formFactory from 'ui/form/simpleForm';
import widgetDefinitions from 'ui/form/widget/definitions';
import filtersTpl from 'ui/resource/tpl/filters';

/**
 * The list of supported properties
 */
const supportedWidgets = [
    widgetDefinitions.TEXTBOX,
    widgetDefinitions.CHECKBOX,
    widgetDefinitions.RADIOBOX,
    widgetDefinitions.COMBOBOX,
    widgetDefinitions.TEXTAREA,
    widgetDefinitions.STATEWIDGET,
];

const defaultConfig = {
    title: __('Search by properties'),
    applyLabel: __('Apply'),
    timeout: 30000,
};

/**
 * Builds the filter component
 *
 * @param {jQueryElement} $container - where to append the component
 * @param {Object} config - the component config
 * @param {String} config.classUri - the root Class URI
 * @param {String} config.data - the root Class URI
 * @param {Object} config.data.properties - the list of properties used to filter
 * @param {Object} config.data.ranges - the property ranges
 * @param {String} [config.title] - the form title
 * @param {String} [config.applyLabel] - the label of the apply button
 * @param {String} [config.timeout] - the timeout applied on the form rendering
 * @returns {filter} the component
 * @fires filter#ready once the form filter is rendered and ready
 */
export default function filtersFactory($container, config) {
    /**
     * @typedef {ui/component}
     */
    const filters = component(
        {
            /**
             * Get the filter values
             * @returns {Object} the form values
             */
            getValues() {
                if (this.is('rendered') && this.form) {
                    const values = this.form.getValues();
                    if (_.every(values, value => value === "")) {
                        return {};
                    }
                    return values;
                }
                return null;
            },

            /**
             * Set the value for a given field
             * @param {String} uri - the property URI
             * @param {String|String[]} value - the field value
             * @return {filter} chains
             */
            setValue(uri, value) {
                if (this.is('rendered') && this.form) {
                    const widget = this.form.getWidget(uri);
                    if (widget) {
                        widget.setValue(value);
                    }
                }

                return this;
            },

            /**
             * Reset the filter form
             * @return {filter} chains
             */
            reset() {
                return this.update(this.config.data);
            },

            /**
             * Update the filter form
             * @param {Object} data - the filtering data
             * @param {Object} data.properties - the list of properties used to filter
             * @param {Object} data.ranges - the property ranges
             * @return {filter} chains
             * @fires filter#update once the form filter is updated and ready
             * @fires filter#change when the user wants to apply the filter
             */
            update(data) {
                if (this.is('rendered')) {
                    this.getElement().empty();

                    this.form = formFactory(this.getElement(), {
                        widgets: _.filter(data.properties, property => _.contains(supportedWidgets, property.widget)),
                        ranges: data.ranges,
                        reset: true,
                        submitText: this.config.applyLabel,
                        title: this.config.title,
                    })
                        .on('ready', () => {
                            this.trigger('update', data);
                        })
                        .on('submit reset', () => {
                            /**
                             * Apply the filter values
                             * @event filter#change
                             * @param {Object} values - the filter values
                             */
                            this.trigger('change', this.form.getValues());
                        });
                }
                return this;
            },

            /**
             * Get a text that represents the actual query
             * @returns {String} the query
             */
            getTextualQuery() {
                let result;
                if (this.is('rendered')) {
                    result = _.reduce(
                        this.form.getValues(),
                        (acc, value, uri) => {
                            const widget = this.form.getWidget(uri);
                            let displayValue;
                            if (widget) {
                                if (!_.isEmpty(acc)) {
                                    acc += __(' AND ');
                                }
                                acc += widget.getConfig().label + __(' is ');
                                if (widget.getConfig().range) {
                                    displayValue = _.map(_.isArray(value) ? value : [value], val => {
                                        const selectedValue = _.find(widget.getConfig().range, {uri: val});
                                        return selectedValue && selectedValue.label;
                                    });
                                } else {
                                    displayValue = value;
                                }
                                if (_.isString(displayValue)) {
                                    acc += displayValue;
                                }
                                if (_.isArray(displayValue)) {
                                    acc += displayValue.join(', ');
                                }
                            }
                            return acc;
                        },
                        ''
                    );
                }
                return result;
            }
        },
        defaultConfig
    );

    filters
        .setTemplate(filtersTpl)
        .on('init', function() {
            this.render($container);
        })
        .on('render', function() {
            Promise.race([
                new Promise(resolve => {
                    if (this.config.data) {
                        this
                            .on('update.ready', () => {
                                this.off('update.ready');
                                resolve();
                            })
                            .update(this.config.data);
                    } else {
                        resolve();
                    }
                }),
                new Promise((resolve, reject) => {
                    window.setTimeout(() => reject(new Error('The form filter takes too long to render!')), this.getConfig().timeout);
                })
            ])
                /**
                 * Notifies the filter encountered an error
                 * @event filter#error
                 */
                .catch(err => this.trigger('error', err))

                /**
                 * Notifies the filter is ready
                 * @event filter#ready
                 */
                .then(() => this.trigger('ready'));
        });

    //always defer the initialization to let consumers listen for init and render events.
    _.defer(() => filters.init(config));

    return filters;
}
