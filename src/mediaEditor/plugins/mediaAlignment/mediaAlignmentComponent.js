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
 * @author Juan Luis Gutierrez Dos Santos <juanluis.gutierrezdossantos@taotesting.com>
 */

/**
 * Controls media size
 */
import $ from 'jquery';
import _ from 'lodash';
import component from 'ui/component';
import tpl from 'ui/mediaEditor/plugins/mediaAlignment/tpl/mediaAlignment';
import 'ui/mediaEditor/plugins/mediaAlignment/style.css';

/**
 * Creates mediaAlignment component
 * @param $container
 * @param media
 * @param config
 * @fires "changed" - on State changed
 * return {component|*}
 */
export default function mediaAlignmentFactory($container, media, config) {
    /**
     * Collections of the jquery elements grouped by type
     */
    var $blocks, $slider, $fields;

    /**
     * Template of the dimension controller
     */
    var $template;

    /**
     * Size properties of the media control panel
     * @typedef {Object} mediaSizeProps
     * @property showResponsiveToggle boolean
     * @property responsive boolean
     * @property sizeProps sizeProps
     * @property syncDimensions boolean
     * @property denyCustomRatio boolean
     * @property precision number
     * @property showReset boolean
     */

    /**
     * Current component
     */
    var mediaAlignmentComponent = component(
        {
            /**
             * Init the component to the initial state
             */
            init: function init() {

                // trigger event
                this.trigger('init');
                return this;
            },
            /**
             * Apply configurations to the view
             */
            update: function update() {

                // trigger event
                this.trigger('change');
            }
        }
    );

    mediaAlignmentComponent
        .on('init', function() {
            this.render($container);
        })
        .on('render', function() {
            $template = $(tpl());

            $template.appendTo(this.getContainer());

            mediaAlignmentComponent.update();
        })
        .on('destroy', function() {
            $template.remove();
        });

    _.defer(function() {
        mediaAlignmentComponent.init(config);
    });

    return mediaAlignmentComponent;
}
