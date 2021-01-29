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
 * Copyright (c) 2020  (original work) Open Assessment Technologies SA;
 *
 * @author Oleksander Zagovorychev <zagovorichev@gmail.com>
 */

/**
 * Media editor
 * tools:
 *  - mediaSize - (change media size, responsive mode, sync width to heights, reset)
 *  - mediaAlignment - (position of the media)
 *  to be implemented:
 *  *- cropper
 *  *- change colors
 *  *- etc.
 */
import $ from 'jquery';
import _ from 'lodash';
import component from 'ui/component';
import mediaDimensionComponent from 'ui/mediaEditor/plugins/mediaDimension/mediaDimensionComponent';
import mediaAlignmentComponent from 'ui/mediaEditor/plugins/mediaAlignment/mediaAlignmentComponent';
import tpl from 'ui/mediaEditor/tpl/editor';

/**
 * @typedef {Object} mediaObject
 * @property $node
 * @property $container
 * @property type
 * @property src
 * @property width
 * @property height
 */

/**
 * @typedef {Object} mediaEditorConfig
 * @property mediaDimension {{active: boolean}}
 * @property mediaAlignment {{active: boolean}}
 */

/**
 * target - jQuery element with media $()
 * container - container to which an target is attached
 *
 * @type mediaEditorConfig
 * @private
 */
var defaultConfig = {
    mediaDimension: {
        active: false
    },
    mediaAlignment: {
        active: false
    }
};

/**
 * Creates media editor
 *
 * @param {Object} $container - jQuery pointer
 * @param {mediaObject} media
 * @param {mediaEditorConfig} config
 * @returns {component|*}
 */
export default function mediaEditorFactory($container, media, config) {
    /**
     * Active Plugins
     * @type {Array}
     */
    var plugins = [];

    /**
     * Current component
     */
    var mediaEditorComponent = component({}, defaultConfig);
    mediaEditorComponent
        .setTemplate(tpl)
        .on('init', function() {
            if (!media || !media.$node || !media.$node.length) {
                throw new Error('mediaEditorComponent requires media.$node');
            }
            if (!media || !media.$container || !media.$container.length) {
                throw new Error('mediaEditorComponent requires media.$container');
            }
            this.render($container);
        })
        .on('render', function() {
            var self = this;
            var $dimensionTools = $('.media-dimension', this.getTemplate());
            var $alignmentTools = $('.media-align', this.getTemplate());
            var dimensionPlugin;
            var alignmentPlugin;
            if (this.getConfig().mediaDimension.active) {
                dimensionPlugin = mediaDimensionComponent($dimensionTools, media, { responsive: media.responsive }).on(
                    'change',
                    function(conf) {
                        media.responsive = conf.responsive;
                        if (conf.responsive) {
                            // percent
                            media.width = conf.sizeProps['%'].current.width;
                            media.height = null;
                        } else {
                            media.width = conf.sizeProps.px.current.width;
                            media.height = conf.sizeProps.px.current.height;
                        }

                        self.trigger('change', media);
                    }
                );
                plugins.push(dimensionPlugin);
            }
            if (this.getConfig().mediaAlignment.active) {
                const alignmentPlugin = mediaAlignmentComponent($alignmentTools, media).spread(this, 'change');
                plugins.push(alignmentPlugin);
            }
        })
        .on('destroy', function() {
            _.forEach(plugins, function(plugin) {
                plugin.destroy();
            });
        });

    _.defer(function() {
        mediaEditorComponent.init(config);
    });

    return mediaEditorComponent;
}
