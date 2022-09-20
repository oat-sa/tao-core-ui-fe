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
 * Copyright (c) 2022 (original work) Open Assessment Technologies SA ;
 */

import component from 'ui/component';
import propertySelectorTpl from 'ui/propertySelector/tpl/property-selector';
import propertyDescriptionTpl from 'ui/propertySelector/tpl/property-description';
import highlightedTextTpl from 'ui/propertySelector/tpl/highlighted-text';
import checkBoxTpl from 'ui/dialog/tpl/checkbox';
import buttonFactory from 'ui/button';
import 'ui/propertySelector/css/propertySelector.css';
import $ from 'jquery';


/**
 * Lookup for characters in text to highlight
 * @param {String} text - text to lookup
 * @param {String} highlight - character(s) to be highlighted
 * @param {regExp|String} match - match to be applied in the text
 * @returns {String} - highlighted text
 */
    function highlightCharacter(text, highlight, match) {
    return text.replace(match, highlightedTextTpl({text: highlight}));
}

/**
 * Creates property description list element
 * @param {Object} property
 * @returns JQuery element containing property description
 */
function createPropertyOption(property, search) {
    const descriptionData = Object.assign({}, property);
    if (search !== '') {
        descriptionData.label = highlightCharacter(descriptionData.label, search, search);
        descriptionData.alias = descriptionData.alias && highlightCharacter(descriptionData.alias, search, search);
    }
    const $propertyDescription = $(propertyDescriptionTpl({ property: descriptionData }));
    const $checkboxContainer = $('.checkbox-container', $propertyDescription);
    $checkboxContainer.append(checkBoxTpl({ id: descriptionData.id, checked: descriptionData.selected }));
    const $checkbox = $('input', $checkboxContainer);
    $checkbox.on('change', function () {
        if (this.checked) {
            selectedProperties.add(property.id);
        } else {
            selectedProperties.delete(property.id);
        }
    });
    return $propertyDescription;
}

export default function propertySelectorFactory(config) {
    //element references
    let $container;
    let $buttonsContainer;
    let $propertyListContaner;
    let $searchInput;
    let availableProperties = [];
    let selectedProperties;
    let search = '';

    const parentGap = 20;

    const instance = component({
        positionContainer: function positionContainer() {
            let { top, left, right, bottom } = this.config.data.position;
            let maxHeight;
            if (typeof bottom === 'undefined') {
                maxHeight = $container.parent().height() - top - parentGap;
            }
            if (typeof top === 'undefined') {
                maxHeight = $container.parent().height() - bottom - parentGap;
            }
            if (typeof top === 'undefined' && typeof bottom === 'undefined') {
                top = 0;
                bottom = 0;
                maxHeight = $container.parent().height();
            }

            $container.css({ top, left, right, bottom, maxHeight });
        },

        /**
         * Updates the list
         */
        redrawList: function redrawList() {
            $propertyListContaner.empty();
            const propertiesToRender = [];
            availableProperties.forEach(property => {
                property.selected = selectedProperties.has(property.id);
                if (
                        search === '' || 
                        property.label.toLowerCase().includes(search.toLowerCase()) || 
                        (property.alias && property.alias.toLowerCase().includes(search.toLowerCase()))
                    ) {
                        propertiesToRender.push(createPropertyOption(property, search));
                    }
            });
            $propertyListContaner.append(propertiesToRender);
        },
        /**
         * Adds and setups buttons to button container
         */
        addButtons: function addButtons() {
            const cancelButton = buttonFactory({
                id: 'cancel',
                label: 'Cancel',
                type: 'info',
                cls: 'btn-secondary'
            }).on('click', () => {
                this.trigger('cancel');
            });

            const saveButton = buttonFactory({
                id: 'save',
                label: 'Save',
                type: 'info'
            }).on('click', () => {
                this.trigger('select', [...selectedProperties]);
            });

            cancelButton.render($buttonsContainer);
            saveButton.render($buttonsContainer);
        },
        /**
         * Setups search input event listners
         */
        setupSearch: function setupSearch() {
            $searchInput = $('input.search-property', $container);
            $searchInput.on('input', function () {
                search = $(this).val();
                instance.redrawList();
            });
        }
    })
        .setTemplate(propertySelectorTpl)
        .on('render', function () {
            //component parts reference assignments
            $container = instance.getElement();
            $propertyListContaner = $('.property-list-container', $container);
            $buttonsContainer = $('.control-buttons-container', $container);

            this.positionContainer();

            this.redrawList();

            this.setupSearch();

            this.addButtons();

            this.trigger('ready');
        })
        .on('init', function () {
            //setup data
            const data = instance.config.data;
            if (data.available) {
                if (!Array.isArray(data.available)) {
                    availableProperties = Object.values(data.available);
                } else {
                    availableProperties = data.available;
                }
            }
            if (data.selected) {
                selectedProperties = new Set(data.selected);
            }
        });

    setTimeout(() => instance.init(config), 0);
    return instance;
}
