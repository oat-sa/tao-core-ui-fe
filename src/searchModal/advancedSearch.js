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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA ;
 */

import $ from 'jquery';
import _ from 'lodash';
import advancedSearchTpl from 'ui/searchModal/tpl/advanced-search';
import textCriterionTpl from 'ui/searchModal/tpl/text-criterion';
import invalidCriteriaWarningTpl from 'ui/searchModal/tpl/invalid-criteria-warning';
import listCheckboxCriterionTpl from 'ui/searchModal/tpl/list-checkbox-criterion';
import listSelectCriterionTpl from 'ui/searchModal/tpl/list-select-criterion';
import highlightedTextTpl from 'ui/searchModal/tpl/highlighted-text';
import classLabelTpl from 'ui/searchModal/tpl/criteria-class-label';
import aliasTpl from 'ui/searchModal/tpl/criteria-alias';
import labelTpl from 'ui/searchModal/tpl/criteria-label';
import 'ui/searchModal/css/advancedSearch.css';
import component from 'ui/component';
import 'ui/modal';
import 'ui/datatable';
import 'select2';
import request from 'core/dataProvider/request';
import __ from 'i18n';

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
 * Creates advanced search component
 *
 * @param {object} config
 * @param {object} config.renderTo - DOM element where component will be rendered to
 * @param {string} config.advancedCriteria - advanced criteria to be set on component creation
 * @param {bool} config.hideCriteria - if the criteria must be hidden
 * @param {string} config.rootClassUri - rootClassUri to check for whitelist sections
 * @param {string} config.statusUrl - the URL to the status API (usually '/tao/AdvancedSearch/status')
 * @returns {advancedSearch}
 */
