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
import buttonFactory from 'ui/button';
import 'ui/propertySelector/css/propertySelector.css';
import $ from 'jquery';

/**
 * A list of fields in which we can search a term.
 * @type {string[]}
 * @private
 */
const searchableFields = ['label', 'alias', 'classLabel'];

/**
 * Sort an array by a particular property.
 * @param {Array} iter - The array to sort.
 * @param {string} prop - The name of the sorting property.
 * @returns {Array} - Returns a sorted copy of the array.
 * @private
 */
function sortBy(iter, prop) {
    return Array.from(iter).sort((a, b) => {
        const textA = (a && a[prop]) || '';
        const textB = (b && b[prop]) || '';
        return textA.localeCompare(textB);
    });
}

/**
 * Creates a property selector with respect to given options.
 * @param {object} [config]
 * @returns {*}
 */
export default function propertySelectorFactory(config) {
    //element references
    let $container;
    let $buttonsContainer;
    let $propertyListContainer;
    let $searchInput;
    let availableProperties = [];
    let selectedProperties;
    let search = '';
    let searchRedrawTimeoutId;

    const parentGap = 20;
    const searchRedrawTimeout = 500;

    const instance = component({
        /**
         * Updates the list
         */
        redrawList() {
            $propertyListContainer.empty();
            const propertiesToRender = [];
            availableProperties.forEach(property => {
                property.selected = selectedProperties.has(property.id);
                if (search === '' || includeSearch(property, search)) {
                    propertiesToRender.push(createPropertyOption(property, search));
                }
            });
            $propertyListContainer.append(propertiesToRender);

            this.trigger('redraw');
        },

        /**
         * @typedef propertySelectorPosition
         * @property {number} top top position of container element from parent
         * @property {number} right right position of container element from parent
         * @property {number} bottom bottom position of container element from parent
         * @property {number} left left position of container element from parent
         */
        /**
         * @typedef propertyDescription
         * @property {string} id id of property
         * @property {string} label label of the property
         * @property {string} alias alias of the property
         * @property {string} classLabel label of the property class
         */
        /**
         * @typedef propertySelectorData
         * @property {propertySelectorPosition} position position of the property selector modal top, right, bottom, left
         * @property {Array<string>} selected array of selected property id
         * @property {Array<propertyDescription>} available array of available proprty descriptions
         */
        /**
         * Sets data
         * @param {propertySelectorData} data
         */
        setData(data) {
            if (data.available) {
                availableProperties = sortBy(data.available, 'label');
            }
            selectedProperties = new Set(data.selected);
            this.redrawList();
        },
        toggle() {
            if (this.shown) {
                this.hide();
            } else {
                this.show();
                this.redrawList();
            }
        }
    })
        .setTemplate(propertySelectorTpl)
        .on('render', function () {
            //component parts reference assignments
            $container = instance.getElement();
            $propertyListContainer = $('.property-list-container', $container);
            $buttonsContainer = $('.control-buttons-container', $container);

            $propertyListContainer.on('click', e => {
                if (e.target.dataset.propertyId) {
                    if (e.target.checked) {
                        selectedProperties.add(e.target.dataset.propertyId);
                    } else {
                        selectedProperties.delete(e.target.dataset.propertyId);
                    }
                }
            });

            positionContainer($container, this.config.data.position);
            addButtons($buttonsContainer, this);

            this.setData(this.config.data);

            //search event setup
            $searchInput = $('input.search-property', $container);
            $searchInput.on('input', function () {
                search = $(this).val();
                if (searchRedrawTimeoutId) {
                    clearTimeout(searchRedrawTimeoutId);
                }
                searchRedrawTimeoutId = setTimeout(instance.redrawList, searchRedrawTimeout);
            });

            this.show();
            this.trigger('ready');
        })
        .on('destroy', unregisterPageClick)
        .on('hide', function () {
            this.shown = false;
            unregisterPageClick();
        })
        .on('show', function () {
            registerPageClick();
            this.shown = true;
        })
        .on('cancel select', function () {
            this.hide();
            $searchInput.val('');
            search = '';
        });

    /**
     * Close the component when clicking outside.
     * @param event
     */
    function pageClick(event) {
        if ($(event.target).closest('.property-selector-container').length) {
            return;
        }
        instance.trigger('cancel');
    }

    /**
     * Listens to the clicks outside the component
     */
    function registerPageClick() {
        setTimeout(() => document.addEventListener('click', pageClick), 0);
    }

    /**
     * Stops listening to the clicks outside the component
     */
    function unregisterPageClick() {
        setTimeout(() => document.removeEventListener('click', pageClick), 0);
    }

    /**
     * Checks if a searchable field contains the searched term.
     * @param {object} property
     * @param {string} search
     * @returns {boolean}
     */
    function includeSearch(property, search) {
        const searchedTerm = search.toLowerCase();
        return searchableFields.some(
            field => 'string' === typeof property[field] && property[field].toLowerCase().includes(searchedTerm)
        );
    }

    /**
     * Lookup for characters in text to highlight
     * @param {String} text - text to lookup
     * @param {String} searchString - match to be applied in the text
     * @returns {String} - highlighted text
     */
    function highlightCharacter(text, searchString) {
        const reg = new RegExp(searchString, 'gi');
        return text.replace(reg, str => highlightedTextTpl({ text: str }));
    }

    /**
     * Creates property description list element
     * @param {Object} property
     * @returns JQuery element containing property description
     */
    function createPropertyOption(property, searchString) {
        const descriptionData = Object.assign({}, property);
        if (searchString !== '') {
            searchableFields.forEach(field => {
                if (descriptionData[field]) {
                    descriptionData[field] = highlightCharacter(descriptionData[field], searchString);
                }
            });
        }
        return $(propertyDescriptionTpl(descriptionData));
    }

    /**
     * Adds buttons to container
     * @param {jQuery} $targetContainer
     */
    function addButtons($targetContainer) {
        const cancelButton = buttonFactory({
            id: 'cancel',
            label: 'Cancel',
            type: 'info',
            cls: 'btn-secondary'
        }).on('click', () => instance.trigger('cancel'));

        const saveButton = buttonFactory({
            id: 'save',
            label: 'Save',
            type: 'info'
        }).on('click', () => instance.trigger('select', [...selectedProperties]));

        cancelButton.render($targetContainer);
        saveButton.render($targetContainer);
    }

    /**
     * Positions element inside parent
     * @param {jQuery} $el element to apply positioning
     * @param {Object} position object  { top, left, right, bottom } top OR bottom is required
     */
    function positionContainer($el, position) {
        let { top, left, right, bottom } = position;
        let maxHeight;
        if (typeof top === 'undefined' && typeof bottom === 'undefined') {
            top = 0;
            bottom = 0;
            maxHeight = $el.parent().height();
        } else if (typeof bottom === 'undefined') {
            maxHeight = $el.parent().height() - top - parentGap;
        } else if (typeof top === 'undefined') {
            maxHeight = $el.parent().height() - bottom - parentGap;
        }
        $el.css({ top, left, right, bottom, maxHeight });
    }

    setTimeout(() => instance.init(config), 0);
    return instance;
}
