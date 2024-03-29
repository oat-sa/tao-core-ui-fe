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
import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import component from 'ui/component';
import selectTpl from 'ui/bulkActionPopup/tpl/select';
import 'select2';

var selectedValues = {};

/**
 * Create a combobox and initialize it with select2
 *
 * @param {Number} level
 * @param {array} categoriesDefinitions - the array that defines the number and config for each level of combobox cascade
 * @param {array} categories - the array that contains nested array of categories
 * @returns {jQuery}
 */
function createCombobox(level, categoriesDefinitions, categories) {
    if (categoriesDefinitions[level]) {
        const categoryDef = categoriesDefinitions[level];
        let _categories, $comboBox;
        if (categoryDef.id) {
            //format categories
            _categories = _.map(categories, function (cat) {
                var _cat = _.clone(cat);
                if (_cat.categories) {
                    //encode subcategory in json
                    _cat.categories = JSON.stringify(_cat.categories);
                }
                return _cat;
            });

            //init <select> DOM element
            $comboBox = $(
                selectTpl({
                    comboboxId: categoryDef.id,
                    comboboxLabel: categoryDef.label || '',
                    options: _categories
                })
            );

            categoriesDefinitions[level].$comboBox = $comboBox;

            //add event handler
            $comboBox.on('change', function () {
                var subCategories, $subComboBox;
                var $selected = $comboBox.find(':selected');
                selectedValues = {};

                //clean previously created combo boxes
                _.forEach(categoriesDefinitions, function (category, key) {
                    if (category.$comboBox && key > level) {
                        category.$comboBox.remove();
                        category.$comboBox = null;
                    }
                });

                subCategories = $selected.data('categories');
                if (_.isArray(subCategories) && subCategories.length) {
                    //init sub-level select box by recursive call to createCombobox
                    $subComboBox = createCombobox(level + 1, categoriesDefinitions, subCategories);
                    if ($subComboBox) {
                        categoriesDefinitions[level + 1].$comboBox = $subComboBox;
                        $comboBox.after($subComboBox);
                    }
                }

                //retrieve combobox values
                _.forEach(categoriesDefinitions, function (value) {
                    if (value.$comboBox) {
                        const $select = value.$comboBox.find('select');
                        selectedValues[value.id] = $select.val();
                    }
                });

                //trigger event
                $comboBox.trigger('selected.cascading-combobox', [selectedValues]);
            });

            //init select 2 on $comboBox
            $comboBox.find('select').select2({
                dropdownAutoWidth: true,
                placeholder: categoryDef.placeholder || __('select...'),
                minimumResultsForSearch: -1
            });

            return $comboBox;
        }
    } else {
        throw new Error(`missing category definition on level :  ${level}`);
    }
}

/**
 * @param {object} options
 * @param {Array} [options.categoriesDefinitions] - the array that defines the number and config for each level of combobox cascade
 * @param {Array} [options.categories] - the array that contains nested array of categories
 * @returns {function}
 */
export default function cascadingComboBoxFactory(options) {
    return component()
        .on('render', function render($container) {
            if (_.isArray(options.categoriesDefinitions) && _.isArray(options.categories)) {
                const $comboBox = createCombobox(0, options.categoriesDefinitions, options.categories);
                $container.append($comboBox);
            }
        })
        .init(options);
}
