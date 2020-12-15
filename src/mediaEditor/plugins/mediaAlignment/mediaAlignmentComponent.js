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
export default function mediaAlignmentFactory($container, media) {
    /**
     * Template of the dimension controller
     */
    let $template;

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
    const mediaAlignmentComponent = component(
        {
            /**
             * Apply configurations to the view
             */
            update: function update(conf) {
                const inputValue = $template.find('input[name="wrap"]').val(conf);
                switch (inputValue) {
                    case 'wrap-right':
                        conf = 'right';
                        break;
                    case 'wrap-left':
                        conf = 'left';
                        break;
                    default:
                        conf = 'default';
                        break;
                }
                media.align = conf;
                this.trigger('change', media);
            }
        }
    );

    mediaAlignmentComponent
        .on('init', function() {
            $template = $(tpl());
            $template.appendTo($container);
            switch (media.$node[0].className) {
                case 'rgt':
                    $template.find('input[name="wrap"]').val('wrap-right');
                    break;
                case 'lft':
                    $template.find('input[name="wrap"]').val('wrap-left');
                    break;
                default:
                    $template.find('input[name="wrap"]').val('wrap-inline');
                    break;
            }
            $template.on('click', function(event) {
                event.target.value && this.update(event.target.value);
            }.bind(this));
        })
        .on('destroy', function() {
            $template.remove();
        });

    _.defer(function() {
        mediaAlignmentComponent.init();
    });

    return mediaAlignmentComponent;
}
