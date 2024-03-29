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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Anton Tsymuk <anton@taotesting.com>
 */
import $ from 'jquery';
import __ from 'i18n';
import component from 'ui/component';
import pageSizeSelectorTpl from 'ui/pageSizeSelector/tpl/pageSizeSelector';
import 'select2';

/**
 * Default config values
 * @type {Object}
 */
const defaults = {
    defaultSize: 25,
    options: [
        { label: '25 ' + __('items per page'), value: 25 },
        { label: '50 ' + __('items per page'), value: 50 },
        { label: '75 ' + __('items per page'), value: 75 },
        { label: '100 ' + __('items per page'), value: 100 },
        { label: '200 ' + __('items per page'), value: 200 }
    ]
};

/**
 * Builds a select component with page size options
 *
 * @param {Object} config
 * @param {Number} [config.defaultSize] - selected page size
 * @param {Object} [config.items] - available options
 * @returns {pageSizeSelector}
 */
export default function pageSizeSelectorFactory(config) {
    const pageSizeSelectorSpecs = {
        setSelectedOption() {
            const options = this.config.options;
            const defaultSize = parseInt(this.config.defaultSize, 10);

            let selectedOption;
            options.forEach(option => {
                if (parseInt(option.value, 10) === defaultSize) {
                    selectedOption = option;

                    option.selected = true;
                } else {
                    option.selected = false;
                }
            });

            // if there is no option with provided default size use first option as default
            if (!selectedOption) {
                options[0].selected = true;
            }
        }
    };

    return component(pageSizeSelectorSpecs, defaults)
        .setTemplate(pageSizeSelectorTpl)
        .on('init', function onInit() {
            this.setSelectedOption();
        })
        .on('render', function onRender() {
            $('.select2', this.getElement())
                .select2({
                    dropdownCssClass: 'page-size-dropdown',
                    minimumResultsForSearch: Infinity
                })
                .on('change', e => {
                    this.trigger('change', e.val);
                });
        })
        .after('render', function afterRender() {
            // Notify about the default value after render
            this.trigger('change', $('select', this.getElement()).val());
        })
        .on('destroy', function onDestroy() {
            $('.select2', this.getElement()).select2('destroy');
        })
        .init(config);
}
