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
 * Dashboard component to display metricts in pass/fail way
 *
 * @example
 *    dashboard({
 *        data: [
 *                  {
 *                      title: 'Virtual machine version:',
 *                      score: 100,
 *                      info: [
 *                          { text: 'Version: XXXXXX' },
 *                      ]
 *                  },
 *                  {
 *                      title: 'Disk & DB space:',
 *                      score: 65,
 *                      info: [
 *                          { text: 'Disk: X of X used' },
 *                          { text: 'DB: X of X used' },
 *                      ],
 *                  },
 *                  {
 *                      title: 'Connectivity:',
 *                      score: 32,
 *                      info: [
 *                          { text: 'Download: 80 MBit/s' },
 *                          { text: 'Upload: 72 MBit/s' },
 *                          { text: 'Synchronization would take 03m30s' },
 *                      ]
 *                  },
 *              ],
 *        renderTo: '#visual-test'
 *    });
 *
 * @author Anton Tsymuk <anton@taotesting.com>
 */
import __ from 'i18n';
import _ from 'lodash';
import component from 'ui/component';
import dashboardTpl from 'ui/dashboard/tpl/dashboard';
import metricsListTpl from 'ui/dashboard/tpl/dashboardMetricsList';
import 'ui/dashboard/css/dashboard.css';

var defaults = {
    headerText: __('Outlook on the next Synchronization'),
    loadingText: __('Creating report ...'),
    warningText: __('Please contact your system administrator.'),
    loading: false, // should display loading screen
    data: [], // metricts that should be displayed
    scoreState: {
        // score borders of different metrics states
        error: 32,
        warn: 65
    },
    layoutType: 'tiles'
};

/**
 * Dashboard component to display metricts in pass/fail way
 *
 * @param {Object} $container
 * @param {Object} config
 * @param {String} [config.headerText]
 * @param {String} [config.loadingText]
 * @param {String} [config.warningText]
 * @param {Boolean} [config.loading] - should display loading screen
 * @param {string} [config.layoutType] - Type of the component layout. Possible values: 'tiles'|'list'
 * @param {Array} [config.data] - metricts that should be displayed
 * @param {String} data[].title - metric title
 * @param {Number} data[].score - metric score
 * @param {Array} data[].info - array of info labels
 * @returns {readinessDashboard}
 */
function dashboardFactory(config) {
    var specs = {
        /**
         * Clear dashboard
         */
        clearDashboard: function clearDashboard() {
            this.getElement()
                .find('.dashboard-metrics_container')
                .empty();
            this.toggleWarningMessage(false);
        },
        /**
         * Return metric check state according to it socre
         *
         * @param {Number} socre - metric score
         */
        mapScoreToState: function mapScoreToState(score) {
            var scoreState = this.config.scoreState;

            if (score > scoreState.warn) {
                return 'success';
            } else if (score > scoreState.error) {
                return 'warn';
            }

            return 'error';
        },
        /**
         * Render list of provided metircs
         *
         * @param {Array} data - metrics data
         * @param {String} data[].title - metric title
         * @param {Number} data[].score - metric score
         * @param {Array} data[].info - array of info labels
         */
        renderMetrics: function renderMetrics(data) {
            var $component = this.getElement();
            var $listContainer = $component.find('.dashboard-metrics_container');
            var self = this;

            if (data && data.length) {
                _.forEach(data, function(item) {
                    item.state = self.mapScoreToState(item.score);
                });

                this.toggleWarningMessage(
                    _.some(data, function(item) {
                        return item.score <= self.config.scoreState.warn;
                    })
                );

                var $metricsList = $(metricsListTpl({ data: data, layoutType: self.config.layoutType }));

                $listContainer.append($metricsList);
            }
        },
        /**
         * Toggle loading bar
         */
        toggleLoadingBar: function toggleLoadingBar(display) {
            this.getElement()
                .find('.dashboard-loading')
                .toggle(display);
        },
        /**
         * Toggle warning message
         */
        toggleWarningMessage: function toggleWarningMessage(display) {
            this.getElement()
                .find('.dashboard-warning')
                .toggle(display);
        }
    };

    /**
     * @typedef {dashboard}
     */
    return component(specs, defaults)
        .setTemplate(dashboardTpl)
        .on('init', function() {
            this.setState('loading', this.config.loading);
        })
        .on('render', function() {
            if (!this.is('loading')) {
                this.renderMetrics(this.config.data);
            } else {
                this.toggleLoadingBar(true);
            }
        })
        .init(config);
}

export default dashboardFactory;
