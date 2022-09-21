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
import labelTpl from 'ui/propertySelector/tpl/label-text';
import aliasTpl from 'ui/propertySelector/tpl/alias-text';
import highlightedTextTpl from 'ui/propertySelector/tpl/highlighted-text';
import checkBoxTpl from 'ui/propertySelector/tpl/checkbox';
import buttonFactory from 'ui/button';
import DOMPurify from 'dompurify'
import 'ui/propertySelector/css/propertySelector.css';
import $ from 'jquery';


export default function propertySelectorFactory(config) {
    //element references
    let $container;
    let $buttonsContainer;
    let $propertyListContaner;
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
            $propertyListContaner.empty();
            const propertiesToRender = [];
            availableProperties.forEach(property => {
                property.selected = selectedProperties.has(property.id);
                if (
                    search === '' ||
                    (property.label && property.label.toLowerCase().includes(search.toLowerCase())) ||
                    (property.alias && property.alias.toLowerCase().includes(search.toLowerCase()))
                ) {
                    propertiesToRender.push(createPropertyOption(property, search));
                }
            });
            $propertyListContaner.append(propertiesToRender);
            this.trigger('redraw');
        },
    })
    .setTemplate(propertySelectorTpl)
    .on('render', function () {
        //component parts reference assignments
        $container = instance.getElement();
        $propertyListContaner = $('.property-list-container', $container);
        $buttonsContainer = $('.control-buttons-container', $container);

        $propertyListContaner.on('click', e => {
            if (e.target.dataset.propertyId) {
                if (e.target.checked) {
                    selectedProperties.add(e.target.dataset.propertyId);
                } else {
                    selectedProperties.delete(e.target.dataset.propertyId);
                }
            }
        });

        positionContainer($container, this.config.data.position);
        addButtons($buttonsContainer, this)

        this.redrawList();

        //search event setup
        $searchInput = $('input.search-property', $container);
        $searchInput.on('input', function () {
            search = $(this).val();
            if (searchRedrawTimeoutId) {
                clearTimeout(searchRedrawTimeoutId);
            }
            searchRedrawTimeoutId = setTimeout(instance.redrawList, searchRedrawTimeout);
        });

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

        selectedProperties = new Set(data.selected);
    });


    /**
     * Lookup for characters in text to highlight
     * @param {String} text - text to lookup
     * @param {String} search - match to be applied in the text
     * @returns {String} - highlighted text
     */
    function highlightCharacter(text, search) {
        const reg = new RegExp(search, 'gi');
        return text.replace(reg, (str) => highlightedTextTpl({ text: str }));
    }
    
    /**
     * Creates property description list element
     * @param {Object} property
     * @returns JQuery element containing property description
     */
    function createPropertyOption(property, search) {
        const descriptionData = Object.assign({}, property);
        if (search !== '') {
            descriptionData.label = descriptionData.label && highlightCharacter(DOMPurify.sanitize(descriptionData.label), search);
            descriptionData.alias = descriptionData.alias && highlightCharacter(DOMPurify.sanitize(descriptionData.alias), search);
        }
        const $propertyDescription = $(propertyDescriptionTpl());
        if(descriptionData.alias) {
            $('.property-description', $propertyDescription).append(labelTpl({text: descriptionData.label, alias: true}));
            $('.property-description', $propertyDescription).append(aliasTpl({text: descriptionData.alias}));
        }else{
            $('.property-description', $propertyDescription).append(labelTpl({text: descriptionData.label}));
        }
    
        const $checkboxContainer = $('.checkbox-container', $propertyDescription);
        $checkboxContainer.append(checkBoxTpl({ id: descriptionData.id, checked: descriptionData.selected }));
        return $propertyDescription;
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
        }).on('click', () => {
            instance.trigger('cancel');
        });
    
        const saveButton = buttonFactory({
            id: 'save',
            label: 'Save',
            type: 'info'
        }).on('click', () => {
            instance.trigger('select', [...selectedProperties]);
        });
    
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
        }else if (typeof bottom === 'undefined') {
                maxHeight = $el.parent().height() - top - parentGap;
        } else if (typeof top === 'undefined') {
                maxHeight = $el.parent().height() - bottom - parentGap;
        }
        $el.css({ top, left, right, bottom, maxHeight });
    }
        
        
    setTimeout(() => instance.init(config), 0);
    return instance;
}
