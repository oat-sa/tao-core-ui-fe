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
 * Copyright (c) 2015 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */

import _ from 'lodash';
import __ from 'i18n';
import component from 'ui/component';
import mainTpl from 'ui/listbox/tpl/main';
import listTpl from 'ui/listbox/tpl/list';
import 'ui/listbox/css/listbox.css';

/**
 * Some default values
 * @type {Object}
 * @private
 */
var _defaults = {
    title: false,
    textNumber: __('Available'),
    textEmpty: __('There is nothing to list!'),
    textLoading: __('Loading'),
    flex: 12
};

/**
 * Defines a list of boxes
 * @type {Object}
 */
var listBox = {
    /**
     * Updates the list of boxes
     * @param {Array} list
     * @param {String} [list.url] - The URL of the entry point
     * @param {String} [list.label] - The displayed label
     * @param {String} [list.content] - An optional content displayed in the middle
     * @param {String} [list.text] - A bottom text
     * @param {String} [list.html] - A bottom html
     * @param {Number} [list.width] - The width of the entry related to flex-grid (default: 6)
     * @param {String} [list.cls] - An optional CSS class to add
     * @returns {listBox}
     */
    update: function update(list) {
        var $list = this.controls && this.controls.$list;
        var $numberValue = this.controls && this.controls.$numberValue;
        var count;

        this.setLoading(true);
        if ($list) {
            $list.empty();

            if (list && list.length) {
                $list.append(
                    listTpl({
                        list: list,
                        width: this.config.flex
                    })
                );

                if ($numberValue) {
                    count = list.length;
                    if (_.isFunction(this.config.countRenderer)) {
                        count = this.config.countRenderer(count);
                    }
                    $numberValue.text(count);
                }

                this.setState('empty', false);
                this.setState('loaded', true);
            } else {
                this.setState('empty', true);
                this.setState('loaded', false);
            }
        }
        this.setLoading(false);

        return this;
    },

    /**
     * Sets the loading state
     * @param {Boolean} flag
     * @returns {listBox}
     */
    setLoading: function setLoading(flag) {
        if (flag) {
            this.setState('loaded', false);
        }
        return this.setState('loading', flag);
    },

    /**
     * Sets the title of the list.
     * @param {String|Boolean} title - The text to set. If the value is false no title is displayed
     * @returns {listBox}
     */
    setTitle: function setTitle(title) {
        var $title = this.controls && this.controls.$title;
        this.config.title = title;
        if ($title) {
            if (false === title) {
                $title.addClass('hidden');
            } else {
                $title.html(title).removeClass('hidden');
            }
        }

        return this;
    },

    /**
     * Sets the label of the number of boxes.
     * @param {String|Boolean} text - The text to set. If the value is false no label is displayed
     * @returns {listBox}
     */
    setTextNumber: function setTextNumber(text) {
        var $numberLabel = this.controls && this.controls.$numberLabel;
        var $textAvailable = this.controls && this.controls.$textAvailable;
        this.config.textNumber = text;
        if ($numberLabel) {
            if (text !== false) {
                $numberLabel.html(text).removeClass('hidden');
            } else if ($textAvailable) {
                $textAvailable.addClass('hidden');
            }
        }

        return this;
    },

    /**
     * Sets the label displayed when there no boxes available.
     * @param {String|Boolean} text - The text to set. If the value is false no label is displayed
     * @returns {listBox}
     */
    setTextEmpty: function setTextEmpty(text) {
        var $textEmpty = this.controls && this.controls.$textEmpty;
        this.config.textEmpty = text;
        if ($textEmpty) {
            if (false === text) {
                $textEmpty.addClass('hidden');
            } else {
                $textEmpty.html(text).removeClass('hidden');
            }
        }

        return this;
    },

    /**
     * Sets the label displayed when the list is loading.
     * @param {String|Boolean} text - The text to set. If the value is false no label is displayed
     * @returns {listBox}
     */
    setTextLoading: function setTextLoading(text) {
        var $textLoading = this.controls && this.controls.$textLoading;
        this.config.textLoading = text;
        if ($textLoading) {
            if (false === text) {
                $textLoading.addClass('hidden');
            } else {
                $textLoading.html(text).removeClass('hidden');
            }
        }

        return this;
    },

    /**
     * Just override the base method to prevent unwanted resizing: the width must be handled by CSS flex box
     * @returns {listBox}
     */
    setSize: function setSize() {
        //eslint-disable-next-line no-console
        console.warn(
            'The setSize() method has been disabled in the listbox component as its size is handled by CSS flex box'
        );
        return this;
    }
};

/**
 * Builds an instance of the listBox manager
 * @param {Object} config
 * @param {String|Boolean} [config.title] - Sets the title of the list. If the value is false no title is displayed (default: false)
 * @param {String|Boolean} [config.textNumber] - Sets the label of the number of boxes. If the value is false no label is displayed (default: 'Available')
 * @param {String|Boolean} [config.textEmpty] - Sets the label displayed when there no boxes available. If the value is false no label is displayed (default: 'There is nothing to list!')
 * @param {String|Boolean} [config.textLoading] - Sets the label displayed when the list is loading. If the value is false no label is displayed (default: 'Loading')
 * @param {Number} [config.width] - Sets the default flex width of all boxes, unless they define their own value. (default: 12)
 * @param {Array} [config.list] - The list of boxes to display
 * @param {jQuery|HTMLElement|String} [config.renderTo] - An optional container in which renders the component
 * @param {Boolean} [config.replace] - When the component is appended to its container, clears the place before
 * @param {Function} [config.countRenderer] - An optional callback applied on the list count before display
 * @returns {listBox}
 */
var listBoxFactory = function listBoxFactory(config) {
    var initConfig = config || {};

    // The width is managed by CSS flex box. So we need to remap the flex width to another attribute,
    // as the width is used to size the base component using pixels units.
    // Please also note the main size handling brought by the base component is not used here, and has been disabled.
    initConfig.flex = initConfig.width;

    return (
        component(listBox, _defaults)
            .setTemplate(mainTpl)

            // uninstalls the component
            .on('destroy', function () {
                this.controls = null;
            })

            // renders the component
            .on('render', function () {
                this.controls = {
                    $title: this.$component.find('h1'),
                    $textEmpty: this.$component.find('.empty-list'),
                    $textAvailable: this.$component.find('.available-list'),
                    $textLoading: this.$component.find('.loading span'),
                    $numberLabel: this.$component.find('.available-list .label'),
                    $numberValue: this.$component.find('.available-list .count'),
                    $list: this.$component.find('.list')
                };

                if (this.config.list) {
                    this.update(this.config.list);
                } else {
                    this.setState('empty', true);
                    this.setState('loaded', false);
                }
            })
            .init(_.omit(initConfig, 'width'))
    );
};

export default listBoxFactory;
