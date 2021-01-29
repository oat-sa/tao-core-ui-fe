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
            update(conf) {
                $template.find('input:checked').prop('checked', false);
                switch (conf) {
                    case 'wrap-right':
                        conf = 'right';
                        $template.find('input[name="wrap-right"]').prop('checked', true);
                        break;
                    case 'wrap-left':
                        conf = 'left';
                        $template.find('input[name="wrap-left"]').prop('checked', true);
                        break;
                    default:
                        conf = 'default';
                        $template.find('input[name="wrap-inline"]').prop('checked', true);
                        break;
                }
                media.align = conf;
                this.trigger('change', media);
            }
        }
    );

    mediaAlignmentComponent
        .on('init', function() {
            this.render($container);
        })
        .on('render', function () {
            $template = $(tpl());
            $template.appendTo($container);
            switch (media.$node[0].className) {
                case 'rgt':
                    this.update('wrap-right');
                    break;
                case 'lft':
                    this.update('wrap-left');
                    break;
                default:
                    this.update('wrap-inline');
                    break;
            }
            $template.on('click', event => {
                event.target.name && this.update(event.target.name);
            });
        })
        .on('destroy', function() {
            $template.remove();
        });

    _.defer(function() {
        mediaAlignmentComponent.init();
    });

    return mediaAlignmentComponent;
}
