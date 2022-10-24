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
import component from 'ui/component';
import breadcrumbsTpl from 'ui/breadcrumbs/tpl/breadcrumbs';
import 'ui/breadcrumbs/css/breadcrumbs.css';

/**
 * Defines a breadcrumbs component
 * @type {Object}
 */
let breadcrumbs = {
    /**
     * Updates the component with a new set of entries
     * @param {Array} newBreadcrumbs
     * @param {String} [newBreadcrumbs.id] - The identifier of the breadcrumb
     * @param {String} [newBreadcrumbs.url] - The URL targeted by the breadcrumb
     * @param {String} [newBreadcrumbs.label] - The displayed label
     * @param {String} [newBreadcrumbs.data] - An extra label to display, usually related to the current context
     * @param {Array} [newBreadcrumbs.entries] - A list of parallels links
     * @param {Array} [newBreadcrumbs.cls] - CSS class to add to the container
     * @returns {jQuery}
     */
    update: function update(newBreadcrumbs) {
        var $oldComponent = this.getContainer();
        var $component;

        this.config.breadcrumbs = newBreadcrumbs;

        /**
         * Notifies the update
         * @event breadcrumbs#update
         * @param {breadcrumbs} newBreadcrumbs
         */
        this.trigger('update', newBreadcrumbs, this);

        $component = this.render();

        if ($oldComponent) {
            if (!this.config.renderTo) {
                $oldComponent.replaceWith($component);
            } else if (!this.config.replace) {
                $oldComponent.remove();
            }
        }

        return $component;
    }
};

/**
 * Remove the link from the last crumb
 */
var removeLastLink = function removeLastLink() {
    let newBreadcrumbs = this.config.breadcrumbs;

    if (newBreadcrumbs && newBreadcrumbs.length) {
        newBreadcrumbs = _.cloneDeep(this.config.breadcrumbs);
        newBreadcrumbs[newBreadcrumbs.length - 1].url = null;
        this.config.breadcrumbs = newBreadcrumbs;
    }
};

/**
 * Builds an instance of the breadcrumbs component
 * @param {Object} config
 * @param {Array} [config.breadcrumbs] - The list of entries to display
 * @param {jQuery|HTMLElement|String} [config.renderTo] - An optional container in which renders the component
 * @param {Boolean} [config.replace] - When the component is appended to its container, clears the place before
 * @returns {breadcrumbs}
 */
var breadcrumbsFactory = function breadcrumbsFactory(config) {
    return component(breadcrumbs)
        .on('init', removeLastLink)
        .on('update', removeLastLink)
        .setTemplate(breadcrumbsTpl)
        .init(config);
};

export default breadcrumbsFactory;
