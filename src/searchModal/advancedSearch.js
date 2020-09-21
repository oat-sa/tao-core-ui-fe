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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */
import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import advancedSearchTpl from 'ui/searchModal/tpl/advanced-search';
import textCriterionTpl from 'ui/searchModal/tpl/text-criterion';
import invalidCriteriaWarningTpl from 'ui/searchModal/tpl/invalid-criteria-warning';
import listCheckboxCriterionTpl from 'ui/searchModal/tpl/list-checkbox-criterion';
import listSelectCriterionTpl from 'ui/searchModal/tpl/list-select-criterion';
import 'ui/searchModal/css/advancedSearch.css';
import component from 'ui/component';
import 'ui/modal';
import 'ui/datatable';
import 'select2';

/**
 * Creates advanced search component
 *
 * @param {object} config
 * @param {object} config.renderTo - DOM element where component will be rendered to
 * @param {string} config.advancedCriteria - advanced criteria to be set on component creation
 * @returns {advancedSearch}
 */
export default function advancedSearchFactory(config) {
    // Private properties to be easily accessible by instance methods
    let $container = null;
    let $addCriteriaInput = null;
    let $criteriaSelect = null;
    let $advancedCriteriaContainer = null;
    let criteriaState = null;

    // Creates new component
    const instance = component({
        updateCriteria: function (selectedValue) {
            const criteria = requestCriteria(selectedValue);
            updateCriteria(criteria);
        },
        getState: function () {
            return criteriaState;
        },
        clear: function () {
            $advancedCriteriaContainer.removeClass('scrollable');
            $advancedCriteriaContainer.empty();
            _.forEach(criteriaState, criterion => {
                criterion.rendered = false;
                criterion.value = undefined;
            });
        },
        getAdvancedCriteriaQuery: function () {
            const advancedSearchCriteria = _.filter(criteriaState, criterion => criterion.rendered === true);
            let query = '';

            advancedSearchCriteria.forEach(renderedCriterion => {
                if (renderedCriterion.type === 'text') {
                    if (renderedCriterion.value && renderedCriterion.value.trim() !== '') {
                        query += ` AND ${renderedCriterion.label}:${renderedCriterion.value.trim()}`;
                    }
                } else if (renderedCriterion.type === 'list') {
                    if (renderedCriterion.value && renderedCriterion.value.length > 0) {
                        query += ` AND ${renderedCriterion.label}:(${renderedCriterion.value.join(' OR ')})`;
                    }
                }
            });

            return query;
        }
    })
        .setTemplate(advancedSearchTpl)
        .on('render', () => {
            initUiSelectors();
            initAddCriteriaSelector();
            initcriteriaState();
        });

    /**
     * Inits template selectors and scroll animation
     */
    function initUiSelectors() {
        $container = instance.getElement();
        $addCriteriaInput = $('.add-criteria-container a', $container);
        $criteriaSelect = $('.add-criteria-container select', $container);
        $advancedCriteriaContainer = $('.advanced-criteria-container', $container);

        $advancedCriteriaContainer.on('scroll', animateScroll);
    }

    /**
     * Inits select2 on criteria select and its UX logic
     */
    function initAddCriteriaSelector() {
        $criteriaSelect.select2({
            containerCssClass: 'criteria-select2',
            dropdownCssClass: 'criteria-dropdown-select2',
            sortResults: results => _.sortBy(results, ['text'])
        });

        // open dropdown when user clicks on add criteria input
        $addCriteriaInput.on('click', () => {
            $criteriaSelect.select2('open');
            // if dropdown is opened above addCriteria input, top property is slightly decreased to avoid overlapping with addCriteria icon
            if ($('.criteria-dropdown-select2').hasClass('select2-drop-above')) {
                $('.criteria-dropdown-select2').css(
                    'top',
                    $('.criteria-dropdown-select2').css('top').split('px')[0] - 10 + 'px'
                );
            }
        });

        // when a criterion is selected add it to criteria container, remove it from dropdown options and reset select
        $criteriaSelect.on('change', () => {
            const criterionToAdd = $criteriaSelect.children('option:selected').val();
            addNewCriterion(criterionToAdd);
            $criteriaSelect.children('option:selected').remove();
            $criteriaSelect.select2('val', '');
        });
    }

    /**
     * inits criteriaState loading it from the store (if present) or empty object.
     * If there is a stored criteriaState, those criteria that were rendered
     * but with undefined value are updated to not being rendered
     */
    function initcriteriaState() {
        if (instance.config.advancedCriteria) {
            _.forEach(instance.config.advancedCriteria, criterion => {
                if (criterion.rendered === true && criterion.value === undefined) {
                    criterion.rendered = false;
                }
            });
        }
        criteriaState = instance.config.advancedCriteria || {};
    }

    /**
     * Styles scrolling on $advancedCriteriaContainer
     */
    function animateScroll() {
        const scrollPercentage =
            $advancedCriteriaContainer.get(0).scrollTop /
            ($advancedCriteriaContainer.get(0).scrollHeight - $advancedCriteriaContainer.get(0).clientHeight);
        if (scrollPercentage > 0.1) {
            $advancedCriteriaContainer.addClass('scroll-separator-top');
        } else {
            $advancedCriteriaContainer.removeClass('scroll-separator-top');
        }
        if (scrollPercentage < 0.9) {
            $advancedCriteriaContainer.addClass('scroll-separator-bottom');
        } else {
            $advancedCriteriaContainer.removeClass('scroll-separator-bottom');
        }
    }

    /**
     * Renders new criterion to criteria container so it can be used on advanced search filtering
     * @param {string} criterionToAdd - new criterion to be added
     */
    function addNewCriterion(criterionToAdd) {
        // remove deprecated warning message
        $('.invalid-criteria-warning-container').remove();

        // render new criterion
        const criterion = criteriaState[criterionToAdd];
        const $criterionContainer = renderCriterion(criterion);

        // set logic to remove criterion
        $('.select2-search-choice-close', $criterionContainer).on('click', { criterion }, removeCriterion);

        // set initial value and manage value changes
        bindCriterionValue(criterion, $criterionContainer);

        // update styles if scroll is enabled
        if ($advancedCriteriaContainer.get(0).scrollHeight > $advancedCriteriaContainer.height()) {
            $advancedCriteriaContainer.addClass('scrollable');
        }

        criterion.rendered = true;
    }

    /**
     * Renders the new criterion selecting the appropiate handlebars template and prepending to advanced criteria container.
     * If criterion is of type list with more than give options, select2 is also init
     * @param {object} criterion - criterion to render
     * @returns - the rendered container
     */
    function renderCriterion(criterion) {
        let templateToUse = null;

        if (criterion.type === 'text') {
            templateToUse = textCriterionTpl;
        } else if (criterion.type === 'list' && criterion.values.length < 5) {
            templateToUse = listCheckboxCriterionTpl;
        } else {
            templateToUse = listSelectCriterionTpl;
        }

        $advancedCriteriaContainer.prepend(templateToUse({ criterion }));
        const $criterionContainer = $(`.${criterion.label}-filter`, $container);

        /**
         * On criterion of type list with more than five options, template includes a select
         * that is managed with select2, so we init it here
         */
        if (criterion.type === 'list' && criterion.values.length >= 5) {
            $(`input[name=${criterion.label}-select]`, $criterionContainer).select2({
                multiple: true,
                data: criterion.values.map(value => {
                    return { id: value, text: value };
                })
            });
        }

        return $criterionContainer;
    }

    /**
     * Sets intial value for rendered criterion and sets binding between view and state
     * @param {object} criterion - criterion to be managed
     * @param {object} $criterionContainer - rendered criterion
     */
    function bindCriterionValue(criterion, $criterionContainer) {
        if (criterion.type === 'text') {
            // set initial value
            $('input', $criterionContainer).val(criterion.value);
            // set event to bind input value to critariaState
            $('input', $criterionContainer).on('change', function () {
                criterion.value = $(this).val() || undefined;
            });
        } else if (criterion.type === 'list' && criterion.values.length >= 5) {
            // set initial value
            if (criterion.value) {
                $(`input[name=${criterion.label}-select]`, $criterionContainer).select2('val', criterion.value);
            }
            // set event to bind input value to critariaState
            $(`input[name=${criterion.label}-select]`, $criterionContainer).on('change', event => {
                criterion.value = event.val;
            });
        } else {
            // set initial value
            if (criterion.value) {
                criterion.value.forEach(selectedValue => {
                    $(`input[value=${selectedValue}]`, $criterionContainer).prop('checked', true);
                });
            }
            // set event to bind input value to critariaState
            $('input[type="checkbox"]', $criterionContainer).on('change', function () {
                criterion.value = $(this)
                    .closest('.filter-container')
                    .find('input[type=checkbox]:checked')
                    .get()
                    .map(function (element) {
                        return element.value;
                    });
            });
        }
    }

    /**
     * Removes a criterion from advanced criteria container when user clicks on the criterion close icon.
     * It also adds the option element to criteria select so removed criterion can be rendered again
     * @param {object} event - click event triggered on closing icon
     */
    function removeCriterion(event) {
        const criterion = event.data.criterion;
        const newOption = new Option(criterion.label, criterion.label, false, false);

        // remove criterion and append new criterion to select options
        $(this).parent().remove();
        $criteriaSelect.append(newOption);

        // reset criterion values on criteriaState
        criteriaState[criterion.label].rendered = false;
        criteriaState[criterion.label].value = undefined;

        // check if advanced criteria container is no longer scrollable
        if ($advancedCriteriaContainer.get(0).scrollHeight === $advancedCriteriaContainer.height()) {
            $advancedCriteriaContainer.removeClass('scrollable');
        }
    }

    /**
     * Request criteria for selected class (and children) schemas
     * @param {object} selectedValue - class to retreieve its properties from
     * @returns {array} - array of class properties
     */
    function requestCriteria(selectedValue) {
        /**
         * TODO - Implement ajax request once is implemented on BE. This conditional is
         * just to check the logic of replacing/removing criteria on class change
         */
        if (_.map(selectedValue, 'label')[0] === 'Item') {
            return [
                {
                    label: 'in-both-text',
                    type: 'text'
                },
                {
                    label: 'in-both-list',
                    type: 'list',
                    values: ['value0', 'value1', 'value2', 'value3']
                },
                {
                    label: 'in-both-select',
                    type: 'list',
                    values: ['value0', 'value1', 'value2', 'value3', 'value4']
                },
                {
                    label: 'only-in-root',
                    type: 'text'
                }
            ];
        } else if (_.map(selectedValue, 'label')[0] === 'QTI Interactions') {
            return [
                {
                    label: 'in-both-text',
                    type: 'text'
                },
                {
                    label: 'in-both-list',
                    type: 'list',
                    values: ['value0', 'value1', 'value2', 'value3']
                },
                {
                    label: 'in-both-select',
                    type: 'list',
                    values: ['value0', 'value1', 'value2', 'value3', 'value4']
                },
                {
                    label: 'only-in-child',
                    type: 'text'
                }
            ];
        }
    }

    /**
     * Manages the new set of available criteria. To do so, removes warning container and every
     * selectable criterion. Then removes from criteriaState and view every deprecated criterion,
     * updates criteriaState with the new available criteria set, and renders new warning
     * message if required
     * @param {array} criteria - array of class properties
     */
    function updateCriteria(criteria) {
        $('.invalid-criteria-warning-container').remove();
        $criteriaSelect.find('option:not(:first-child)').remove();
        const invalidCriteria = deleteDeprecatedCriteria(criteria);
        extendCriteria(criteria);
        renderWarningMessage(invalidCriteria);
    }

    /**
     * If there is any invalid criterion, renders an explanatory warning message
     * @param {array} invalidCriteria - array of string containing the label of every invalid criterion (those that were rendered but are no longer available)
     */
    function renderWarningMessage(invalidCriteria) {
        if (invalidCriteria.length > 0) {
            const invalidCriteriaWarning = invalidCriteriaWarningTpl({ invalidCriteria });
            $advancedCriteriaContainer.prepend(invalidCriteriaWarning);
            $('.invalid-criteria-warning-container .select2-search-choice-close', $advancedCriteriaContainer).on(
                'click',
                function () {
                    $(this).parent().remove();
                }
            );
        }
    }

    /**
     * Loops through current criteriaState so every criterion that is no longer available in the new
     * available criteria set is removed from criteriaState and from view, in case it had been
     * rendered. In that case it is also pushed into invalidCriteria array to be latter
     * included in the warning message
     * @param {array} criteria - array containing new set of criteria for current class
     * @returns {array} - array of strings with each deprecated criterion that was being displayed
     */
    function deleteDeprecatedCriteria(criteria) {
        const invalidCriteria = [];

        _.forEach(criteriaState, oldCriterion => {
            const deprecatedCriterion = !criteria.find(newCriterion => newCriterion.label === oldCriterion.label);
            if (deprecatedCriterion) {
                if (criteriaState[oldCriterion.label].rendered) {
                    $advancedCriteriaContainer.find(`.${oldCriterion.label}-filter`).remove();
                    invalidCriteria.push(oldCriterion.label);
                }
                delete criteriaState[oldCriterion.label];
            }
        });

        return invalidCriteria;
    }

    /**
     * Loops through new criteria set and checks if each new criterion was already present or not on criteriaState
     * and updates view and selectable criteria list accordingly
     * @param {array} criteria - array containing new set of criteria for current class
     */
    function extendCriteria(criteria) {
        criteria.forEach(criterion => {
            let createOption = true;

            // if new criterion was already on criteriaState and had to be rendered, we avoid creating an option for it and render it if it was not
            if (criteriaState[criterion.label] && criteriaState[criterion.label].rendered === true) {
                createOption = false;
                if ($advancedCriteriaContainer.find(`.${criterion.label}-filter`).length === 0) {
                    addNewCriterion(criterion.label);
                }
            } else {
                // if new criterion was not on criteriaState we add it
                criteriaState[criterion.label] = criterion;
                criteriaState[criterion.label].rendered = false;
                criteriaState[criterion.label].value = undefined;
            }

            // create new option element to criteria select
            if (createOption) {
                const newOption = new Option(criterion.label, criterion.label, false, false);
                $criteriaSelect.append(newOption);
            }
        });
    }

    // return initialized instance of searchModal
    return instance.init(config);
}
