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
 * Copyright (c) 2015-2020 (original work) Open Assessment Technologies SA;
 */

import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import Pluginifier from 'core/pluginifier';
import layout from 'ui/datatable/tpl/layout';
import filterStrategyFactory from 'ui/datatable/filterStrategy/filterStrategy';
import paginationComponent from 'ui/pagination';
import loadingBar from 'layout/loading-bar';
import loggerFactory from 'core/logger';
import httpErrorParser from 'util/httpErrorParser';
import pageSizeSelector from 'ui/pageSizeSelector';
import 'ui/datatable/css/datatable.css';
import DOMPurify from 'lib/dompurify/purify';

var ns = 'datatable';

var dataNs = 'ui.' + ns;

var defaults = {
    atomicUpdate: false,
    start: 0,
    rows: 25,
    page: 1,
    sortby: 'id',
    sortorder: 'asc',
    sorttype: 'string',
    paginationStrategyTop: 'none',
    paginationStrategyBottom: 'simple',
    labels: {
        filter: __('Filter'),
        empty: __('Nothing to list!'),
        available: __('Available'),
        loading: __('Loading'),
        actions: __('Actions')
    },
    pageSizeSelector: false
};

var logger = loggerFactory('ui/datatable');

/**
 * The CSS class used to hide an element
 * @type {String}
 */
var hiddenCls = 'hidden';

/**
 * Deactivate pagination's
 */
var disablePaginations = function disablePaginations(paginations) {
    if (paginations && paginations.length) {
        _.forEach(paginations, function(pagination) {
            pagination.disable();
        });
    }
};

/**
 * Activate pagination's
 */
var enablePaginations = function enablePaginations(paginations) {
    if (paginations && paginations.length) {
        _.forEach(paginations, function(pagination) {
            pagination.enable();
        });
    }
};

/**
 *  Helper for reading actions value in context
 *
 * @param {String} property
 * @param {Object} action
 * @param {Object} context
 */
const getPropertyValue = (property, action, context) => {
    const key = action[property];

    return _.isFunction(key) ? key.apply(context) : key;
};

/**
 * Update the data table status in the header
 *
 * @param {Object} options
 * @param {jQueryElement} $container
 * @param {Object} dataset
 */
const updateHeaderStatus = (options, $container, dataset) => {
    if (!options.status) {
        return;
    }

    const $statusEmpty = $container.find('.empty-list');
    const $statusAvailable = $container.find('.available-list');
    const $statusCount = $statusAvailable.find('.count');

    $container.find('.loading').addClass(hiddenCls);

    // when the status is enabled, the response must contain the total amount of records
    const amount = dataset.amount || dataset.length;

    if (amount) {
        $statusCount.text(amount);
        $statusAvailable.removeClass(hiddenCls);
        $statusEmpty.addClass(hiddenCls);
    } else {
        $statusEmpty.removeClass(hiddenCls);
        $statusAvailable.addClass(hiddenCls);
    }
};

/**
 * The dataTable component makes you able to browse items and bind specific
 * actions to undertake for edition and removal of them.
 *
 * Parameters that will be send to backend by component:
 *
 * Pagination
 * @param {Number} rows - count of rows, that should be returned from backend, in other words limit.
 * @param {Number} page - number of page, that should be requested.
 *
 * Sorting
 * @param {String} sortby - name of column
 * @param {String} sortorder - order of sorting, can be 'asc' or 'desc' for ascending sorting and descending sorting respectively.
 * @param {String} sorttype - type of sorting, can be 'string' or 'numeric' for proper sorting numeric and string values.
 *
 * Filtering
 * @param {String} filterstrategy - filtering strategy. Default is single (see ui/datatable/filterStrategy/single.js).
 * @param {String} filterquery - query string for filtering of rows.
 * @param {String[]} filtercolumns[] - array of columns, in which will be implemented search during filtering process.
 * For column filter it will be only one item with column name, but component has ability define list of columns for default filter (in top toolbar).
 * Backend should correctly receive this list of columns and do search in accordance with this parameters.
 * By default, columns are not defined, so this parameter not will be sent. If filtercolumns[] not exists, backend should search by all columns.
 *
 * @example of query (GET): rows=25&page=1&sortby=login&sortorder=asc&filterquery=loginame&filtercolumns[]=login
 *
 * @exports ui/datatable
 */