export default function advancedSearchFactory(config) {
    // Private properties to be easily accessible by instance methods
    let $container = null;
    let $addCriteria = null;
    let $addCriteriaInput = null;
    let $criteriaSelect = null;
    let $advancedCriteriaContainer = null;
    let $appliedFiltersSummary = null;
    let criteriaState = null;
    let criteriaMapping = {};
    const criteriaTypes = {
        text: 'text',
        list: 'list'
    };
    const criteriaLogic = {
        and: 'LOGIC_AND',
        or: 'LOGIC_OR',
        not: 'LOGIC_NOT'
    };

    let isAdvancedSearchStatusEnabled;
    let isCriteriaListUpdated = false;

    // Creates new component
    const instance = component({
        /**
         * Tells if the advanced search is enabled.
         * @returns {boolean}
         */
        isEnabled() {
            return !!isAdvancedSearchStatusEnabled;
        },

        /**
         * Request metadata (criteria) for the given uri
         * @param {string} classUri - url to make the reques to
         * @returns {Promise} - Request promise
         */
        updateCriteria(route) {
            if (!isAdvancedSearchStatusEnabled) {
                return Promise.resolve();
            }

            const $criteriaIcon = $addCriteria ? $('a span', $addCriteria).eq(0) : $();
            $criteriaIcon.toggleClass('icon-add').toggleClass('icon-loop');
            return request(route)
                .then(response => {
                    criteriaMapping = response.criteriaMapping || {};
                    const classTree = response.classDefinition ? response.classDefinition : response;
                    const criteria = formatCriteria(classTree);
                    updateCriteria(criteria);
                    isCriteriaListUpdated = true;
                    $criteriaIcon.toggleClass('icon-add').toggleClass('icon-loop');
                })
                .catch(e => {
                    instance.trigger('error', e);
                    throw e;
                });
        },
        /**
         * Access to component state
         * @returns {Object} - criteria state
         */
        getState() {
            return criteriaState;
        },
        /**
         * Removes every rendered criterion, updates criteria state accordingly
         * and removes classes applied to scrollable list of criteria
         */
        clear() {
            $advancedCriteriaContainer.removeClass(['scrollable', 'scroll-separator-top', 'scroll-separator-bottom']);
            $advancedCriteriaContainer.empty();
            updateAppliedFiltersSummary(0);
            // Rebuild selectable options: adding a criterion removes its <option>,
            // so Clear must restore them (searchModal recovers via class re-select + updateCriteria).
            if ($criteriaSelect && $criteriaSelect.length) {
                $criteriaSelect.find('option:not(:first-child)').remove();
            }
            _.forEach(criteriaState, criterion => {
                criterion.rendered = false;
                criterion.value = null;
                criterion.logic = null;
                if ($criteriaSelect && $criteriaSelect.length) {
                    $criteriaSelect.append(createCriteriaOption(criterion));
                }
            });
        },
        /**
         * Builds substring of search query with the advanced criteria conditions
         */
        getAdvancedCriteriaQuery(hasSearchInput) {
            const advancedSearchCriteria = _.filter(criteriaState, criterion => criterion.rendered === true);
            let query = '';

            advancedSearchCriteria.forEach(renderedCriterion => {
                const queryParam = renderedCriterion.propertyUri;
                if ((hasSearchInput || query.trim().length !== 0) && renderedCriterion.value) {
                    query += ' AND ';
                }
                if (renderedCriterion.type === criteriaTypes.text) {
                    if (renderedCriterion.value && renderedCriterion.value.trim() !== '') {
                        query += `${queryParam}:${renderedCriterion.value.trim()}`;
                    }
                } else if (renderedCriterion.type === criteriaTypes.list) {
                    if (renderedCriterion.value && renderedCriterion.value.length > 0) {
                        if (renderedCriterion.value.length === 1 && renderedCriterion.logic === criteriaLogic.not) {
                            //we have to pass NOT logic anyways, so add empty member to have NOT logic modifier in the query
                            renderedCriterion.value.push('');
                        }
                        query += renderedCriterion.value
                            .map(value => `${queryParam}:${value}`)
                            .join(` ${renderedCriterion.logic} `);

                        //we need to remove empty member from renderedCriterion.value because renderedCriterion can be reused after the query is done
                        renderedCriterion.value = renderedCriterion.value.filter(value => value !== '');
                    }
                }
            });

            return query;
        }
    })
        .setTemplate(config.layoutTemplate || advancedSearchTpl)
        .on('render', () => {
            initUiSelectors();
            initAddCriteriaSelector()
                .then(() => {
                    initCriteriaState();
                    instance.trigger('ready');
                })
                .catch(e => instance.trigger('error', e));
        });

    /**
     * Inits template selectors and scroll animation
     */
    function initUiSelectors() {
        $container = instance.getElement();
        $addCriteria = $('.add-criteria-container', $container);
        $addCriteria.addClass('disabled');
        $addCriteriaInput = $('.add-criteria-container a', $container);
        $criteriaSelect = $('.add-criteria-container select', $container);
        $advancedCriteriaContainer = $('.advanced-criteria-container', $container);
        $appliedFiltersSummary = $('.applied-filters-summary', $container);

        if (config.collapsibleCriteria && $appliedFiltersSummary.length) {
            $appliedFiltersSummary.off('click.advancedSearch').on('click.advancedSearch', function (e) {
                e.preventDefault();
                togglePreviousFilters();
            });
        }

        $advancedCriteriaContainer.on('scroll', _.throttle(animateScroll, 100));
    }

    /**
     * Lookup for characters in text to highlight
     * @param {String} text - text to lookup
     * @param {String} searchString - match to be applied in the text
     * @returns {String} - highlighted text
     */
    function highlightCharacter(text, searchString) {
        if (!searchString) {
            return text;
        }
        const reg = new RegExp(searchString, 'gi');
        return text.replace(reg, str => highlightedTextTpl({ text: str }));
    }

    /**
     * Inits select2 on criteria select and its UX logic
     */
    function initAddCriteriaSelector() {
        return request(instance.config.statusUrl)
            .then(function (response) {
                if (
                    config.hideCriteria ||
                    !response.enabled ||
                    (response.whitelist && response.whitelist.includes(config.rootClassUri))
                ) {
                    isAdvancedSearchStatusEnabled = false;
                    return;
                }
                isAdvancedSearchStatusEnabled = true;
                $addCriteria.removeClass('disabled');
                $criteriaSelect.select2({
                    containerCssClass: 'criteria-select2',
                    dropdownCssClass: 'criteria-dropdown-select2',
                    sortResults: results => sortBy(results, 'text'),
                    escapeMarkup: function (markup) {
                        return markup;
                    },
                    formatResult: function formatResult(result, container, query) {
                        const label = result.element[0].getAttribute('label');
                        const alias = result.element[0].getAttribute('alias');
                        const classLabel = result.element[0].getAttribute('class-label');

                        let html = labelTpl({ text: highlightCharacter(label, query.term) });

                        if (alias) {
                            html += aliasTpl({ text: alias });
                        }

                        if (classLabel) {
                            html += classLabelTpl({ text: classLabel });
                        }

                        return html;
                    }
                });

                // open dropdown when user clicks on add criteria input
                $addCriteriaInput.on('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const hasOptions =
                        $criteriaSelect.find('option').filter(function () {
                            return Boolean(this.value);
                        }).length > 0;
                    // Never open an empty select2 (mask-only / no results). Wait for ClassMetadata options.
                    if (!hasOptions) {
                        return;
                    }
                    isCriteriaListUpdated = true;
                    $criteriaSelect.select2('open');
                    // if dropdown is opened above addCriteria input, top property is slightly decreased to avoid overlapping with addCriteria icon
                    const $dropdown = $('.criteria-dropdown-select2');
                    if ($dropdown.hasClass('select2-drop-above')) {
                        const top = parseFloat($dropdown.css('top'));
                        if (!Number.isNaN(top)) {
                            $dropdown.css('top', `${top - 10}px`);
                        }
                    }
                });

                // when a criterion is selected add it to criteria container, remove it from dropdown options and reset select
                $criteriaSelect.on('change', () => {
                    const criterionToAdd = $criteriaSelect.children('option:selected').val();
                    addNewCriterion(criterionToAdd);
                    $criteriaSelect.children('option:selected').remove();
                    $criteriaSelect.select2('val', '');
                });
            })
            .catch(function (e) {
                return instance.trigger('error', e);
            });
    }

    /**
     * inits criteriaState loading it from the store (if present) or empty object.
     * If there is a stored criteriaState, those criteria that were rendered
     * but with null value are updated to not being rendered
     */
    function initCriteriaState() {
        if (instance.config.advancedCriteria) {
            _.forEach(instance.config.advancedCriteria, criterion => {
                if (criterion.rendered === true && criterion.value === null) {
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

        if (config.collapsibleCriteria) {
            wrapCriterionAsSpoiler($criterionContainer, criterion);
        }

        // set logic to remove criterion
        $criterionContainer.find('.icon-result-nok, .filter-spoiler-delete').on('click', { criterion }, removeCriterion);

        // set initial value and manage value changes
        bindCriterionValue(criterion, $criterionContainer);

        // update styles if scroll is enabled
        if ($advancedCriteriaContainer.get(0).scrollHeight > $advancedCriteriaContainer.outerHeight()) {
            $advancedCriteriaContainer.addClass('scrollable');
        }

        criterion.rendered = true;

        if (config.collapsibleCriteria) {
            reorganizeFilterLayout();
        }
    }

    /**
     * @returns {jQuery}
     */
    function getAllRenderedFilters() {
        return $advancedCriteriaContainer.children('.filter-container').not('.invalid-criteria-warning-container');
    }

    /**
     * @param {jQuery} $filter
     * @param {boolean} open
     */
    function setFilterSpoilerOpen($filter, open) {
        const $spoiler = $filter.find('.filter-spoiler').first();
        if (!$spoiler.length) {
            return;
        }
        $spoiler.toggleClass('is-open', open);
        $filter.find('.filter-spoiler-toggle').attr('aria-expanded', open);
        $spoiler
            .find('.filter-spoiler-icon')
            .toggleClass('icon-up', open)
            .toggleClass('icon-down', !open);
    }

    /**
     * @param {number} appliedCount
     * @returns {string}
     */
    function getAppliedFiltersSummaryText(appliedCount) {
        return appliedCount === 1 ? __('1 filter applied') : __('%s filters applied', String(appliedCount));
    }

    /**
     * Keeps each filter as its own spoiler card: newest expanded, previous collapsed (headers stay visible).
     */
    function reorganizeFilterLayout() {
        const $filters = getAllRenderedFilters();
        const count = $filters.length;

        updateAppliedFiltersSummary(count);

        if (count === 0) {
            return;
        }

        $filters.each(function (index) {
            setFilterSpoilerOpen($(this), index === count - 1);
        });

        if ($appliedFiltersSummary && $appliedFiltersSummary.length) {
            $appliedFiltersSummary.attr('aria-expanded', 'false');
        }
    }

    /**
     * Updates the "N filters applied" summary next to Add filter.
     * @param {number} appliedCount
     */
    function updateAppliedFiltersSummary(appliedCount) {
        if (!$appliedFiltersSummary || !$appliedFiltersSummary.length) {
            return;
        }

        if (appliedCount > 0) {
            $appliedFiltersSummary
                .text(getAppliedFiltersSummaryText(appliedCount))
                .removeClass('hidden')
                .prop('hidden', false);
        } else {
            $appliedFiltersSummary.addClass('hidden').prop('hidden', true).text('').attr('aria-expanded', 'false');
        }
    }

    /**
     * Toggles expand/collapse for all filters except the newest one.
     */
    function togglePreviousFilters() {
        const $filters = getAllRenderedFilters();
        if ($filters.length <= 1) {
            return;
        }

        const $previous = $filters.slice(0, -1);
        const anyOpen = $previous.filter(function () {
            return $(this).find('.filter-spoiler').first().hasClass('is-open');
        }).length > 0;
        const open = !anyOpen;

        $previous.each(function () {
            setFilterSpoilerOpen($(this), open);
        });

        if ($appliedFiltersSummary && $appliedFiltersSummary.length) {
            $appliedFiltersSummary.attr('aria-expanded', open);
        }
    }

    /**
     * Renders the new criterion selecting the appropiate handlebars template and prepending to advanced criteria container.
     * If criterion is of type list with a uri endpoint to request the options, select2 is also init
     * @param {object} criterion - criterion to render
     * @returns - the rendered container
     */
    function renderCriterion(criterion) {
        let templateToUse = null;
        if (criterion.type === criteriaTypes.text) {
            templateToUse = textCriterionTpl;
        } else if (criterion.type === criteriaTypes.list && criterion.uri) {
            templateToUse = listSelectCriterionTpl;
        } else {
            templateToUse = listCheckboxCriterionTpl;
        }

        $advancedCriteriaContainer.append(templateToUse({ criterion }));

        const $criterionContainer = $(`.${criterion.id}-filter`, $container);
        const valueMapping = criteriaMapping[criterion.type];

        /**
         * On criterion of type list with a uri endpoint to retrieve options, template includes a select
         * that is managed with select2, so we init it here
         */
        if (criterion.type === criteriaTypes.list && criterion.uri) {
            $(`input[name=${criterion.id}-select]`, $criterionContainer).select2({
                multiple: true,
                ajax: {
                    url: criterion.uri,
                    dataType: 'json',
                    data: function (term) {
                        return {
                            subject: term
                        };
                    },
                    results: response => ({
                        results: response.data.map(option => ({
                            id: valueMapping === 'uri' ? option.uri : option.label,
                            text: option.label
                        }))
                    })
                },
                initSelection: function (element, callback) {
                    const data = [];
                    $(element.val().split(',')).each(function () {
                        data.push({ id: this, text: this });
                    });
                    callback(data);
                }
            });
        }

        return $criterionContainer;
    }

    /**
     * Fetches initial criterion label from api in case the value mapping is uri
     * @param {object} criterion - criterion to be managed
     */
    function getInitialCriterionLabel(criterion) {
        const valueMapping = criteriaMapping[criterion.type];
        if (valueMapping !== 'uri' || !criterion.value) {
            return Promise.resolve({
                id: criterion.value,
                text: criterion.value
            });
        }
        return $.ajax({
            type: 'GET',
            url: criterion.uri,
            dataType: 'json'
        }).then(({ data }) => {
            if (Array.isArray(criterion.value)) {
                return criterion.value.map(v => ({
                    id: v,
                    text: (data.find(d => d.uri === v) || {}).label
                }));
            }
            let c = data.find(d => d.uri === criterion.value) || {};
            return {
                text: c.label,
                id: criterion.value
            };
        });
    }

    /**
     * Sets initial value for rendered criterion and sets binding between view and state
     * @param {object} criterion - criterion to be managed
     * @param {object} $criterionContainer - rendered criterion
     */
    function bindCriterionValue(criterion, $criterionContainer) {
        if (criterion.type === criteriaTypes.text) {
            // Bind synchronously so typing / Search right after Add filter is not lost
            // (getInitialCriterionLabel resolves on a microtask).
            $('input', $criterionContainer).val(criterion.value);
            $('input', $criterionContainer).on('input change', function () {
                criterion.value = $(this).val() || null;
            });
            return;
        }

        getInitialCriterionLabel(criterion).then(initialCriterion => {
            if (criterion.type === criteriaTypes.list && criterion.uri) {
                // set initial value
                if (criterion.value) {
                    $(`input[name=${criterion.id}-select]`, $criterionContainer).select2('data', initialCriterion);
                }
                criterion.logic = criterion.logic || criteriaLogic.and;
                $(`input[name="${criterion.id}-logic"][value="${criterion.logic}"]`, $criterionContainer).prop(
                    'checked',
                    true
                );
                // set event to bind input value to critariaState
                $(`input[name=${criterion.id}-select]`, $criterionContainer).on('change', event => {
                    criterion.value = event.val;
                });
                // set event to bind logic selector to critariaState
                $(`input[name="${criterion.id}-logic"]`, $criterionContainer).on('change', event => {
                    criterion.logic = event.target.value;
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
                        .map(element => element.value);
                });
            }
        });
    }

    /**
     * Wraps a rendered criterion in a collapsible spoiler (Resource Manager UX).
     * @param {jQuery} $criterionContainer
     * @param {object} criterion
     */
    function wrapCriterionAsSpoiler($criterionContainer, criterion) {
        let $deleteBtn = $criterionContainer.find('.icon-result-nok').first();
        if (!$deleteBtn.length) {
            $deleteBtn = $('<button>', {
                type: 'button',
                class: 'filter-spoiler-delete icon-bin',
                'aria-label': __('Remove criteria')
            });
        } else {
            $deleteBtn
                .attr('type', 'button')
                .removeClass('icon-result-nok')
                .addClass('filter-spoiler-delete icon-bin')
                .attr('aria-label', __('Remove criteria'));
        }
        const $title = $('<span>', { class: 'filter-spoiler-title', text: criterion.label });
        const $icon = $('<span>', { class: 'icon-up filter-spoiler-icon', 'aria-hidden': 'true' });
        const $toggle = $('<button>', {
            type: 'button',
            class: 'filter-spoiler-toggle',
            'aria-expanded': 'true'
        }).append($title, $icon);

        const $header = $('<div>', { class: 'filter-spoiler-header' }).append($toggle, $deleteBtn);

        const $body = $('<div>', { class: 'filter-spoiler-body' });
        $criterionContainer.children().appendTo($body);

        const $spoiler = $('<div>', { class: 'filter-spoiler is-open' }).append($header, $body);
        $criterionContainer.empty().append($spoiler);
        $criterionContainer.addClass('filter-spoiler-wrapper');

        $toggle.on('click', function (e) {
            e.preventDefault();
            const $spoilerEl = $criterionContainer.find('.filter-spoiler').first();
            const open = $spoilerEl.toggleClass('is-open').hasClass('is-open');
            $(this).attr('aria-expanded', open);
            $spoilerEl
                .find('.filter-spoiler-icon')
                .toggleClass('icon-up', open)
                .toggleClass('icon-down', !open);
        });
    }

    /**
     * Removes a criterion from advanced criteria container when user clicks on the criterion close icon.
     * It also adds the option element to criteria select so removed criterion can be rendered again
     * @param {object} event - click event triggered on closing icon
     */
    function removeCriterion(event) {
        const criterion = event.data.criterion;
        const newOption = createCriteriaOption(criterion);
        const criterionKey = getCriterionStateId(criterion);

        // remove criterion and append new criterion to select options
        $(this).closest('.filter-container').remove();
        $criteriaSelect.append(newOption);

        // reset criterion values on criteriaState
        criteriaState[criterionKey].rendered = false;
        criteriaState[criterionKey].value = null;

        // check if advanced criteria container is no longer scrollable
        if ($advancedCriteriaContainer.get(0).scrollHeight <= $advancedCriteriaContainer.outerHeight()) {
            $advancedCriteriaContainer.removeClass('scrollable');
        }

        if (config.collapsibleCriteria) {
            reorganizeFilterLayout();
        }
    }

    /**
     * Parses received criteria from BE to the data structure required for criteria selector. To do so,
     * appends every criterion into criteria array and then returns a duplicate-free version of it
     * considering label property as uniqueness criterion
     * @param {Array} classes - array of classes with the metadata (aka criteria) for each one of them
     * @returns {Array} - criteria array
     */
    function formatCriteria(classTree) {
        let criteria = [];

        _.forEach(classTree, classInstance => {
            const metadata = classInstance && classInstance.metadata;
            if (Array.isArray(metadata) && metadata.length) {
                criteria.push(...metadata);
            }
        });

        // extends each criterion with an id that can be use as a valid css class
        criteria = criteria.filter(criterion => {
            const id = String((criterion && criterion.propertyUri) || '').replace(/^[^a-zA-Z]*|[^a-zA-Z0-9]*/g, '');
            if (!id) {
                return false;
            }
            criterion.label = getCriterionLabel(criterion);
            criterion.id = id;
            return true;
        });

        return criteria;
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
        if (config.collapsibleCriteria) {
            reorganizeFilterLayout();
        }
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
            const oldCriterionKey = getCriterionStateId(oldCriterion);

            if (deprecatedCriterion) {
                if (criteriaState[oldCriterionKey].rendered) {
                    $advancedCriteriaContainer.find(`.${oldCriterion.id}-filter`).remove();
                    invalidCriteria.push(oldCriterion.label);
                }
                delete criteriaState[oldCriterionKey];
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
            const criteriaStateId = getCriterionStateId(criterion);

            // if new criterion was already on criteriaState and had to be rendered, we avoid creating an option for it and render it if it was not
            if (criteriaState[criteriaStateId] && criteriaState[criteriaStateId].rendered === true) {
                createOption = false;

                if ($advancedCriteriaContainer.find(`.${criterion.id}-filter`).length === 0) {
                    addNewCriterion(criteriaStateId);
                }
            } else {
                // if new criterion was not on criteriaState we add it
                criteriaState[criteriaStateId] = criterion;
                criteriaState[criteriaStateId].rendered = false;
                criteriaState[criteriaStateId].value = null;
            }

            // create new option element to criteria select
            if (createOption) {
                $criteriaSelect.append(createCriteriaOption(criterion));
            }
        });
    }

    /**
     * Creates a new option element
     * with attributes to use in select2 markup
     * @param {Object} criterion
     * @returns {HTMLOptionElement} Single option criteria
     */
    function createCriteriaOption(criterion) {
        const label = criterion.label;
        let classLabel = '';
        let alias = '';
        let option;

        if (criterion.isDuplicated) {
            classLabel = criterion.class.label || '';
            alias = criterion.alias || '';
        }

        option = new Option(label, getCriterionStateId(criterion), false, false);

        option.setAttribute('label', label);
        option.setAttribute('alias', alias);
        option.setAttribute('class-label', classLabel);

        return option;
    }

    /**
     * @param {Object} criterion
     * @returns String
     */
    function getCriterionStateId(criterion) {
        return criterion.propertyUri;
    }

    /**
     * @param {Object} criterion
     * @returns String
     */
    function getCriterionLabel(criterion) {
        return criterion.label;
    }

    // return initialized instance of searchModal
    return instance.init(config);
}
