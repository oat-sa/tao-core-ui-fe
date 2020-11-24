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
    var $template, $fields;

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
             * Apply configurations to the view
             */
            update: function update(conf) {
                var selectedField;
                $fields.each(function(index) {
                    $fields[index].removeAttribute('checked');
                });
                if (conf === 'rgt') {
                    selectedField= $template.find('input[name="wrap-right"]');
                } else if (conf === 'lft') {
                    selectedField = $template.find('input[name="wrap-left"]');
                } else {
                    selectedField = $template.find('input[name="wrap-inline"]');
                }
                selectedField[0].setAttribute('checked', '')
                media.align = conf
                this.trigger('change', media);
            }
        }
    );

    mediaAlignmentComponent
        .on('init', function() {
            $template = $(tpl());
            $template.appendTo($container);
            $fields = $template.find('input');
            this.update(media.$node[0].className);
            $template.on('click', function() {
                this.update(media.$node[0].className);
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