var dataTable = {
    /**
     * Initialize the plugin.
     *
     * Called the jQuery way once registered by the Pluginifier.
     * @example $('selector').datatable([], {});
     *
     * @constructor
     * @param {Object} options - the plugin options.
     * @param {String} options.url - the URL of the service used to retrieve the resources.
     * @param {Object[]} options.model - the model definition.
     * @param {Function} options.actions.xxx - the callback function for items xxx, with a single parameter representing the identifier of the items.
     * @param {Function} options.listeners.xxx - the callback function for event xxx, parameters depends to event trigger call.
     * @param {Boolean} options.selectable - enables the selection of rows using checkboxes.
     * @param {Boolean} options.rowSelection - enables the selection of rows by clicking on them.
     * @param {Object} options.tools - a list of tool buttons to display above the table.
     * @param {Object|Boolean} options.status - allow to display a status bar.
     * @param {Object|Boolean} options.filter - allow to display a filter bar.
     * @param {String} options.filterStrategy - 'multiple' | 'single'  -- filtered by all filters together or filtering allowed only by one field at the moment (default 'single'),
     * @param {String} options.filterSelector - css selector for search of filter inputs, by defaul 'select, input'
     * @param {String} options.filterTransform - transform filter value before send to server.
     * @param {String[]} options.filter.columns - a list of columns that will be used for default filter. Can be overridden by column filter.
     * @param {String} options.filterquery - a query string for filtering, using only in runtime.
     * @param {String[]} options.filtercolumns - a list of columns, in that should be done search, using only in runtime.
     * @param {String} options.paginationStrategyTop  - 'none' | 'pages' | 'simple' -- 'none' by default (next/prev), 'pages' show pages and extended control for pagination
     * @param {String} options.paginationStrategyBottom  - 'none' | 'pages' | 'simple' -- 'simple' by default (next/prev), 'pages' show pages and extended control for pagination
     * @param {Object} options.labels - list of labels in datatable interface, that can be overridden by incoming options
     * @param {String} options.emptyText - text that will be shown when no data found for showing in the grid.
     * @param {Boolean} options.pageSizeSelector - flag that indicates if control for changing page size should be displayed
     * @param {Boolean} options.atomicUpdate - allowed to keep the datatable state to be able on "render" event, compare with new state and atomically update the table cells.
     * @param {Object} [data] - inject predefined data to avoid the first query.
     * @fires dataTable#create.datatable
     * @returns {jQueryElement} for chaining
     */
    init: function (options, data) {
        options = _.defaults(options, defaults);

        return this.each(function () {
            var $elt = $(this);
            var currentOptions = $elt.data(dataNs);

            if (options.atomicUpdate && data) {
                $elt.data(`${dataNs}state`,  data.data);
            }
            // implement encapsulated pages for the datatable
            $elt.paginations = [];

            if (!currentOptions) {
                //add data to the element
                $elt.data(dataNs, options);

                $elt.one('load.' + ns, function() {
                    /**
                     * @event dataTable#create.datatable
                     */
                    $elt.trigger('create.' + ns);
                });

                if (data) {
                    dataTable._render($elt, data);
                } else {
                    dataTable._query($elt);
                }
            } else {
                // update existing options
                $elt.data(dataNs, _.merge(currentOptions, options));

                dataTable._refresh($elt, data);
            }
        });
    },

    /**
     * Refresh the data table using current options
     *
     * Called the jQuery way once registered by the Pluginifier.
     * @example $('selector').datatable('refresh');
     *
     * @param {jQueryElement} $elt - plugin's element
     * @param {Object} [data] - Data to render immediately, prevents the query to be made.
     */
    _refresh: function($elt, data) {
        if (data) {
            this._render($elt, data);
        } else {
            this._query($elt);
        }
    },

    /**
     * Query the server for data and load the table.
     *
     * @private
     * @param {jQueryElement} $elt - plugin's element
     * @param $filter
     * @fires dataTable#query.datatable
     */
    _query: function($elt, $filter) {
        var self = this;
        var options = $elt.data(dataNs);
        var parameters;
        var ajaxConfig;

        loadingBar.start();

        if (!$filter) {
            $filter = $('.filter', $elt);
        }
        options = _.assign({}, options, this._getFilterStrategy($elt).getQueryData($elt, $filter, options));
        parameters = _.merge(
            {},
            _.pick(options, ['rows', 'page', 'sortby', 'sortorder', 'sorttype', 'filterquery', 'filtercolumns']),
            options.params || {}
        );
        ajaxConfig = {
            url: options.url,
            data: parameters,
            dataType: 'json',
            type: options.querytype || 'GET'
        };

        // disable pagination to not press multiple on it
        disablePaginations($elt.paginations);

        /**
         * @event dataTable#query.datatable
         * @param {Object} ajaxConfig - The config object used to setup the AJAX request
         */
        $elt.trigger('query.' + ns, [ajaxConfig]);

        // display the loading state
        if (options.status) {
            $elt.find('.loading').removeClass(hiddenCls);
        }

        $.ajax(ajaxConfig)
            .done(function(response) {
                self._render($elt, response);
            })
            .fail(function(response, option, err) {
                var requestErr = httpErrorParser.parse(response, option, err);
                logger.error(requestErr.message);
                requestErr.code = response.status;
                enablePaginations(this.paginations);
                $elt.trigger('error.' + ns, [requestErr]);

                self._render($elt, {});
            });
    },

    /**
     * Renders the table using the provided data set
     *
     * @param {jQueryElement} $elt - plugin's element
     * @param {Object} dataset - the data set to render
     * @private
     * @fires dataTable#beforeload.datatable
     * @fires dataTable#load.datatable
     */
    _render($elt, dataset = {}) {
        var self = this;
        var options = _.cloneDeep($elt.data(dataNs));
        var $rendering;
        var $sortBy;
        var $sortElement;
        var $checkAll;
        var $checkboxes;
        var $massActionBtns = $();
        var $rows;
        var model = [];

        /**
         * @event dataTable#beforeload.datatable
         * @param {Object} dataset - The data set object used to render the table
         */
        $elt.trigger('beforeload.' + ns, [_.cloneDeep(dataset)]);
        
        // overrides column options
        _.forEach(options.model, function(field, key) {
            if (!options.filter) {
                field.filterable = false;
            }

            if (_.isUndefined(field.order)) {
                field.order = key + 1;
            }

            if (field.filterable && typeof field.filterable !== 'object') {
                field.filterable = { placeholder: __('Filter') };
            }


            if (typeof field.visible === 'undefined') {
                model.push(field);
            } else if (typeof field.visible === 'function' && field.visible()) {
                model.push(field);
            } else if (field.visible === true) {
                model.push(field);
            }
        });

        model.sort(function (a, b) {
            return a.order - b.order;
        });

        if (options.sortby) {
            options = this._sortOptions($elt, options.sortby, options.sortorder, options.sorttype);
        }

        // process data by model rules
        if (_.some(model, 'transform')) {
            const transforms = _.where(model, 'transform');

            _.forEach(dataset.data, (row, index) => {
                _.forEach(transforms, (field) => {
                    if(_.isFunction(field.transform)){
                        row[field.id] = field.transform(row[field.id], row, field, index, dataset.data);
                    }
                });
            });
        }

        options.model = model;

        if (options.atomicUpdate) {
            const skipForceUpdate = this._shallowUpdate($elt, dataset, options);

            if (skipForceUpdate) {
                updateHeaderStatus(options, $elt, dataset);
                loadingBar.stop();
                $elt.trigger('load.' + ns, [dataset]);
                return;
            }
        }

        // Call the rendering
        $rendering = $(layout({ options: options, dataset: dataset }));

        // the readonly property contains an associative array where keys are the ids of the items (lines)
        // the value can be a boolean (true for disable buttons, false to enable)
        // it can also bo an array that let you disable/enable the action you want
        // readonly = {
        //  id1 : {'view':true, 'delete':false},
        //  id2 : true
        //}
        _.forEach(dataset.readonly, function (values, id) {
            if (values === true) {
                $('[data-item-identifier="' + id + '"] button', $rendering).addClass('disabled');
            } else if (values && typeof values === 'object') {
                for (var action in values) {
                    if (values.hasOwnProperty(action) && values[action] === true) {
                        $('[data-item-identifier="' + id + '"] button.' + action, $rendering).addClass('disabled');
                    }
                }
            }
        });

        var attachActionListeners = function attachActionListeners(actions) {
            // Attach a listener to every action button created
            _.forEach(actions, function (action) {
                const css = `.${action.id}`
                const handler = action.action;

                $rendering.off('click', css).on('click', css, function (e) {
                    e.preventDefault();

                    const $btn = $(this);

                    if (!$btn.hasClass('disabled')) {
                        const identifier = $btn.closest('[data-item-identifier]').data('item-identifier');

                        if (_.isFunction(handler)) {
                            handler.apply($btn, [identifier, _.first(_.where(dataset.data, { id: identifier }))]);
                        }
                    }
                });
            });
        };

        if (options.actions) {
            attachActionListeners(options.actions);
        }

        // Attach listeners to model.type = action
        if (_.some(options.model, 'type')) {
            var types = _.where(options.model, 'type');
            _.forEach(types, function (field) {
                if (field.type === 'actions' && field.actions) {
                    attachActionListeners(field.actions);
                }
            });
        }

        // Attach a listener to every tool button created
        _.forEach(options.tools, function (tool, name) {
            const isMassAction = tool.massAction;
            const css = `.tool-${tool.id || name}`;
            const action = tool.action;

            if (isMassAction) {
                $massActionBtns = $massActionBtns.add($rendering.find(css));
            }

            $rendering.off('click', css).on('click', css, function (e) {
                e.preventDefault();
                const $btn = $(this);

                if (!$btn.hasClass('disabled') && _.isFunction(action)) {
                    action.apply($btn, [self._selection($elt)]);
                }
            });
        });

        // bind listeners to events
        _.forEach(options.listeners, function (callback, event) {
            var ev = [event, ns].join('.');
            $elt.off(ev).on(ev, callback);
        });

        function renderPagination($container, mode) {
            return paginationComponent({
                mode: mode,
                activePage: dataset.page,
                totalPages: dataset.total
            })
                .on('change', function () {
                    self._setPage($elt, this.getActivePage());
                })
                .on('prev', function () {
                    /**
                     * @event dataTable#backward.dataTable
                     */
                    $elt.trigger('backward.' + ns);
                })
                .on('next', function () {
                    /**
                     * @event dataTable#forward.dataTable
                     */
                    $elt.trigger('forward.' + ns);
                })
                .render($container);
        }

        $elt.paginations = [];
        if (options.paginationStrategyTop !== 'none') {
            // bind pagination component to the datatable
            $elt.paginations.push(
                renderPagination($('.datatable-pagination-top', $rendering), options.paginationStrategyTop)
            );
        }
        if (options.paginationStrategyBottom !== 'none') {
            // bind pagination component to the datatable
            $elt.paginations.push(
                renderPagination($('.datatable-pagination-bottom', $rendering), options.paginationStrategyBottom)
            );
        }
        disablePaginations($elt.paginations);

        // Now $rendering takes the place of $elt...
        $rows = $rendering.find('tbody tr');

        $sortBy = $rendering.find('th [data-sort-by]');
        $sortElement = $rendering.find('[data-sort-by="' + options.sortby + '"]');
        $checkAll = $rendering.find('th.checkboxes input');
        $checkboxes = $rendering.find('td.checkboxes input');

        if (options.rowSelection) {
            $('table.datatable', $rendering).addClass('hoverable');
            $rendering.on('click', 'tbody td', function (e) {
                // exclude from processing columns with actions
                if ($(e.target).hasClass('checkboxes') || $(e.target).hasClass('actions')) {
                    return false;
                }

                var currentRow = $(this).parent();

                $rows.removeClass('selected');
                currentRow.toggleClass('selected');

                $elt.trigger('selected.' + ns, _.where(dataset.data, { id: currentRow.data('item-identifier') }));
            });
        }

        $sortBy.on('click keyup', function (e) {
            var column, type;
            if (e.type === 'keyup' && e.keyCode !== 13) {
                return;
            }
            e.preventDefault();
            column = $(this).data('sort-by');
            type = $(this).data('sort-type');

            self._sort($elt, column, undefined, type);
        });

        // Add the filter behavior
        if (options.filter) {
            self._getFilterStrategy($elt).render($rendering, options);
            _.forEach($('.filter', $rendering), function (filter) {
                var $filter = $(filter);
                var $filterBtn = $('button', $filter);
                var $filterInput = $('select, input', $filter);

                if ($filterInput.is('select')) {
                    $filterInput.on('change', function () {
                        self._filter($elt, $filter);
                    });
                } else {
                    // clicking the button trigger the request
                    $filterBtn.off('click').on('click', function (e) {
                        e.preventDefault();
                        self._filter($elt, $filter);
                    });

                    // or press ENTER
                    $filterInput.off('keypress').on('keypress', function (e) {
                        if (e.which === 13) {
                            e.preventDefault();
                            self._filter($elt, $filter);
                        }
                    });
                }
            });
        }

        // check/uncheck all checkboxes
        $checkAll.click(function () {
            if (this.checked) {
                $checkAll.prop('checked', true);
                $checkboxes.prop('checked', true);
            } else {
                $checkAll.prop('checked', false);
                $checkboxes.prop('checked', false);
            }

            if ($massActionBtns.length) {
                $massActionBtns.toggleClass('invisible', !$checkboxes.filter(':checked').length);
            }

            /**
             * @event dataTable#select.dataTable
             */
            $elt.trigger('select.' + ns);
        });

        // when check/uncheck a box, toggle the check/uncheck all
        $checkboxes.click(function () {
            var $checked = $checkboxes.filter(':checked');
            if ($checked.length === $checkboxes.length) {
                $checkAll.prop('checked', true);
            } else {
                $checkAll.prop('checked', false);
            }

            if ($massActionBtns.length) {
                $massActionBtns.toggleClass('invisible', !$checkboxes.filter(':checked').length);
            }

            /**
             * @event dataTable#select.dataTable
             */
            $elt.trigger('select.' + ns);
        });

        // Remove sorted class from all th
        $('th.sorted', $rendering).removeClass('sorted');
        // Add the sorted class to the sorted element and the order class
        $sortElement.addClass('sorted').addClass('sorted_' + options.sortorder);

        // Update the status

        updateHeaderStatus(options, $rendering, dataset);

        $elt.html($rendering);

        // if the filter is enabled and a value is present, set the focus on the input field
        if (options.filter && options.filterquery) {
            $rendering.find('[name=filter].focused').focus();
        }

        // restore pagination's after data loaded
        enablePaginations($elt.paginations);

        if (options.pageSizeSelector) {
            pageSizeSelector({
                renderTo: $('.toolbox-container', $rendering),
                defaultSize: options.rows
            }).on('change', function (val) {
                self._setRows($elt, val);
            });
        }

        loadingBar.stop();

        /**
         * @event dataTable#load.dataTable
         * @param {Object} dataset - The data set used to render the table
         */
        $elt.trigger('load.' + ns, [dataset]);
    },

    /**
     * Query set new page
     *
     * @param $elt
     * @param page
     * @fires dataTable#setpage.datatable
     */
    _setPage: function _setPage($elt, page) {
        var options = $elt.data(dataNs);
        if (options.page !== page) {
            // set new page value
            options.page = page;

            //rebind options to the elt
            $elt.data(dataNs, options);

            /**
             * @event dataTable#setpage.dataTable
             */
            $elt.trigger('setpage.' + ns);

            // Call the query
            this._query($elt);
        }
    },

    /**
     * Query filtered list of items
     *
     * @param {jQueryElement} $elt - plugin's element
     * @param {jQueryElement} $filter - the filter input
     * @fires dataTable#filter.datatable
     * @fires dataTable#sort.datatable
     * @private
     */
    _filter: function _filter($elt, $filter) {
        var options = $elt.data(dataNs);
        var filtersData = this._getFilterStrategy($elt).getFiltersData($elt, $filter, options);
        options.page = 1;
        $elt.data(dataNs, _.assign(options, filtersData));

        /**
         * @event dataTable#filter.datatable
         * @param {Object} options - The options list
         */
        $elt.trigger('filter.' + ns, [options]);

        // Call the query
        this._query($elt, $filter);
    },

    _getFilterStrategy: function _getFilterStrategy($elt) {
        var options = $elt.data(dataNs);
        return filterStrategyFactory(options);
    },

    /**
     * Query the previous page
     *
     * Called the jQuery way once registered by the Pluginifier.
     * @example $('selector').datatable('sort', 'firstname', false);
     *
     * @param {jQueryElement} $elt - plugin's element
     * @param {String} sortBy - the model id of the col to sort
     * @param {Boolean} [asc] - sort direction true for asc of deduced
     * @param {String} sortType - type of sorting, numeric or string
     * @fires dataTable#sort.datatable
     */
    _sort: function ($elt, sortBy, asc, sortType) {
        var options = this._sortOptions($elt, sortBy, asc, sortType);

        /**
         * @event dataTable#sort.datatable
         * @param {String} column - The name of the column to sort
         * @param {String} direction - The sort direction
         * @param {String} type - The type of sorting field, string or numeric
         */
        $elt.trigger('sort.' + ns, [options.sortby, options.sortorder, options.sorttype]);

        this._query($elt);
    },

    /**
     * Compared current and next number of row and identifiers order of rows.
     *
     * @param {dataset} currentState
     * @param {dataset} nextState
     * @returns {Boolean}
     */
    _canApplyShallowUpdate(currentState, nextState) {
        const isStatesHasData = _.has(currentState, 'data') && _.has(nextState, 'data');

        if (!isStatesHasData) {
            return false;
        }

        const currentData = currentState.data;
        const nextData = nextState.data;

        if (currentData.length !== nextData.length) {
            return false;
        }

        return _.isEqual(
            currentData.map(data => data.id),
            nextData.map(data => data.id)
        );
    },

    /**
     * Check possibility of atomic update data in datatable.
     *
     * @param {jQueryElement} $container Data table container element
     * @param {Object} nextState Data to be set to the data table
     * @param {Object} options Data table options
     * @returns {Boolean} Return true when data in table can be atomically updated
     */
    _shallowUpdate($container, nextState, options) {
        const currentState = $container.data(`${dataNs}state`);

        // Always update data state
        $container.data(`${dataNs}state`, nextState);

        if (!this._canApplyShallowUpdate(currentState, nextState)) {
            return;
        }

        nextState.data.forEach((nextData, index) => {
            const $row = $container.find(`tr[data-item-identifier="${nextData.id}"]`);

            options.model.forEach(model => {
                const cellId = model.id;

                if (model.type) {
                    const $actionCell = $row.find(`td.actions.${cellId}`);

                    $actionCell.html('');

                    model.actions.forEach(action => {
                        const actionId = action.id;

                        if (actionId) {
                            const hidden = getPropertyValue('hidden', action, nextData);
                            const title = getPropertyValue('title', action, nextData);
                            const disabled = getPropertyValue('disabled', action, nextData);
                            const icon = getPropertyValue('icon', action, nextData);
                            const label = getPropertyValue('label', action, nextData);

                            if (!hidden) {
                                const $actionButton = $('<button>', {
                                    class: `btn-info small ${actionId}`,
                                    html: `${icon ? `<span class="icon-${icon}"></span>` : ''}${label || ''}`
                                });

                                if (title) {
                                    $actionButton.attr('title', title);
                                }

                                if (disabled) {
                                    $actionButton.attr('disabled', 'disabled');
                                }

                                $actionCell.append('\n').append($actionButton);
                            }
                        } else {
                            const title = getPropertyValue('title', action, nextData);
                            const icon = getPropertyValue('icon', action, nextData);
                            const label = getPropertyValue('label', action, nextData);

                            const $actionButton = $('<button>', {
                                class: `btn-info small ${actionId}`,
                                html: `${icon ? `<span class="icon-${icon}"></span>` : ''}${label || ''}`
                            });

                            if (title) {
                                $actionButton.attr('title', title);
                            }

                            $actionCell.append('\n').append($actionButton);
                        }
                    });
                } else {
                    const nextContent = nextData[cellId];

                    $row.find(`td.${cellId}`).html(DOMPurify.sanitize(nextContent));
                }
            });
        });

        return true;
    },

    /**
     * Set the sort options.
     *
     * @param {jQueryElement} $elt - plugin's element
     * @param {String} sortBy - the model id of the col to sort
     * @param {Boolean|String} [asc] - sort direction true for asc of deduced
     * @param {String} sortType - sorting type, numeric or string sorting
     * @returns {Object} - returns the options
     * @private
     */
    _sortOptions: function($elt, sortBy, asc, sortType) {
        var options = $elt.data(dataNs);

        if (typeof asc !== 'undefined') {
            if ('asc' !== asc && 'desc' !== asc) {
                asc = !!asc ? 'asc' : 'desc';
            }
            options.sortorder = asc;
        } else if (options.sortorder === 'asc' && options.sortby === sortBy) {
            // If I already sort asc this element
            options.sortorder = 'desc';
        } else {
            // If I never sort by this element or
            // I sort by this element & the order was desc
            options.sortorder = 'asc';
        }

        // Change the sorting element anyway.
        options.sortby = sortBy;

        // define sorting type
        options.sorttype = sortType;

        //rebind options to the elt
        $elt.data(dataNs, options);

        return _.cloneDeep(options);
    },

    /**
     * Gets the selected items. Returns an array of identifiers.
     *
     * @param {jQueryElement} $elt - plugin's element
     * @returns {Array} - Returns an array of identifiers.
     */
    _selection: function($elt) {
        var $selected = $elt.find('[data-item-identifier]').has('td.checkboxes input:checked');
        var selection = [];

        $selected.each(function() {
            selection.push($(this).data('item-identifier'));
        });

        return selection;
    },

    _highlightRows($elt, rowIds) {
        $elt.find('[data-item-identifier]').removeClass('highlight');

        rowIds.forEach(rowId => {
            this._highlightRow($elt, rowId);
        });
    },
    /**
     * Highlight the row with identifier
     *
     * @param $elt
     * @param rowId
     * @deprecated Use highlightRows instead
     */
    _highlightRow: function($elt, rowId) {
        this._addRowClass($elt, rowId, 'highlight');
    },

    /**
     * Css class add to the row with id
     *
     * @param $elt
     * @param rowId
     * @param className
     * @private
     */
    _addRowClass: function($elt, rowId, className) {
        var $row = $elt.find('[data-item-identifier="' + rowId + '"]');

        if (!$row.hasClass(className)) {
            $row.addClass(className);
        }
    },

    /**
     * Css class remove from the row with id
     *
     * @param $elt
     * @param rowId
     * @param className
     * @private
     */
    _removeRowClass: function($elt, rowId, className) {
        var $row = $elt.find('[data-item-identifier="' + rowId + '"]');

        if ($row.hasClass(className)) {
            $row.removeClass(className);
        }
    },

    /**
     * Update amount items per page
     *
     * @param $elt
     * @param rows
     * @fires dataTable#setpage.datatable
     */
    _setRows($elt, rows) {
        var options = $elt.data(dataNs);

        if (options.rows !== rows) {
            // set new amount of items per page
            options.rows = rows;

            // set page to the first one
            options.page = 1;

            //rebind options to the elt
            $elt.data(dataNs, options);

            /**
             * @event dataTable#setpage.dataTable
             */
            $elt.trigger('setpage.' + ns);

            // Call the query
            this._query($elt);
        }
    }
};

Pluginifier.register(ns, dataTable, {
    expose: [
        'refresh',
        'sort',
        'filter',
        'selection',
        'render',
        'highlightRow',
        'highlightRows',
        'addRowClass',
        'removeRowClass'
    ]
});
