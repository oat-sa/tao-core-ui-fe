/*
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
 * Copyright (c) 2014-2021 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 *
 */

/**
 * Helps you to load and change item runner  themes at runtime
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import $ from 'jquery';
import _ from 'lodash';

//used to differentiate the stylesheets
const prefix = 'custom-theme-';

//where to attach the stylesheets
const $container = $('head').length ? $('head') : $('body');

const ns = 'themeloader';

/**
 * @typedef {Object} Theme
 * @property {String} id - theme identifier (unique)
 * @property {String} path  - theme location
 * @property {String} [name] - name to display
 */

/**
 * Trigger a theme change that is slightly delayed to be
 * reasonably sure all styles have been applied.
 *
 * @param themeId
 */
function triggerThemeChange(themeId) {
    _.delay(() => {
        $(document)
            .trigger(`themechange.${ns}`, [themeId])
            .trigger('themeapplied', [themeId]);
    }, 200);
}

/**
 * Create a stylesheet tag
 * @param {Theme} theme - the theme
 * @return {jQuery} the link node
 */
function createStyleSheet(theme) {
    const suffix = theme.id === 'base' ? 'base' : 'theme';
    const type = `${prefix}${suffix}`;
    return $('<link>').attr({
        rel: 'stylesheet',
        type: 'text/css',
        href: theme.path,
        'data-type': type,
        'data-name': theme.name || theme.id,
        'data-id': theme.id
    });
}

/**
 * Get the stylesheet
 * @param {String} id - the theme identifier
 * @returns {jQuery} the link
 */
function getLink(id) {
    return $(`link[data-id="${id}"][data-type^="${prefix}"]`, $container);
}

/**
 * Is the stylesheet attached to the container ?
 * @param {String} id - the theme identifier
 */
function isAttached(id) {
    return getLink(id).length > 0;
}

/**
 * Enable some nodes
 * @param {jQuery} $nodes - the nodes to enable
 * @returns {jQuery}
 */
function enable($nodes) {
    $nodes
        .prop('disabled', false)
        .removeProp('disabled')
        .removeAttr('disabled');
}

/**
 * Disable some nodes
 * @param {jQuery} $nodes - the nodes to disable
 * @returns {jQuery}
 */
function disable($nodes) {
    return $nodes.prop('disabled', true).attr('disabled', true); //add attr only for easiest inspection
}

/**
 * The themeLoader is a factory that returns a loader. Configured to load the given styles.
 *
 * @param {Object} config - the themes configuration
 * @param {String} config.base - the location of the base style
 * @param {String} [config.default] - the name of the default theme (one of the key of the available list )
 * @param {Theme[]} config.available - the list of available themes
 * @returns {Object} the loader
 * @throws TypeError if the config hasn't the correct form
 */
function themeLoader(config) {

    /*
     * validate config
     */
    if (!_.isPlainObject(config)) {
        throw new TypeError('Theme loader configuration is required');
    }

    if (!_.isString(config.base)) {
        throw new TypeError('Theme loader configuration is an object with a base property configuration');
    }

    if (!_.isArray(config.available) || !config.available.length) {
        throw new TypeError('No theme declared in the configuration');
    }

    for (let i in config.available) {
        if (
            !_.isPlainObject(config.available[i]) ||
            _.isEmpty(config.available[i].id) ||
            _.isEmpty(config.available[i].path)
        ) {
            throw new TypeError('There is a theme that does not contain an id or a path');
        }
    }

    /*
     * Extract data from config
     */
    const defaultTheme = config.default || _.head(_.map(config.available, 'id'));

    let activeTheme = defaultTheme;

    const themes = [{
        id: 'base',
        path: config.base,
        name: 'TAO'
    }].concat(config.available);

    const styles = {};

    _.forEach(themes, theme => {
        if (isAttached(theme.id)) {
            styles[theme.id] = getLink(theme.id);
        } else {
            styles[theme.id] = createStyleSheet(theme);
        }
    });

    /**
     * The loader instance
     */
    return {
        /**
         * Load the themes
         * @param {Boolean} [preload=false] - Only preload the themes without activating them
         * @returns {Object} chains
         */
        load(preload) {
            _.forEach(styles, ($link, id) => {
                if (!isAttached(id)) {
                    if (!preload && id === activeTheme) {
                        $link.on('load', () => triggerThemeChange(id));
                    }
                    disable($link);
                    $container.append($link);
                }
                if (!preload) {
                    if (id !== 'base' && id !== defaultTheme) {
                        disable($link);
                    } else {
                        enable($link);

                        activeTheme = id;
                        triggerThemeChange(activeTheme);
                    }
                }
            });
            return this;
        },

        /**
         * Unload the stylesheets (disable them)
         * @returns {Object} chains
         */
        unload() {
            disable($(`link[data-type^="${prefix}"]`, $container));

            return this;
        },

        /**
         * Change the current theme
         * @param {String} id - the theme id to use
         * @returns {Object} chains
         */
        change(id) {
            //support to change to the "default" theme regardless it's id
            if (_.includes(['base', 'default'], id) && !isAttached(id)) {
                id = defaultTheme;
            }

            if (isAttached(id)) {
                //disable all
                disable($(`link[data-type="${prefix}theme"]`, $container));

                //enable the theme only
                enable(getLink(id));

                activeTheme = id;
                triggerThemeChange(activeTheme);
            }
            return this;
        },

        /**
         * Return the current theme
         * @returns {String} activeTheme
         */
        getActiveTheme() {
            return activeTheme;
        }
    };
}

/**
 * @exports ui/themeLoader
 */
export default themeLoader;
